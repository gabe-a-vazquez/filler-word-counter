import { NextResponse } from "next/server";
import stripe from "@filler-word-counter/lib/stripe/stripe-server";
import { auth } from "@filler-word-counter/lib/firebase/firebase-admin";

export async function POST(req: Request) {
  try {
    const { priceId, customerId } = await req.json();

    // Verify Firebase auth token
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      console.log("Missing or invalid auth header");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await auth.verifyIdToken(token);
    const uid = decodedToken.uid;

    // Get or create Stripe customer
    let customer;
    const customers = await stripe.customers.search({
      query: `metadata['firebaseUID']:'${uid}'`,
    });

    if (customers.data.length > 0) {
      customer = customers.data[0];
    } else {
      customer = await stripe.customers.create({
        metadata: {
          firebaseUID: uid,
        },
      });
    }

    // Create the subscription
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: priceId }],
      payment_behavior: "default_incomplete",
      payment_settings: { save_default_payment_method: "on_subscription" },
      expand: ["latest_invoice.payment_intent"],
    });

    return NextResponse.json({
      subscriptionId: subscription.id,
      clientSecret: (subscription.latest_invoice as any).payment_intent
        .client_secret,
    });
  } catch (error) {
    const e = error as Error;
    console.error("Subscription error details:", {
      message: e.message,
      stack: e.stack,
      cause: e.cause,
    });

    return NextResponse.json(
      { error: "Failed to create subscription", details: e.message },
      { status: 500 }
    );
  }
}
