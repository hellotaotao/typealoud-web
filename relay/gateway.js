import { MODEL, SERVICE_TIER, UPSTREAM_TIMEOUT_MS, maxOutputTokens } from './limits.js';
import { POLISH_PROMPT, wrapTranscript } from './prompt.js';

export const GATEWAY_URL = 'https://ai-gateway.vercel.sh/v1/chat/completions';

export function polishRequestBody(text) {
  return {
    model: MODEL,
    // Reasoning adds seconds to every dictation and bills its tokens as output.
    reasoning_effort: 'none',
    max_completion_tokens: maxOutputTokens(Array.from(text).length),
    messages: [
      { role: 'system', content: POLISH_PROMPT },
      { role: 'user', content: wrapTranscript(text) },
    ],
    providerOptions: {
      gateway: {
        // The privacy notice promises that OpenAI keeps nothing; the gateway refuses to route
        // the request anywhere that cannot honour that, instead of quietly retaining it.
        zeroDataRetention: true,
        // OpenAI only, so the notice can name who processes the text.
        only: ['openai'],
        serviceTier: SERVICE_TIER,
      },
    },
  };
}

// Thrown when the gateway's spend budget for this project is used up (HTTP 402).
export class BudgetExhausted extends Error {
  constructor() {
    super('budget');
    this.code = 'budget';
  }
}

// Resolves to { text, usage }; rejects on any failure, timeout, or empty answer.
// `token` is an AI Gateway API key or the deployment's OIDC token.
export async function polishWithGateway(text, { token, fetchImpl = fetch }) {
  const response = await fetchImpl(GATEWAY_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(polishRequestBody(text)),
    signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
  });
  if (response.status === 402) throw new BudgetExhausted();
  if (!response.ok) throw new Error(`upstream ${response.status}`);
  const body = await response.json();
  const polished = body.choices?.[0]?.message?.content?.trim();
  if (!polished) throw new Error('upstream empty');
  return { text: polished, usage: body.usage };
}
