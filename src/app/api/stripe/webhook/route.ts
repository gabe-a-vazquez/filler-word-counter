import { headers } from "next/headers";
import { NextResponse } from "next/server";
import stripe from "@filler-word-counter/lib/stripe/stripe-server";

export async function POST(req: Request) {
  const body = await req.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature") as string;

  try {
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    switch (event.type) {
      case "payment_intent.succeeded":
        // Handle successful payment
        break;
      case "payment_intent.payment_failed":
        // Handle failed payment
        break;
      // Add other webhook events as needed
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Webhook signature verification failed" },
      { status: 400 }
    );
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};
