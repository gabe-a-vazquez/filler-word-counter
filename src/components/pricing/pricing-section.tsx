"use client";

import { useState } from "react";
import { PricingCard } from "./pricing-card";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@filler-word-counter/lib/firebase/firebase-client";
import { useToast } from "@filler-word-counter/components/ui/use-toast";
import { PaymentModal } from "./payment-modal";
import { getIdToken } from "firebase/auth";

const PRICING_PLANS = [
  {
    title: "Free",
    price: "$0",
    description: "For casual users",
    features: [
      "30 minutes of Live Transcription",
      "AI Generated Speech-to-Text transcription",
      "Advanced analytics",
    ],
    priceId: "", // No price ID for free tier
  },
  {
    title: "Pro",
    price: "$4.99/month",
    description: "For professionals",
    features: [
      "10 hours of Live Transcription",
      "AI Generated Speech-to-Text transcription",
      "Advanced analytics",
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
  const [selectedPriceId, setSelectedPriceId] = useState<string>("");
  const { toast } = useToast();

  const handleSubscribe = async (priceId: string | undefined) => {
    if (!priceId || loading) {
      return;
    }

    setSelectedPriceId(priceId);

    if (!user) {
      setIsModalOpen(true);
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
            loading={loading}
            onSubscribe={() => handleSubscribe(plan.priceId)}
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
        priceId={selectedPriceId}
      />
    </>
  );
}
