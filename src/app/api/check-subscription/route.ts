import { NextResponse } from "next/server";
import { auth } from "@filler-word-counter/lib/firebase/firebase-admin";
import { db } from "@filler-word-counter/lib/firebase/firebase-admin";

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await auth.verifyIdToken(token);
    const uid = decodedToken.uid;

    // Check if user has an active subscription in Firestore
    const userDoc = await db.collection(uid).doc("stripe").get();
    const stripeData = userDoc.data();

    const isCustomer = stripeData?.id !== undefined;

    return NextResponse.json({ isCustomer });
  } catch (error) {
    console.error("Error checking subscription:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
