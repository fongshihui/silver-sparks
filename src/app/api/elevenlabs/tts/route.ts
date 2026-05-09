import { NextResponse } from "next/server";

export const runtime = "nodejs";

type TtsRequestBody = {
  text?: string;
  voiceId?: string;
  modelId?: string;
  outputFormat?: string;
};

const DEFAULT_VOICE_ID = "EXAVITQu4vr4xnSDxMaL";
const DEFAULT_MODEL_ID = "eleven_v3";
const DEFAULT_OUTPUT_FORMAT = "mp3_44100_128";

export async function POST(req: Request) {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "Missing ELEVENLABS_API_KEY. Add it to your environment (e.g. .env.local).",
      },
      { status: 500 },
    );
  }

  let body: TtsRequestBody;
  try {
    body = (await req.json()) as TtsRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const text = body.text?.trim();
  if (!text) {
    return NextResponse.json({ error: "Missing `text`." }, { status: 400 });
  }

  const voiceId =
    body.voiceId?.trim() || process.env.ELEVENLABS_VOICE_ID || DEFAULT_VOICE_ID;

  const modelId =
    body.modelId?.trim() || process.env.ELEVENLABS_MODEL_ID || DEFAULT_MODEL_ID;

  const outputFormat =
    body.outputFormat?.trim() ||
    process.env.ELEVENLABS_OUTPUT_FORMAT ||
    DEFAULT_OUTPUT_FORMAT;

  const ttsUrl = new URL(
    `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}`,
  );
  ttsUrl.searchParams.set("output_format", outputFormat);

  const upstream = await fetch(
    ttsUrl.toString(),
    {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "content-type": "application/json",
        accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text,
        model_id: modelId,
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      }),
    },
  );

  if (!upstream.ok) {
    let detail: unknown = null;
    try {
      detail = await upstream.json();
    } catch {
      // ignore
    }
    return NextResponse.json(
      {
        error: "ElevenLabs TTS request failed.",
        status: upstream.status,
        detail,
      },
      { status: 502 },
    );
  }

  const audio = await upstream.arrayBuffer();
  return new NextResponse(audio, {
    status: 200,
    headers: {
      "content-type": upstream.headers.get("content-type") ?? "audio/mpeg",
      "cache-control": "no-store",
    },
  });
}

