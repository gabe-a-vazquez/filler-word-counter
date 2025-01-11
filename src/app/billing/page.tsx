"use client";

import { redirect } from "next/navigation";
import BillingDashboard from "@filler-word-counter/components/billing/billing-dashboard";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@filler-word-counter/lib/firebase/config";

export default function BillingPage() {
  const [user, loading] = useAuthState(auth);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Billing & Subscription</h1>
      <BillingDashboard />
    </div>
  );
}
