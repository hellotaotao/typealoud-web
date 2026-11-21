import assert from 'node:assert/strict';
import test from 'node:test';
import { createPolishHandler } from '../relay/handler.js';
import { BudgetExhausted, polishRequestBody, polishWithGateway } from '../relay/gateway.js';
import { INSTALL_DAILY_CHARS, IP_REQUESTS_PER_MINUTE, MAX_TEXT_CHARS } from '../relay/limits.js';
import { memoryStore } from '../relay/store.js';

const INSTALL = 'a1b2c3d4-e5f6-7890-abcd-ef0123456789';
const USAGE = { prompt_tokens: 700, prompt_tokens_details: { cached_tokens: 0 }, completion_tokens: 20 };

function setup(overrides = {}) {
  const store = memoryStore();
  const calls = [], logs = [];
  const handle = createPolishHandler({
    store,
    polish: async (text) => {
      calls.push(text);
      return { text: `polished:${text}`, usage: USAGE };
    },
    ipSalt: 'salt',
    log: (line) => logs.push(line),
    now: () => new Date('2026-10-13T03:04:05Z'),
    ...overrides,
  });
  const post = (body, ip = '203.0.113.7') => handle(new Request('https://relay.test/v1/polish', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': ip },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  }));
  return { store, calls, logs, handle, post };
}

test('polishes the text and charges the install and the address', async () => {
  const { store, post, calls } = setup();
  const response = await post({ text: '我们明天三点，不对，四点开会。', installId: INSTALL, appVersion: '1.20.0' });
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { text: 'polished:我们明天三点，不对，四点开会。' });
  assert.equal(calls.length, 1);
  assert.equal(store.values.get(`chars:install:${INSTALL}:2026-10-13`), 15);
  assert.equal([...store.values.keys()].filter((key) => key.startsWith('chars:ip:')).length, 1);
});

test('rejects malformed requests before spending anything', async () => {
  const { post, calls, handle } = setup();
  assert.equal((await post('not json')).status, 400);
  assert.equal((await post({ text: '  ', installId: INSTALL })).status, 400);
  assert.equal((await post({ text: '你好', installId: 'short' })).status, 400);
  assert.equal((await post({ text: '你好', installId: INSTALL, appVersion: 'a b' })).status, 400);
  assert.equal((await post({ text: '字'.repeat(MAX_TEXT_CHARS + 1), installId: INSTALL })).status, 413);
  assert.equal((await handle(new Request('https://relay.test/v1/polish'))).status, 405);
  assert.equal(calls.length, 0);
});

test('an install that would pass its daily allowance gets 429 without an upstream call', async () => {
  const { store, post, calls } = setup();
  store.values.set(`chars:install:${INSTALL}:2026-10-13`, INSTALL_DAILY_CHARS - 3);
  const response = await post({ text: '超过额度了', installId: INSTALL });
  assert.equal(response.status, 429);
  assert.deepEqual(await response.json(), { error: 'quota' });
  assert.equal(calls.length, 0);
});

test('one address is limited per minute across install ids', async () => {
  const { post } = setup();
  let last;
  for (let index = 0; index <= IP_REQUESTS_PER_MINUTE; index += 1) {
    last = await post({ text: '你好', installId: `${INSTALL.slice(0, -2)}${String(index).padStart(2, '0')}` });
  }
  assert.equal(last.status, 429);
  assert.deepEqual(await last.json(), { error: 'rate' });
});

test('a used-up gateway budget answers 503 budget and costs the user no allowance', async () => {
  const { store, post } = setup({ polish: async () => { throw new BudgetExhausted(); } });
  const response = await post({ text: '你好', installId: INSTALL });
  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), { error: 'budget' });
  assert.equal(store.values.has(`chars:install:${INSTALL}:2026-10-13`), false);
});

test('an upstream failure costs the user no allowance', async () => {
  const { store, post } = setup({ polish: async () => { throw new Error('upstream 500'); } });
  const response = await post({ text: '你好', installId: INSTALL });
  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), { error: 'upstream' });
  assert.equal(store.values.has(`chars:install:${INSTALL}:2026-10-13`), false);
});

test('a store outage fails closed', async () => {
  const { post, calls } = setup({ store: { pipeline: async () => { throw new Error('down'); } } });
  assert.equal((await post({ text: '你好', installId: INSTALL })).status, 503);
  assert.equal(calls.length, 0);
});

test('neither logs nor stored keys contain the text or the address', async () => {
  const { store, post, logs } = setup();
  await post({ text: '绝密内容不能落盘', installId: INSTALL }, '198.51.100.23');
  const written = JSON.stringify(logs) + JSON.stringify([...store.values.entries()]);
  assert.equal(written.includes('绝密'), false);
  assert.equal(written.includes('198.51.100.23'), false);
  assert.equal(logs.at(-1).status, 200);
  assert.equal(logs.at(-1).chars, 8);
});

test('the model request keeps reasoning off, bounds the output and requires zero retention', () => {
  const body = polishRequestBody('好的，收到。');
  assert.equal(body.model, 'openai/gpt-6-luna');
  assert.equal(body.reasoning_effort, 'none');
  assert.equal(body.max_completion_tokens, 6 * 2 + 64);
  assert.equal(body.messages[1].content, '<转写>\n好的，收到。\n</转写>');
  assert.deepEqual(body.providerOptions.gateway, { zeroDataRetention: true, only: ['openai'], serviceTier: 'fast' });
});

test('the gateway call sends the token and maps 402 to a used-up budget', async () => {
  const seen = [];
  const answer = (status, body) => async (url, init) => {
    seen.push({ url, init });
    return new Response(JSON.stringify(body), { status });
  };
  const ok = await polishWithGateway('你好', {
    token: 'tok',
    fetchImpl: answer(200, { choices: [{ message: { content: ' 你好。 ' } }], usage: USAGE }),
  });
  assert.deepEqual(ok, { text: '你好。', usage: USAGE });
  assert.equal(seen[0].url, 'https://ai-gateway.vercel.sh/v1/chat/completions');
  assert.equal(seen[0].init.headers.Authorization, 'Bearer tok');
  await assert.rejects(polishWithGateway('你好', { token: 'tok', fetchImpl: answer(402, {}) }), BudgetExhausted);
  await assert.rejects(polishWithGateway('你好', { token: 'tok', fetchImpl: answer(500, {}) }), /upstream 500/);
});
