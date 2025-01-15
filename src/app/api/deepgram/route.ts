import { NextRequest, NextResponse } from "next/server";
import { auth, db } from "@filler-word-counter/lib/firebase/firebase-admin";

export async function POST(req: NextRequest) {
  try {
    // Get and verify Firebase auth token
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        {
          error: "Unauthorized",
          message: "Please log in to access this feature",
        },
        { status: 401 }
      );
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await auth.verifyIdToken(token);
    const userId = decodedToken.uid;

    // Get user's Deepgram API key from Firestore
    const userRef = db.collection(userId).doc("deepgram");
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      return NextResponse.json(
        { error: "No Deepgram configuration found" },
        { status: 404 }
      );
    }

    const userData = userSnap.data();
    if (!userData?.deepgramApiKey) {
      return NextResponse.json(
        { error: "No Deepgram API key found" },
        { status: 400 }
      );
    }

    const options = await req.json();
    const queryString = new URLSearchParams({
      model: options.model || "nova-2",
      interim_results: String(options.interim_results || true),
      smart_format: String(options.smart_format || true),
      filler_words: String(options.filler_words || true),
      utterance_end_ms: String(options.utterance_end_ms || 3000),
    }).toString();

    return NextResponse.json({
      token: userData.deepgramApiKey,
      queryString,
    });
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
