import { GeminiRawResponse } from './recommendations.types';

const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
const DEFAULT_MODEL = 'gemini-2.5-flash';

const MAX_RETRIES = 3;
const MAX_WAIT_MS = 25_000;
const FALLBACK_WAIT_MS = 5_000;
const BASE_BACKOFF_MS = 2_000;

const MAX_OUTPUT_TOKENS = 8192;

interface GeminiApiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
    finishReason?: string;        
  }>;
  error?: {
    code: number;
    message: string;
    status: string;
    details?: Array<{
      '@type': string;
      retryDelay?: string;
      violations?: Array<{
        quotaId?: string;
        quotaMetric?: string;
      }>;
    }>;
  };
}

const parseRetryDelay = (delay?: string): number => {
  if (!delay) return FALLBACK_WAIT_MS;
  const match = delay.match(/^(\d+(?:\.\d+)?)s$/);
  if (!match) return FALLBACK_WAIT_MS;
  const seconds = parseFloat(match[1]);
  return Math.ceil(seconds * 1000) + 500;
};

const analyze429 = (errorBody: string): {
  retryAfterMs: number;
  isHardQuota: boolean;
  humanMessage: string;
} => {
  let parsed: GeminiApiResponse | null = null;
  try {
    parsed = JSON.parse(errorBody) as GeminiApiResponse;
  } catch {
    return {
      retryAfterMs: FALLBACK_WAIT_MS,
      isHardQuota: false,
      humanMessage: 'Rate limited by Gemini. Try again in a moment.',
    };
  }

  const details = parsed.error?.details ?? [];
  const retryInfo = details.find((d) => d['@type']?.includes('RetryInfo'));
  const retryAfterMs = parseRetryDelay(retryInfo?.retryDelay);

  const message = parsed.error?.message ?? '';
  const isHardQuota =
    /limit:\s*0/i.test(message) || /prepayment credits.*depleted/i.test(message);

  let humanMessage: string;
  if (isHardQuota) {
    humanMessage =
      'This Gemini API key has no available quota. ' +
      'Create a new API key in AI Studio (https://aistudio.google.com/apikey) ' +
      'attached to a fresh project on the free tier.';
  } else {
    humanMessage = 'Gemini rate limit reached. Please wait a minute and try again.';
  }

  return { retryAfterMs, isHardQuota, humanMessage };
};

// Витягує JSON з відповіді Gemini, прибираючи markdown обгортки

const extractJson = (text: string): string => {
  let cleaned = text.trim();

  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '');
  }

  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  }

  return cleaned.trim();
};

// Спроба врятувати обрізаний JSON. Якщо Gemini вперся в maxOutputTokens посеред масиву - відкидаємо незавершений останній об'єкт і дозакриваємо ] }

