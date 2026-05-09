import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing OPENAI_API_KEY in environment." },
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

  const style = String(incoming.get("style") ?? "pixar").trim();
  const customization = String(incoming.get("customization") ?? "").trim();

  const prompt =
    `Create a friendly, flattering profile avatar in a 3D cartoon style. ` +
    `Keep the person recognizable. Soft lighting, clean background. ` +
    (style ? `Style: ${style}. ` : "") +
    (customization ? `Customization: ${customization}.` : "");

  const upstreamBody = new FormData();
  upstreamBody.append("model", "gpt-image-1");
  upstreamBody.append("prompt", prompt);
  upstreamBody.append("image", file, file.name || "face.png");
  // Request a square avatar
  upstreamBody.append("size", "1024x1024");

  const upstream = await fetch("https://api.openai.com/v1/images/edits", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: upstreamBody,
  });

  const text = await upstream.text();
  if (!upstream.ok) {
    return NextResponse.json(
      { error: "OpenAI avatar request failed.", status: upstream.status, detail: text },
      { status: 502 },
    );
  }

  // Return raw payload so client can pick b64.
  return new NextResponse(text, {
    status: 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

