"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@filler-word-counter/components/shadcn/dialog";
import { PaymentFormWrapper } from "./payment-form-wrapper";
import { AuthStep } from "./auth-step";
import { useToast } from "@filler-word-counter/components/shadcn/use-toast";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@filler-word-counter/lib/firebase/config";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientSecret: string | null;
}

export function PaymentModal({
  isOpen,
  onClose,
  clientSecret,
}: PaymentModalProps) {
  const [user] = useAuthState(auth);
  const { toast } = useToast();

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
            {!user ? "Complete Your Subscription" : "Payment Details"}
          </DialogTitle>
        </DialogHeader>
        {!user ? (
          <AuthStep onSuccess={() => {}} />
        ) : clientSecret ? (
          <PaymentFormWrapper
            clientSecret={clientSecret}
            onSuccess={handleSuccess}
            onError={handleError}
          />
        ) : (
          <div>Loading payment details...</div>
        )}
      </DialogContent>
    </Dialog>
  );
}
