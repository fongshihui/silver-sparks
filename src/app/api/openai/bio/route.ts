import { NextResponse } from "next/server";

export const runtime = "edge";

export async function POST(req: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing OPENAI_API_KEY" },
      { status: 500 }
    );
  }

  try {
    const { voiceAnswers } = await req.json();
    if (!voiceAnswers) {
      return NextResponse.json({ error: "Missing voice answers" }, { status: 400 });
    }

    const promptStr = `You are a helpful assistant for a dating app designed for elderly users (Silver Sparks). 
Based on these voice answers provided by the user, please write a short, friendly, and cute biography strictly in one short paragraph (3-4 sentences).

User Answers:
${JSON.stringify(voiceAnswers, null, 2)}
`;

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: promptStr }],
      }),
    });

    if (!res.ok) {
      const errorData = await res.text();
      return NextResponse.json({ error: "OpenAI error", details: errorData }, { status: 500 });
    }

    const data = await res.json();
    const bio = data.choices?.[0]?.message?.content?.trim() || "";

    return NextResponse.json({ bio });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
