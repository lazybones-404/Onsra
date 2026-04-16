/**
 * ai-query — Onsra Edge Function
 *
 * Secure proxy between the app and Google Gemini.
 * The Gemini API key NEVER leaves this function environment.
 *
 * Required secrets:
 *   GEMINI_API_KEY            — from aistudio.google.com/apikey
 *   SUPABASE_SERVICE_ROLE_KEY — auto-injected by Supabase
 *
 * Request body:
 *   {
 *     message: string,
 *     feature: Feature,
 *     context?: Record<string, unknown>,
 *     conversationHistory?: { role: 'user' | 'assistant', content: string }[]
 *   }
 *
 * Response: Server-Sent Events stream
 *   data: {"text":"..."}\n\n
 *   data: [DONE]\n\n
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { GoogleGenerativeAI } from 'https://esm.sh/@google/generative-ai@0.21.0';

type Feature =
  | 'tone-advisor'
  | 'troubleshooter'
  | 'signal-chain'
  | 'lyric-chord-assist'
  | 'chord-suggestions'
  | 'drum-tuner-guide'
  | 'tempo-reference'
  | 'artwork-checker';

interface RequestBody {
  message: string;
  feature: Feature;
  context?: Record<string, unknown>;
  conversationHistory?: { role: 'user' | 'assistant'; content: string }[];
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MAX_OUTPUT_TOKENS_PER_FEATURE: Record<Feature, number> = {
  'tone-advisor': 400,
  'troubleshooter': 500,
  'signal-chain': 600,
  'lyric-chord-assist': 800,
  'chord-suggestions': 300,
  'drum-tuner-guide': 500,
  'tempo-reference': 200,
  'artwork-checker': 300,
};

const DAILY_REQUEST_LIMIT = 75;
const MAX_HISTORY_TURNS = 10;
const MAX_MESSAGE_LENGTH = 3000;

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  try {
    const body: RequestBody = await req.json();
    const { message, feature, context = {}, conversationHistory = [] } = body;

    if (!message || typeof message !== 'string') {
      return errorResponse('message is required', 400);
    }
    if (!feature || !MAX_OUTPUT_TOKENS_PER_FEATURE[feature]) {
      return errorResponse('invalid feature', 400);
    }

    // ── Auth ─────────────────────────────────────────────────────────────────
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return errorResponse('Unauthorized', 401);

    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) return errorResponse('Unauthorized', 401);

    // ── Rate limiting ────────────────────────────────────────────────────────
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
          message: "You've reached today's AI limit. Come back tomorrow!",
        }),
        { status: 429, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      );
    }

    // ── Tone memory (for tone-advisor & signal-chain) ────────────────────────
    let toneMemory: Record<string, unknown> | null = null;
    if (feature === 'tone-advisor' || feature === 'signal-chain') {
      const { data } = await supabaseAdmin
        .from('ai_tone_memory')
        .select('instrument, amp_model, preferences_json, rejections_json')
        .eq('user_id', user.id)
        .maybeSingle();
      toneMemory = data;
    }

    // ── Build Gemini request ──────────────────────────────────────────────────
    const sanitizedMessage = sanitizeInput(message);
    const systemPrompt = buildSystemPrompt(feature, context, toneMemory);

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
        temperature: feature === 'lyric-chord-assist' ? 0.3 : 0.7,
      },
    });

    const chat = model.startChat({ history });

    // ── Log analytics ─────────────────────────────────────────────────────────
    await supabaseAdmin.from('analytics_events').insert({
      user_id: user.id,
      event_name: 'ai_query',
      properties_json: { feature },
    });

    // ── Stream response ───────────────────────────────────────────────────────
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

          if (feature === 'tone-advisor' || feature === 'signal-chain') {
            await updateToneMemory(supabaseAdmin, user.id, sanitizedMessage, toneMemory);
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

function buildSystemPrompt(
  feature: Feature,
  context: Record<string, unknown>,
  toneMemory: Record<string, unknown> | null
): string {
  const memoryCtx = toneMemory
    ? `\n\nUser's tone memory:\n- Instrument: ${toneMemory.instrument}\n- Amp: ${toneMemory.amp_model ?? 'not set'}\n- Preferences: ${JSON.stringify(toneMemory.preferences_json)}\n- Rejections: ${JSON.stringify(toneMemory.rejections_json)}`
    : '';

  const prompts: Record<Feature, string> = {
    'tone-advisor': `You are an expert amp and tone advisor. Give specific, actionable settings for physical amps and pedals — never generic. Output knob positions numerically (e.g. "Gain: 6/10"). Build on previous context iteratively.${memoryCtx}`,

    'troubleshooter': `You are an expert instrument technician and gear troubleshooter. Diagnose problems systematically. Ask ONE targeted follow-up question at a time to narrow the issue, then give step-by-step fixes. Cover noise, tuning issues, signal chain problems, and hardware faults.`,

    'signal-chain': `You are an expert signal chain advisor for musicians. Help the user design, troubleshoot, and optimise their signal chain — from instrument to amp or DAW. Cover pedal ordering, gain staging, impedance, noise floor, and cable quality. Be specific to their gear.${memoryCtx}`,

    'lyric-chord-assist': `You are a chord placement expert. The user will give you lyrics. Your job is to suggest where chords should be placed above the lyrics in the style of Ultimate Guitar. Return JSON in this exact format:
{
  "chart": [
    { "word": "word", "chord": "Am" | null, "lineBreak": false | true }
  ],
  "key": "Am",
  "summary": "brief description of the progression"
}
Place chords at natural beat/bar positions. Mark the start of each new line with lineBreak: true. Use standard chord names (Am, C, G, F, Em7, etc.). Context: ${JSON.stringify(context)}`,

    'chord-suggestions': `You are a music theory expert. Suggest chord progressions for the given key, genre, and mood. Go beyond I-IV-V — include borrowed chords, modal interchange, secondary dominants. Return 3 distinct progressions as: [{ "progression": ["Am", "F", "C", "G"], "feel": "melancholic", "description": "..." }]. Context: ${JSON.stringify(context)}`,

    'drum-tuner-guide': `You are an expert drum tuner. Given the drum specs (type, diameter, depth, head brand/type) and the measured resonant frequency from the mic, calculate the ideal tuning target frequency and provide a step-by-step tuning guide. Be specific about lug-by-lug tensioning technique. Context: ${JSON.stringify(context)}`,

    'tempo-reference': `You are a groove and tempo coach. Interpret groove descriptions and return: exact BPM range, feel (tight/loose, straight/swung), and 3-5 specific reference tracks the musician should study. Be precise — musicians understand fine nuance.`,

    'artwork-checker': `You are a music platform publishing specialist. Know the exact artwork requirements for Spotify, Apple Music, YouTube Music, SoundCloud, and Bandcamp (dimensions, file size, colour mode, format, text legibility). Return a structured pass/fail per platform with specific fixes.`,
  };

  return prompts[feature];
}

async function updateToneMemory(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  userMessage: string,
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
