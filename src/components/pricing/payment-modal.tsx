"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@filler-word-counter/components/shadcn/dialog";
import { PaymentFormWrapper } from "./payment-form-wrapper";
import { useToast } from "@filler-word-counter/components/shadcn/use-toast";

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
          <DialogTitle>Complete Your Subscription</DialogTitle>
        </DialogHeader>
        {clientSecret ? (
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
