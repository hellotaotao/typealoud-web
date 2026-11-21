import { polishWithGateway } from '../relay/gateway.js';
import { createPolishHandler } from '../relay/handler.js';
import { upstashStore } from '../relay/store.js';

const env = process.env;
const storeUrl = env.UPSTASH_REDIS_REST_URL ?? env.KV_REST_API_URL;
const storeToken = env.UPSTASH_REDIS_REST_TOKEN ?? env.KV_REST_API_TOKEN;
const configured = Boolean(storeUrl && storeToken && env.IP_HASH_SALT);

// On Vercel every invocation carries the project's OIDC token, which rotates within the hour, so
// it is read per request. AI_GATEWAY_API_KEY is for running the function anywhere else.
function gatewayToken(request) {
  return env.AI_GATEWAY_API_KEY || request.headers.get('x-vercel-oidc-token') || env.VERCEL_OIDC_TOKEN;
}

const handle = configured && createPolishHandler({
  store: upstashStore({ url: storeUrl, token: storeToken }),
  polish: async (text, request) => {
    const token = gatewayToken(request);
    if (!token) throw new Error('no gateway credential');
    return polishWithGateway(text, { token });
  },
  ipSalt: env.IP_HASH_SALT,
  log: (line) => console.log(JSON.stringify(line)),
});

export default {
  fetch(request) {
    if (!handle) return Response.json({ error: 'unavailable' }, { status: 503 });
    return handle(request);
  },
};
