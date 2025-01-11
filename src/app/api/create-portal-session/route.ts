import { NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { getAuth } from "firebase-admin/auth";
import { db } from "@filler-word-counter/lib/firebase-admin";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
});

export async function POST() {
  try {
    const headersList = await headers();
    const authHeader = headersList.get("authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await getAuth().verifyIdToken(token);
    const uid = decodedToken.uid;

    // Get user's Stripe customer ID from Firestore
    const userDoc = await db.collection(uid).doc("userData").get();
    const userData = userDoc.data();
    console.log(userData);
    if (!userData?.stripeCustomerId) {
      return NextResponse.json(
        { error: "No associated Stripe customer found" },
        { status: 400 }
      );
    }

    // Create Stripe portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: userData.stripeCustomerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Error creating portal session:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
