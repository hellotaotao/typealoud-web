import { createHash } from 'node:crypto';
import {
  INSTALL_DAILY_CHARS, IP_DAILY_CHARS, IP_REQUESTS_PER_MINUTE, MAX_BODY_BYTES, MAX_TEXT_CHARS,
} from './limits.js';

const INSTALL_ID = /^[A-Za-z0-9-]{16,64}$/;
const APP_VERSION = /^[0-9A-Za-z.+-]{1,32}$/;
const TWO_DAYS = 2 * 24 * 60 * 60;

function reply(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

function clientIp(request) {
  return (request.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || 'unknown';
}

async function readJson(request) {
  const raw = await request.text();
  if (Buffer.byteLength(raw) > MAX_BODY_BYTES) return { tooLarge: true };
  try {
    return { value: JSON.parse(raw) };
  } catch {
    return {};
  }
}

// Builds the request handler. Everything it touches is injected so tests can run it offline:
// `store` holds the counters, `polish(text, request)` calls the model (it gets the request so it
// can take the deployment's credential from it), `log` receives one line per request.
// No line and no key ever contains dictated text.
export function createPolishHandler({ store, polish, ipSalt, log = () => {}, now = () => new Date() }) {
  return async function handle(request) {
    const started = Date.now();
    const done = (status, body, fields = {}) => {
      log({ event: 'polish', status, ms: Date.now() - started, ...fields });
      return reply(status, body);
    };

    if (request.method !== 'POST') return done(405, { error: 'method' });
    const parsed = await readJson(request);
    if (parsed.tooLarge) return done(413, { error: 'too_long' });
    const { text, installId, appVersion } = parsed.value ?? {};
    if (typeof text !== 'string' || !text.trim() || typeof installId !== 'string' || !INSTALL_ID.test(installId)
      || (appVersion !== undefined && (typeof appVersion !== 'string' || !APP_VERSION.test(appVersion)))) {
      return done(400, { error: 'bad_request' });
    }
    const chars = Array.from(text).length;
    if (chars > MAX_TEXT_CHARS) return done(413, { error: 'too_long' }, { chars });

    const at = now();
    const day = at.toISOString().slice(0, 10);
    const minute = at.toISOString().slice(0, 16);
    // The address is only ever stored as a salted hash, and only for two days.
    const ip = createHash('sha256').update(`${ipSalt}:${clientIp(request)}`).digest('hex').slice(0, 24);
    const keys = {
      install: `chars:install:${installId}:${day}`,
      ip: `chars:ip:${ip}:${day}`,
      rate: `rate:ip:${ip}:${minute}`,
    };
    const fields = { chars, installId, appVersion };

    let counters;
    try {
      counters = await store.pipeline([
        ['GET', keys.install], ['GET', keys.ip], ['INCR', keys.rate], ['EXPIRE', keys.rate, 120],
      ]);
    } catch {
      // Without counters there are no limits, so there is no service.
      return done(503, { error: 'unavailable' }, fields);
    }
    const [installChars, ipChars, requestsThisMinute] = counters.map((value) => Number(value ?? 0));
    if (requestsThisMinute > IP_REQUESTS_PER_MINUTE) return done(429, { error: 'rate' }, fields);
    if (installChars + chars > INSTALL_DAILY_CHARS || ipChars + chars > IP_DAILY_CHARS) {
      return done(429, { error: 'quota' }, fields);
    }

    let result;
    try {
      result = await polish(text, request);
    } catch (error) {
      if (error?.code === 'budget') return done(503, { error: 'budget' }, fields);
      return done(503, { error: 'upstream' }, { ...fields, reason: String(error?.message ?? error).slice(0, 40) });
    }

    try {
      await store.pipeline([
        ['INCRBY', keys.install, chars], ['EXPIRE', keys.install, TWO_DAYS],
        ['INCRBY', keys.ip, chars], ['EXPIRE', keys.ip, TWO_DAYS],
      ]);
    } catch {
      // The user already has their text; a missed count is cheaper than a failed dictation.
    }
    const { prompt_tokens: inTokens, completion_tokens: outTokens } = result.usage ?? {};
    return done(200, { text: result.text }, { ...fields, outChars: Array.from(result.text).length, inTokens, outTokens });
  };
}
