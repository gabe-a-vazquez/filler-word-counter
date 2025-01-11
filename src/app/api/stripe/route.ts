import { NextResponse } from "next/server";
import stripe from "@filler-word-counter/lib/stripe";

export async function POST(req: Request) {
  try {
    const { amount, currency = "usd" } = await req.json();

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
    });

    return NextResponse.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    return NextResponse.json(
      { error: "Error creating payment intent" },
      { status: 500 }
    );
  }
}