const tryRecoverTruncatedJson = (text: string): string | null => {
  const arrayStart = text.indexOf('"recommendations"');
  if (arrayStart === -1) return null;

  const bracketStart = text.indexOf('[', arrayStart);
  if (bracketStart === -1) return null;

  // Парсимо посимвольно після [, відстежуючи об'єкти на верхньому рівні масиву
  let depth = 0;          // глибина { } всередині поточного елемента
  let inString = false;
  let escape = false;
  let lastClosedObjectEnd = -1;

  for (let i = bracketStart + 1; i < text.length; i += 1) {
    const ch = text[i];

    if (escape) { escape = false; continue; }
    if (ch === '\\' && inString) { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;

    if (ch === '{') depth += 1;
    else if (ch === '}') {
      depth -= 1;
      if (depth === 0) lastClosedObjectEnd = i;
    }
  }

  if (lastClosedObjectEnd === -1) return null; // ні одного цілого об'єкта тоді нема що рятувати

  // Беремо все до останнього цілого } включно і дозакриваємо масив + кореневий об'єкт
  const recovered = text.slice(0, lastClosedObjectEnd + 1) + ']}';
  return recovered;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const callGeminiOnce = async (
  prompt: string,
  apiKey: string,
  model: string
): Promise<
  | { ok: true; data: GeminiRawResponse; truncated: boolean }
  | { ok: false; status: number; body: string; retriable: boolean }
> => {
  const url = `${GEMINI_BASE_URL}/${model}:generateContent?key=${apiKey}`;

  const body = {
    contents: [
      {
        role: 'user',
        parts: [{ text: prompt }],
      },
    ],
    generationConfig: {
      temperature: 0.8,
      topP: 0.95,
      maxOutputTokens: MAX_OUTPUT_TOKENS,
      responseMimeType: 'application/json',
    },
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    return { ok: false, status: response.status, body: errorText, retriable: true };
  }

  const data = (await response.json()) as GeminiApiResponse;

  if (data.error) {
    return {
      ok: false,
      status: data.error.code,
      body: JSON.stringify({ error: data.error }),
      retriable: true,
    };
  }

  const candidate = data.candidates?.[0];
  const rawText = candidate?.content?.parts?.[0]?.text;
  const finishReason = candidate?.finishReason;

  if (!rawText) {
    return { ok: false, status: 500, body: 'Gemini returned an empty response', retriable: true };
  }

  // Чи відповідь обрізалась через ліміт токенів?
  const truncatedByTokens = finishReason === 'MAX_TOKENS';

  const jsonText = extractJson(rawText);

  let parsed: GeminiRawResponse | null = null;

  // Перша спроба - звичайний JSON.parse
  try {
    parsed = JSON.parse(jsonText) as GeminiRawResponse;
  } catch {
    // Не вдалось - пробуємо врятувати обрізаний JSON
    const recovered = tryRecoverTruncatedJson(jsonText);
    if (recovered) {
      try {
        parsed = JSON.parse(recovered) as GeminiRawResponse;
        console.warn(
          `[Gemini] Recovered from truncated JSON. ` +
            `finishReason=${finishReason}. Saved ${parsed.recommendations?.length ?? 0} recs.`
        );
      } catch {
        parsed = null;
      }
    }
  }

  if (!parsed) {
    console.error(
      `Gemini JSON parse failed. finishReason=${finishReason}. Raw text:`,
      rawText.slice(0, 1000) + (rawText.length > 1000 ? '...[truncated]' : '')
    );
    return {
      ok: false,
      status: 500,
      body: 'Gemini returned malformed JSON',
      retriable: true, // ретраїмо - наступна спроба може дійти до кінця
    };
  }

  if (!Array.isArray(parsed.recommendations)) {
    return {
      ok: false,
      status: 500,
      body: 'Gemini response missing "recommendations" array',
      retriable: true,
    };
  }

  return { ok: true, data: parsed, truncated: truncatedByTokens };
};

const isRetriableStatus = (status: number): boolean => {
  return status === 429 || status === 503 || status === 500;
};

export const callGemini = async (prompt: string): Promise<GeminiRawResponse> => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured on the server');
  }

  const model = process.env.GEMINI_MODEL || DEFAULT_MODEL;

  let lastError: { status: number; body: string } | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    const result = await callGeminiOnce(prompt, apiKey, model);

    if (result.ok) {
      return result.data;
    }

    lastError = { status: result.status, body: result.body };

    if (!result.retriable || !isRetriableStatus(result.status) || attempt === MAX_RETRIES) {
      break;
    }

    let waitMs: number;

    if (result.status === 429) {
      const { retryAfterMs, isHardQuota, humanMessage } = analyze429(result.body);
      if (isHardQuota) throw new Error(humanMessage);
      if (retryAfterMs > MAX_WAIT_MS) throw new Error(humanMessage);
      waitMs = retryAfterMs;
    } else {
      // 503 / 500 / parse fail - exponential backoff: 2с, 4с, 8с
      waitMs = Math.min(BASE_BACKOFF_MS * Math.pow(2, attempt), MAX_WAIT_MS);
    }

    console.warn(
      `[Gemini] ${result.status} on attempt ${attempt + 1}/${MAX_RETRIES + 1}. ` +
        `Waiting ${waitMs}ms before retry...`
    );
    await sleep(waitMs);
  }

  if (lastError?.status === 503) {
    throw new Error(
      'Gemini is currently overloaded. This usually clears up in a minute — please try again.'
    );
  }
  if (lastError?.body === 'Gemini returned malformed JSON') {
    throw new Error(
      'Gemini returned an incomplete response several times. Please try again — this is usually transient.'
    );
  }

  throw new Error(
    `Gemini API error ${lastError?.status ?? 'unknown'}: ${lastError?.body ?? 'no body'}`
  );
};

export const getModelName = (): string => {
  return process.env.GEMINI_MODEL || DEFAULT_MODEL;
};