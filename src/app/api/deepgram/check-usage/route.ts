import { NextResponse } from "next/server";
import { auth, db } from "@filler-word-counter/lib/firebase/firebase-admin";

const USAGE_LIMITS = {
  basic: 10, // 10 hours
  pro: 50, // 50 hours
  enterprise: 200, // 200 hours
} as const;

type SubscriptionTier = keyof typeof USAGE_LIMITS;

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await auth.verifyIdToken(token);
    const userId = decodedToken.uid;

    // Get user data from Firestore
    const userRef = db.collection(userId).doc("deepgram");
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      return new NextResponse("User not found", { status: 404 });
    }

    const userData = userSnap.data();
    if (!userData) {
      return new NextResponse("User data not found", { status: 404 });
    }

    if (!userData.deepgramProjectId) {
      return new NextResponse("No Deepgram project found", { status: 400 });
    }

    // Get usage from Deepgram
    const now = new Date();
    const startDate = (
      userData.lastUsageCheck?.toDate() || new Date(0)
    ).toISOString();
    const endDate = now.toISOString();

    const response = await fetch(
      `https://api.deepgram.com/v1/projects/${userData.deepgramProjectId}/usage?start=${startDate}&end=${endDate}`,
      {
        headers: {
          Authorization: `Token ${process.env.NEXT_PUBLIC_DEEPGRAM_API_KEY}`,
        },
      }
    );

    const usage = await response.json();
    const hoursUsed = usage.results.usage / 3600; // Convert seconds to hours

    // Update user's usage in Firestore
    await userRef.update({
      usageHours: hoursUsed,
      lastUsageCheck: now,
    });

    // Check if user is approaching limit
    const userSubscription =
      (userData.subscription as SubscriptionTier) || "basic";
    const limit = USAGE_LIMITS[userSubscription];
    const usagePercentage = (hoursUsed / limit) * 100;

    return NextResponse.json({
      hoursUsed,
      limit,
      usagePercentage,
      isApproachingLimit: usagePercentage >= 80,
      isOverLimit: usagePercentage >= 100,
    });
  } catch (error) {
    console.error("Error checking Deepgram usage:", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
