"use client";

import { Elements } from "@stripe/react-stripe-js";
import stripePromise from "@filler-word-counter/lib/stripe/stripe-client";
import { PaymentForm } from "./payment-form";
import { Appearance, StripeElementsOptions } from "@stripe/stripe-js";

interface PaymentFormWrapperProps {
  clientSecret: string;
  onSuccess: () => void;
  onError: (error: string) => void;
}

export function PaymentFormWrapper(props: PaymentFormWrapperProps) {
  const options: StripeElementsOptions = {
    clientSecret: props.clientSecret,
    appearance: {
      theme: "stripe" as const,
    },
  };

  return (
    <Elements stripe={stripePromise} options={options}>
      <PaymentForm {...props} />
    </Elements>
  );
}
