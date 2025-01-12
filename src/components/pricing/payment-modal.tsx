"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@filler-word-counter/components/ui/dialog";
import { PaymentFormWrapper } from "./payment-form-wrapper";
import { AuthStep } from "./auth-step";
import { useToast } from "@filler-word-counter/components/ui/use-toast";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@filler-word-counter/lib/firebase/firebase-client";
import { getIdToken } from "firebase/auth";
import { useState, useEffect } from "react";
import { Skeleton } from "@filler-word-counter/components/ui/skeleton";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientSecret: string | null;
  priceId: string;
}

export function PaymentModal({
  isOpen,
  onClose,
  clientSecret: initialClientSecret,
  priceId,
}: PaymentModalProps) {
  const [user] = useAuthState(auth);
  const [clientSecret, setClientSecret] = useState(initialClientSecret);
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      handleAuthSuccess();
    }
  }, [user]);

  const handleAuthSuccess = async () => {
    if (!user) return;

    try {
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

      const data = await response.json();
      console.log(data.clientSecret);
      setClientSecret(data.clientSecret);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process subscription",
        variant: "destructive",
      });
    }
  };

  const handleSuccess = () => {
    toast({
      title: "Payment successful",
      description: "Your subscription has been activated",
    });
    onClose();
  };

  const handleError = (error: string) => {
    toast({
      title: "Payment failed",
      description: error,
      variant: "destructive",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {!user ? "Create Account" : "Payment Details"}
          </DialogTitle>
        </DialogHeader>
        {!user ? (
          <AuthStep />
        ) : clientSecret ? (
          <PaymentFormWrapper
            clientSecret={clientSecret}
            onSuccess={handleSuccess}
            onError={handleError}
          />
        ) : (
          <div className="space-y-3">
            <Skeleton className="h-[20px] w-full" />
            <Skeleton className="h-[20px] w-[80%]" />
            <Skeleton className="h-[40px] w-full" />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
