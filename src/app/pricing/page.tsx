"use client";

import { useEffect, useState } from "react";
import { PricingSection } from "@filler-word-counter/components/pricing/pricing-section";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@filler-word-counter/lib/firebase/firebase-client";
import { Loader } from "@filler-word-counter/components/ui/loader";

export default function PricingPage() {
  const [user] = useAuthState(auth);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    const checkAndRedirectCustomer = async () => {
      if (!user) return;

      setIsChecking(true);
      try {
        const token = await user.getIdToken();
        const response = await fetch("/api/check-subscription", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await response.json();

        if (data.isCustomer) {
          // Create portal session and redirect
          const portalResponse = await fetch("/api/create-portal-session", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          });

          if (!portalResponse.ok)
            throw new Error("Failed to create portal session");

          const { url } = await portalResponse.json();
          window.location.href = url;
        }
      } catch (error) {
        console.error("Error checking subscription:", error);
      } finally {
        setIsChecking(false);
      }
    };

    checkAndRedirectCustomer();
  }, [user]);

  if (isChecking) {
    return (
      <div className="container mx-auto py-16 px-4 sm:px-6 lg:px-8 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader size="lg" />
          <p className="text-muted-foreground">
            Checking subscription status...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-16 px-4 sm:px-6 lg:px-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl mb-4">
          Choose Your Plan
        </h1>
        <p className="text-xl text-muted-foreground mb-8">
          Start with our free plan or upgrade for more monthly transcription
          hours
        </p>
      </div>
      <PricingSection />
    </div>
  );
}
