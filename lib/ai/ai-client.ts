/**
 * AI client — typed wrapper around the ai-query edge function.
 * Handles SSE streaming and surfaces results as async generators.
 */

import { getSupabase } from '@/lib/supabase/client';

export type Feature =
  | 'tone-advisor'
  | 'troubleshooter'
  | 'signal-chain'
  | 'lyric-chord-assist'
  | 'chord-suggestions'
  | 'drum-tuner-guide'
  | 'tempo-reference'
  | 'artwork-checker';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;

export async function* streamAiResponse(
  feature: Feature,
  message: string,
  context?: Record<string, unknown>,
  history?: Message[]
): AsyncGenerator<string, void, unknown> {
  const supabase = getSupabase();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    // #region agent log
    fetch('http://127.0.0.1:7309/ingest/5c21ba59-ddc3-47af-b5d6-81fd906f437d',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'376e0b'},body:JSON.stringify({sessionId:'376e0b',runId:'pre-fix',hypothesisId:'F',location:'lib/ai/ai-client.ts:streamAiResponse',message:'AI call blocked: no session',data:{feature},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    throw new Error('Not authenticated');
  }

  // #region agent log
  fetch('http://127.0.0.1:7309/ingest/5c21ba59-ddc3-47af-b5d6-81fd906f437d',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'376e0b'},body:JSON.stringify({sessionId:'376e0b',runId:'pre-fix',hypothesisId:'F',location:'lib/ai/ai-client.ts:streamAiResponse',message:'AI request start',data:{feature,messageLen:message.length,hasContext:!!context,historyLen:history?.length??0},timestamp:Date.now()})}).catch(()=>{});
  // #endregion

  const response = await fetch(`${SUPABASE_URL}/functions/v1/ai-query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({
      message,
      feature,
      context: context ?? {},
      conversationHistory: history ?? [],
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    // #region agent log
    fetch('http://127.0.0.1:7309/ingest/5c21ba59-ddc3-47af-b5d6-81fd906f437d',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'376e0b'},body:JSON.stringify({sessionId:'376e0b',runId:'pre-fix',hypothesisId:'F',location:'lib/ai/ai-client.ts:response',message:'AI request failed',data:{feature,status:response.status,error:(error as any)?.message??(error as any)?.error??'unknown'},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    throw new Error(error.message ?? error.error ?? `HTTP ${response.status}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6).trim();
        if (data === '[DONE]') return;

        try {
          const parsed = JSON.parse(data);
          if (parsed.error) throw new Error(parsed.error);
          if (parsed.text) yield parsed.text;
        } catch (e) {
          if (e instanceof Error && e.message !== 'Unexpected end of JSON input') {
            throw e;
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

/** Collect all SSE tokens into a single string (non-streaming) */
export async function fetchAiResponse(
  feature: Feature,
  message: string,
  context?: Record<string, unknown>,
  history?: Message[]
): Promise<string> {
  let result = '';
  for await (const token of streamAiResponse(feature, message, context, history)) {
    result += token;
  }
  return result;
}
