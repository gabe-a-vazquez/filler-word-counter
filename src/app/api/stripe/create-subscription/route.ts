import { NextResponse } from "next/server";
import stripe from "@filler-word-counter/lib/stripe/stripe-server";
import { auth, db } from "@filler-word-counter/lib/firebase/firebase-admin";

export async function POST(req: Request) {
  try {
    const { priceId } = await req.json();

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await auth.verifyIdToken(token);
    const uid = decodedToken.uid;

    // Get user details from Firebase
    const userRecord = await auth.getUser(uid);
    const { email, displayName } = userRecord;

    // First check if we already have a Stripe customer ID in Firebase
    const stripeDoc = await db.collection(uid).doc("stripe").get();
    let customer;

    if (stripeDoc.exists && (stripeDoc.data() as { id: string })?.id) {
      customer = await stripe.customers.retrieve(
        (stripeDoc.data() as { id: string }).id
      );
    } else {
      customer = await stripe.customers.create({
        email: email || undefined,
        name: displayName || undefined,
        metadata: {
          firebaseUID: uid,
        },
      });

      await db.collection(uid).doc("stripe").set({
        id: customer.id,
      });
    }

    // Check for existing incomplete subscriptions
    const existingSubscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      status: "incomplete",
      limit: 1,
    });

    if (existingSubscriptions.data.length > 0) {
      // Return the existing subscription's payment intent client secret
      const existingSubscription = existingSubscriptions.data[0];
      const latestInvoice = await stripe.invoices.retrieve(
        existingSubscription.latest_invoice as string
      );

      if (latestInvoice.payment_intent) {
        const paymentIntent = await stripe.paymentIntents.retrieve(
          latestInvoice.payment_intent as string
        );
        return NextResponse.json({
          subscriptionId: existingSubscription.id,
          clientSecret: paymentIntent.client_secret,
        });
      }
    }

    // If no incomplete subscription exists, create a new one
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
