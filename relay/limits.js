// Every number that bounds what the relay will do for free.

export const MAX_TEXT_CHARS = 4000;
export const MAX_BODY_BYTES = 32 * 1024;

// A person dictating two hours a day produces about 27,000 characters.
export const INSTALL_DAILY_CHARS = 50_000;
export const IP_DAILY_CHARS = 200_000;
export const IP_REQUESTS_PER_MINUTE = 60;

// The monthly spend cap is not here: it is the AI Gateway project budget, which counts what each
// request really cost and answers 402 once it is used up (see README.md, "Deploy").

export const MODEL = 'openai/gpt-6-luna';
// The gateway treats 'fast' as OpenAI's priority tier: about twice the price, measured 2026-10-13
// at roughly 1.5 s instead of 2-3 s for a one-minute dictation.
export const SERVICE_TIER = 'fast';
export const UPSTREAM_TIMEOUT_MS = 8000;

// Chinese runs about 0.7 tokens per character; the margin covers English and added punctuation.
export function maxOutputTokens(chars) {
  return chars * 2 + 64;
}
