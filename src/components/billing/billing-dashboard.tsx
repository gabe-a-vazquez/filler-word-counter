"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@filler-word-counter/lib/firebase/config";

export default function BillingDashboard() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleManageSubscription = async () => {
    try {
      setIsLoading(true);
      const token = await auth.currentUser?.getIdToken();

      const response = await fetch("/api/create-portal-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to create portal session");

      const { url } = await response.json();
      router.push(url);
    } catch (error) {
      console.error("Error:", error);
      // Add error handling/notification here
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Subscription Management</h2>
        <button
          onClick={handleManageSubscription}
          disabled={isLoading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? "Loading..." : "Manage Subscription"}
        </button>
      </div>
    </div>
  );
}
