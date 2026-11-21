# TypeAloud polish relay

`POST /v1/polish` takes dictated text, sends it to the polish model (OpenAI `gpt-6-luna` through
Vercel AI Gateway, with zero data retention required) with a fixed prompt, and returns the
cleaned text. It exists so users get polish without their own API key. Design,
measurements and the reasons for the limits are in the app repository:
`docs/superpowers/specs/2026-10-13-cloud-polish-design.md` in `hellotaotao/typealoud`.

The function is `api/polish.js`; `/v1/polish` rewrites to it. Everything else is in this directory.

```
POST /v1/polish
{ "text": "...", "installId": "random id, 16-64 chars", "appVersion": "1.20.0" }

200 { "text": "..." }
400 bad_request   413 too_long   429 rate | quota   503 budget | upstream | unavailable
```

The app treats anything but 200 as "insert the unpolished text".

## What is stored

Counters only: characters per install per day, and characters and requests per hashed address.
Dictated text is never written to the store or the logs. A log line holds the status, duration,
character and token counts, install id and app version. Every request asks AI Gateway for zero
data retention, so the gateway only routes it to OpenAI under its no-retention agreement and
fails it otherwise; the gateway itself records metadata (model, tokens, cost, duration), not text.

## Run the tests

```bash
node --test scripts/relay-handler.test.mjs   # also part of npm test
```

After changing `prompt.js`, compare against the saved cases (`scripts/polish-eval/cases.json`):

```bash
vercel env pull .env.local   # writes VERCEL_OIDC_TOKEN, valid 12 hours
node --env-file=.env.local scripts/polish-eval/run.mjs --runs 3
```

## Deploy

It deploys with the website and reaches AI Gateway with the project's OIDC token, which Vercel
passes to every function invocation, so there is no model API key to keep. The project needs:

1. **An Upstash Redis store** attached from the Vercel Marketplace (it sets `KV_REST_API_URL` and
   `KV_REST_API_TOKEN`).
2. **`IP_HASH_SALT`**: any long random string.
3. **A paid AI Gateway account** (Pro, or purchased AI Gateway credits): zero data retention is
   refused on Hobby, and every request requires it, so without this each call fails.
4. **A monthly AI Gateway budget on this project**, with the 50%, 75% and 100% email alerts on.
   This is the relay's only spend cap: once it is used up the gateway answers 402 and the relay
   answers `503 budget`. Without a budget the project's spend is unlimited.

   ```bash
   vercel ai-gateway budgets set project typealoud-web --amount 50 --refresh-period monthly
   ```

Without the store or the salt the endpoint answers 503. `AI_GATEWAY_API_KEY`, when set, is used
instead of the OIDC token (for running the function outside Vercel). Per-install and per-address
limits are in `limits.js`.
