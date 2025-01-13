import { headers } from "next/headers";
import { NextResponse } from "next/server";
import stripe from "@filler-word-counter/lib/stripe/stripe-server";
import Stripe from "stripe";

export async function POST(req: Request) {
  const body = await req.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature") as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error) {
    const err = error as Error;
    console.error(`Webhook signature verification failed: ${err.message}`);
    return NextResponse.json(
      { error: "Webhook signature verification failed" },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case "invoice.paid":
        const invoice = event.data.object as Stripe.Invoice;
        if (invoice.subscription) {
          // Retrieve the subscription to get its status
          const subscription = await stripe.subscriptions.retrieve(
            invoice.subscription as string
          );

          if (subscription.status === "active") {
            console.log(
              `Subscription ${subscription.id} activated successfully`
            );
          }
        }
        break;

      case "invoice.payment_failed":
        const failedInvoice = event.data.object as Stripe.Invoice;
        console.error(`Payment failed for invoice ${failedInvoice.id}`);
        // You might want to notify the user or take other actions
        break;

      case "customer.subscription.deleted":
        const deletedSubscription = event.data.object as Stripe.Subscription;
        console.log(`Subscription ${deletedSubscription.id} was cancelled`);
        break;

      case "customer.subscription.updated":
        const updatedSubscription = event.data.object as Stripe.Subscription;
        console.log(
          `Subscription ${updatedSubscription.id} was updated, new status: ${updatedSubscription.status}`
        );
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    const err = error as Error;
    console.error(`Webhook handler failed: ${err.message}`);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};
