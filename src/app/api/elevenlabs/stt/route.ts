import { NextResponse } from "next/server";

export const runtime = "nodejs";

const DEFAULT_STT_MODEL_ID = "scribe_v2";

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

  let incoming: FormData;
  try {
    incoming = await req.formData();
  } catch {
    return NextResponse.json(
      { error: "Expected multipart/form-data." },
      { status: 400 },
    );
  }

  const file = incoming.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "Missing `file` in form-data." },
      { status: 400 },
    );
  }

  const modelId =
    (incoming.get("model_id") as string | null)?.trim() ||
    process.env.ELEVENLABS_STT_MODEL_ID ||
    DEFAULT_STT_MODEL_ID;

  const languageCode = (incoming.get("language_code") as string | null)?.trim();
  const diarizeRaw = (incoming.get("diarize") as string | null)?.trim();
  const timestampsGranularity = (
    incoming.get("timestamps_granularity") as string | null
  )?.trim();

  const upstreamBody = new FormData();
  upstreamBody.append("model_id", modelId);
  upstreamBody.append("file", file, file.name || "audio.webm");
  if (languageCode) upstreamBody.append("language_code", languageCode);
  if (diarizeRaw) upstreamBody.append("diarize", diarizeRaw);
  if (timestampsGranularity) {
    upstreamBody.append("timestamps_granularity", timestampsGranularity);
  }

  const upstream = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      accept: "application/json",
    },
    body: upstreamBody,
  });

  const text = await upstream.text();
  if (!upstream.ok) {
    return NextResponse.json(
      {
        error: "ElevenLabs STT request failed.",
        status: upstream.status,
        detail: text,
      },
      { status: 502 },
    );
  }

  // Upstream returns JSON; keep the raw payload so UI can adapt to changes.
  return new NextResponse(text, {
    status: 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

