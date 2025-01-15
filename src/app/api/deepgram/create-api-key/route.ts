import { NextResponse } from "next/server";
import { auth, db } from "@filler-word-counter/lib/firebase/firebase-admin";

export async function POST(request: Request) {
  try {
    const { userId } = await request.json();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Create a tagged API key for the user
    const response = await fetch(
      `https://api.deepgram.com/v1/projects/${process.env.DEEPGRAM_PROJECT_ID}/keys`,
      {
        method: "POST",
        headers: {
          Authorization: `Token ${process.env.DEEPGRAM_ADMIN_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          comment: `API Key for user ${userId}`,
          tags: [`user_${userId}`],
          scopes: ["usage:write", "usage:read", "transcribe"],
        }),
      }
    );

    if (!response.ok) {
      const text = await response.text();
      console.error("Deepgram API error:", text);
      return new NextResponse("Deepgram API error", {
        status: response.status,
      });
    }

    const keyData = await response.json();

    // Store API key in Firestore
    const userRef = db.collection(userId).doc("deepgram");
    const doc = await userRef.get();

    if (!doc.exists) {
      await userRef.set({
        deepgramApiKey: keyData.key,
        usageHours: 0,
        lastUsageCheck: new Date(),
      });
    } else {
      await userRef.update({
        deepgramApiKey: keyData.key,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error creating Deepgram API key:", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
