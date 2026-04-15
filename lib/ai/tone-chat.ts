/**
 * Tone chat SSE client.
 *
 * Calls the ai-query Supabase Edge Function and returns an async
 * iterator that yields text chunks as they arrive in the SSE stream.
 *
 * Usage:
 *   for await (const chunk of streamToneAdvice({ message, feature, history })) {
 *     setResponse(prev => prev + chunk);
 *   }
 */

import { getSupabase } from '@/lib/supabase/client';

const EDGE_FUNCTION_URL = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/ai-query`;

export type AiFeature =
  | 'tone-advisor'
  | 'troubleshooter'
  | 'lyric-assistant'
  | 'chord-suggestions'
  | 'tempo-reference'
  | 'artwork-checker';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface StreamOptions {
  message: string;
  feature: AiFeature;
  conversationHistory?: ChatMessage[];
}

/**
 * Stream AI response as an async iterator of text chunks.
 * Requires an authenticated Supabase session.
 * Throws on network or auth errors; yields error text for AI errors.
 */
export async function* streamAiResponse(options: StreamOptions): AsyncGenerator<string> {
  const supabase = getSupabase();
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  if (!token) {
    yield 'Sign in to use AI features.';
    return;
  }

  const response = await fetch(EDGE_FUNCTION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      apikey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
    },
    body: JSON.stringify({
      message: options.message,
      feature: options.feature,
      conversationHistory: options.conversationHistory ?? [],
    }),
  });

  if (response.status === 429) {
    const body = await response.json().catch(() => ({}));
    yield (body as { message?: string }).message ?? "You've reached today's AI limit. Try again tomorrow.";
    return;
  }

  if (!response.ok) {
    yield `Error ${response.status}: ${response.statusText}`;
    return;
  }

  const reader = response.body?.getReader();
  if (!reader) {
    yield 'Streaming not supported in this environment.';
    return;
  }

  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6).trim();
        if (data === '[DONE]') return;

        try {
          const parsed = JSON.parse(data) as { text?: string; error?: string };
          if (parsed.error) {
            yield `Error: ${parsed.error}`;
            return;
          }
          if (parsed.text) {
            yield parsed.text;
          }
        } catch {
          // Ignore malformed SSE chunks
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

/**
 * Non-streaming convenience wrapper — resolves with the full response string.
 */
export async function fetchAiResponse(options: StreamOptions): Promise<string> {
  const chunks: string[] = [];
  for await (const chunk of streamAiResponse(options)) {
    chunks.push(chunk);
  }
  return chunks.join('');
}
