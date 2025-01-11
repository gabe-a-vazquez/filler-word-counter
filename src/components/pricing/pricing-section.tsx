"use client";

import { useState } from "react";
import { PricingCard } from "./pricing-card";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@filler-word-counter/lib/firebase/config";
import { useToast } from "@filler-word-counter/components/shadcn/use-toast";
import { PaymentModal } from "./payment-modal";
import { getIdToken } from "firebase/auth";

const PRICING_PLANS = [
  {
    title: "Free",
    price: "$0",
    description: "For casual users",
    features: [
      "5 transcriptions/month",
      "Basic analytics",
      "Community support",
    ],
    priceId: "", // No price ID for free tier
  },
  {
    title: "Pro",
    price: "$4.99/month",
    description: "For professionals",
    features: [
      "Unlimited transcriptions",
      "Advanced analytics",
      "Priority support",
      "Custom export formats",
    ],
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID,
    isPopular: true,
  },
];

export function PricingSection() {
  const [user] = useAuthState(auth);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSubscribe = async (priceId: string) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to subscribe to a plan",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const token = await getIdToken(user);

      const response = await fetch("/api/stripe/create-subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          priceId,
          customerId: user.uid,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create subscription");
      }

      const { clientSecret } = await response.json();
      setClientSecret(clientSecret);
      setIsModalOpen(true);
    } catch (error) {
      console.error("Subscription error:", error);
      toast({
        title: "Error",
        description: "Failed to process subscription",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="mx-auto max-w-4xl grid grid-cols-1 gap-8 lg:grid-cols-2 justify-items-center">
        {PRICING_PLANS.map((plan) => (
          <PricingCard
            key={plan.title}
            {...plan}
            onSubscribe={() =>
              !loading && plan.priceId && handleSubscribe(plan.priceId)
            }
          />
        ))}
      </div>
      <PaymentModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setClientSecret(null);
        }}
        clientSecret={clientSecret}
      />
    </>
  );
}
