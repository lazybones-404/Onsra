/**
 * ai-query — Onsra Edge Function
 *
 * Secure proxy between the app and Google Gemini.
 * The Gemini API key NEVER leaves this function environment.
 *
 * Required secrets (set in Supabase Dashboard → Edge Functions → Secrets):
 *   GEMINI_API_KEY            — from aistudio.google.com/apikey (free tier)
 *   SUPABASE_SERVICE_ROLE_KEY — auto-injected by Supabase
 *
 * Request body:
 *   {
 *     message: string,
 *     feature: 'tone-advisor' | 'troubleshooter' | 'lyric-assistant' |
 *              'chord-suggestions' | 'tempo-reference' | 'artwork-checker',
 *     conversationHistory?: { role: 'user' | 'assistant', content: string }[]
 *   }
 *
 * Response: Server-Sent Events stream
 *   data: {"text":"..."}\n\n   (token chunks)
 *   data: [DONE]\n\n           (end of stream)
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { GoogleGenerativeAI } from 'https://esm.sh/@google/generative-ai@0.21.0';

// ─── Types ────────────────────────────────────────────────────────────────────

type Feature =
  | 'tone-advisor'
  | 'troubleshooter'
  | 'lyric-assistant'
  | 'chord-suggestions'
  | 'tempo-reference'
  | 'artwork-checker';

interface RequestBody {
  message: string;
  feature: Feature;
  conversationHistory?: { role: 'user' | 'assistant'; content: string }[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Gemini uses maxOutputTokens — keep values consistent with original limits
const MAX_OUTPUT_TOKENS_PER_FEATURE: Record<Feature, number> = {
  'tone-advisor': 400,
  'troubleshooter': 500,
  'lyric-assistant': 300,
  'chord-suggestions': 150,
  'tempo-reference': 200,
  'artwork-checker': 300,
};

const DAILY_REQUEST_LIMIT = 50;
const MAX_HISTORY_TURNS = 10;
const MAX_MESSAGE_LENGTH = 2000;

// ─── Main handler ─────────────────────────────────────────────────────────────

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  try {
    // ── 1. Parse and validate request body ──────────────────────────────────
    const body: RequestBody = await req.json();
    const { message, feature, conversationHistory = [] } = body;

    if (!message || typeof message !== 'string') {
      return errorResponse('message is required', 400);
    }
    if (!feature || !MAX_OUTPUT_TOKENS_PER_FEATURE[feature]) {
      return errorResponse('invalid feature', 400);
    }

    // ── 2. Verify user JWT ───────────────────────────────────────────────────
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return errorResponse('Unauthorized', 401);
    }

    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      return errorResponse('Unauthorized', 401);
    }

    // ── 3. Rate limiting: max 50 AI requests per user per day ───────────────
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const today = new Date().toISOString().split('T')[0];
    const { count } = await supabaseAdmin
      .from('analytics_events')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('event_name', 'ai_query')
      .gte('created_at', `${today}T00:00:00.000Z`);

    if ((count ?? 0) >= DAILY_REQUEST_LIMIT) {
      return new Response(
        JSON.stringify({
          error: 'daily_limit_reached',
          message: "You've reached today's AI limit (50 requests). Come back tomorrow!",
        }),
        { status: 429, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      );
    }

    // ── 4. Fetch user's tone memory ──────────────────────────────────────────
    const { data: toneMemory } = await supabaseAdmin
      .from('ai_tone_memory')
      .select('instrument, amp_model, preferences_json, rejections_json')
      .eq('user_id', user.id)
      .maybeSingle();

    // ── 5. Build Gemini request ──────────────────────────────────────────────
    const sanitizedMessage = sanitizeInput(message);
    const systemPrompt = buildSystemPrompt(feature, toneMemory);

    // Gemini uses 'model' for the assistant role (not 'assistant')
    const history = conversationHistory
      .slice(-MAX_HISTORY_TURNS)
      .map((msg) => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      }));

    const genAI = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY')!);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      systemInstruction: systemPrompt,
      generationConfig: {
        maxOutputTokens: MAX_OUTPUT_TOKENS_PER_FEATURE[feature],
        temperature: 0.7,
      },
    });

    const chat = model.startChat({ history });

    // ── 6. Log analytics event ───────────────────────────────────────────────
    await supabaseAdmin.from('analytics_events').insert({
      user_id: user.id,
      event_name: 'ai_query',
      properties_json: { feature },
    });

    // ── 7. Stream Gemini response back to client ─────────────────────────────
    const encoder = new TextEncoder();

    const readable = new ReadableStream({
      async start(controller) {
        try {
          const result = await chat.sendMessageStream(sanitizedMessage);
          let fullResponseText = '';

          for await (const chunk of result.stream) {
            const tokenText = chunk.text();
            if (tokenText) {
              fullResponseText += tokenText;
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ text: tokenText })}\n\n`)
              );
            }
          }

          // Update tone memory after tone advisor sessions
          if (feature === 'tone-advisor' && fullResponseText) {
            await updateToneMemory(
              supabaseAdmin,
              user.id,
              sanitizedMessage,
              fullResponseText,
              toneMemory
            );
          }

          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (err) {
          const errMsg = err instanceof Error ? err.message : 'Stream error';
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: errMsg })}\n\n`)
          );
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        ...CORS_HEADERS,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (err) {
    console.error('[ai-query] Unhandled error:', err);
    return errorResponse('Internal server error', 500);
  }
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function errorResponse(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

function sanitizeInput(input: string): string {
  return input
    .replace(/\[INST\]|\[\/INST\]|<\|im_start\|>|<\|im_end\|>/g, '')
    .replace(/ignore\s+(previous|above|all)\s+instructions/gi, '')
    .replace(/system\s+prompt/gi, 'system configuration')
    .trim()
    .slice(0, MAX_MESSAGE_LENGTH);
}

function buildSystemPrompt(feature: Feature, toneMemory: Record<string, unknown> | null): string {
  const memoryContext = toneMemory
    ? `\n\nUser's saved tone context:\n- Instrument: ${toneMemory.instrument}\n- Amp: ${toneMemory.amp_model ?? 'not specified'}\n- Past preferences: ${JSON.stringify(toneMemory.preferences_json)}\n- Rejected settings: ${JSON.stringify(toneMemory.rejections_json)}`
    : '';

  const prompts: Record<Feature, string> = {
    'tone-advisor': `You are an expert amp and tone advisor for musicians. You give specific, actionable settings for physical amps and pedals — never generic. You are instrument-aware: guitar, bass, and keys have different amp types, pedal chains, and terminology. When given an amp model, calibrate all settings to that amp's actual controls and character. Output settings as specific knob positions (e.g. "Gain: 6/10, Bass: 5/10") when possible. Build on previous context — adjust iteratively, don't start from scratch.${memoryContext}`,

    'troubleshooter': `You are an expert instrument technician and gear troubleshooter. Diagnose problems with instruments, amps, cables, and effects through systematic follow-up questions. You have current knowledge of drivers, firmware, and gear. Ask one targeted follow-up question at a time to narrow down the issue, then give step-by-step fixes in plain language. Cover tuning problems, noise issues, signal chain problems, and anything a working musician encounters.`,

    'lyric-assistant': `You are a lyric co-writer. Mirror the user's established style, rhyme scheme, syllable count, and emotional tone exactly. You ONLY suggest — you never overwrite. When the user shares lyrics, offer a chorus, next verse, or bridge continuation in the same voice. Keep suggestions concise and musical. Label your output clearly: "Chorus suggestion:", "Bridge option:", etc.`,

    'chord-suggestions': `You are a music theory expert and composer. Suggest chord progressions that go beyond the obvious I-IV-V based on the key, mood, and genre provided. Include borrowed chords, modal interchange, and secondary dominants where appropriate. Return progressions as arrays of chord names (e.g. ["Cmaj7", "Am7", "Fmaj7", "G7sus4"]) with a brief description of the feel and why it works. Give 3 distinct options.`,

    'tempo-reference': `You are a drummer's coach and groove expert. Interpret groove descriptions in plain, conversational language and return: exact BPM range, feel description (e.g. "tight and driving" vs "loose and behind the beat"), straight vs swung subdivision, and 3-5 specific reference tracks with artist and song name to study. Be precise — drummers understand fine nuance in feel.`,

    'artwork-checker': `You are a music platform publishing specialist. You know the exact artwork requirements for Spotify, Apple Music, YouTube Music, SoundCloud, and Bandcamp (dimensions, file size, colour mode, format, text legibility rules). Given a description or specs of artwork, return a structured pass/fail assessment per platform with specific, actionable fixes for any failures.`,
  };

  return prompts[feature];
}

async function updateToneMemory(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  userMessage: string,
  _aiResponse: string,
  existing: Record<string, unknown> | null
): Promise<void> {
  const preferences: Record<string, string> = (existing?.preferences_json as Record<string, string>) ?? {};
  const rejections: Record<string, string> = (existing?.rejections_json as Record<string, string>) ?? {};

  const negativeSignals = ['too bright', 'too dark', 'too harsh', 'too thin', 'too muddy', 'too much', 'not enough', 'hate', "don't like"];
  const isRejection = negativeSignals.some((p) => userMessage.toLowerCase().includes(p));

  const key = Date.now().toString();
  if (isRejection) {
    rejections[key] = userMessage.slice(0, 120);
  } else if (userMessage.length > 15) {
    preferences[key] = userMessage.slice(0, 120);
  }

  const trimmed = (obj: Record<string, string>) =>
    Object.fromEntries(Object.entries(obj).slice(-20));

  await supabase.from('ai_tone_memory').upsert(
    {
      user_id: userId,
      instrument: (existing?.instrument as string) ?? 'guitarist',
      amp_model: (existing?.amp_model as string) ?? null,
      preferences_json: trimmed(preferences),
      rejections_json: trimmed(rejections),
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  );
}
