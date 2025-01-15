import { NextResponse } from "next/server";
import { auth, db } from "@filler-word-counter/lib/firebase/firebase-admin";
import stripe from "@filler-word-counter/lib/stripe/stripe-server";

const USAGE_LIMITS = {
  basic: 10,
  pro: 50,
  enterprise: 200,
} as const;

type SubscriptionTier = keyof typeof USAGE_LIMITS;

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        {
          error: "Unauthorized",
          message: "Please log in to check usage",
        },
        { status: 401 }
      );
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await auth.verifyIdToken(token);
    const userId = decodedToken.uid;

    // Get Stripe customer ID
    const stripeDoc = await db.collection(userId).doc("stripe").get();
    if (!stripeDoc.exists) {
      return NextResponse.json(
        {
          error: "Subscription Required",
          message: "Please subscribe to a plan to use this feature",
          code: "NO_SUBSCRIPTION",
        },
        { status: 404 }
      );
    }

    const stripeData = stripeDoc.data();
    const customerId = stripeData?.id;

    // Get active subscription from Stripe
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });

    if (!subscriptions.data.length) {
      return NextResponse.json(
        {
          error: "No Active Subscription",
          message:
            "Your subscription is not active. Please check your subscription status.",
          code: "INACTIVE_SUBSCRIPTION",
          customerId,
        },
        { status: 404 }
      );
    }

    const subscription = subscriptions.data[0];
    // Format dates as YYYY-MM-DD
    const billingPeriodStart = new Date(
      subscription.current_period_start * 1000
    )
      .toISOString()
      .split("T")[0];
    const billingPeriodEnd = new Date(subscription.current_period_end * 1000)
      .toISOString()
      .split("T")[0];

    // Get user's Deepgram API key
    const userRef = db.collection(userId).doc("deepgram");
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      return new NextResponse("No Deepgram configuration found", {
        status: 404,
      });
    }

    const userData = userSnap.data();
    if (!userData?.deepgramApiKey) {
      return new NextResponse("No Deepgram API key found", { status: 400 });
    }

    // Get usage from Deepgram using billing period dates
    const response = await fetch(
      `https://api.deepgram.com/v1/projects/${process.env.DEEPGRAM_PROJECT_ID}/usage?start=${billingPeriodStart}&end=${billingPeriodEnd}`,
      {
        headers: {
          Authorization: `Token ${userData.deepgramApiKey}`,
          accept: "application/json",
        },
      }
    );

    let responseText;
    try {
      responseText = await response.text();

      if (!response.ok) {
        console.error("Deepgram API error:", responseText);
        return new NextResponse(responseText, {
          status: response.status,
        });
      }

      const usage = JSON.parse(responseText);
      console.log("Deepgram Usage:", usage);

      // Sum up all usage results
      const hoursUsed = usage.results.reduce((total: number, result: any) => {
        return total + (result.total_hours || 0);
      }, 0);

      // Update user's usage in Firestore
      await userRef.update({
        usageHours: hoursUsed,
        lastUsageCheck: new Date(),
      });

      // Get subscription tier and limits
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
        billingPeriodStart,
        billingPeriodEnd,
      });
    } catch (error) {
      console.error("Error parsing Deepgram usage:", error);
      return new NextResponse("Failed to parse usage", { status: 500 });
    }
  } catch (error) {
    console.error("Error checking Deepgram usage:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        message:
          "An error occurred while checking usage. Please try again later.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
