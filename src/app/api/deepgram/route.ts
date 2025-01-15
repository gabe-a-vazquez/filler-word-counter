import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const apiKey = process.env.NEXT_PUBLIC_DEEPGRAM_API_KEY;
  console.log("API key:", apiKey);
  if (!apiKey) {
    console.error("Deepgram API key not found in environment variables");
    return NextResponse.json(
      { error: "API key not configured" },
      { status: 500 }
    );
  }

  try {
    const options = await req.json();
    const queryString = new URLSearchParams({
      model: options.model || "nova-2",
      interim_results: String(options.interim_results || true),
      smart_format: String(options.smart_format || true),
      filler_words: String(options.filler_words || true),
      utterance_end_ms: String(options.utterance_end_ms || 3000),
    }).toString();

    // Simply return the API key since we're on the server side
    return NextResponse.json({ token: apiKey, queryString });
  } catch (error) {
    console.error("Error processing request:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to process request",
      },
      { status: 500 }
    );
  }
}
