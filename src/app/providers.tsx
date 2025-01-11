import { Elements } from "@stripe/react-stripe-js";
import stripePromise from "@filler-word-counter/lib/stripe-client";

export function Providers({ children }: { children: React.ReactNode }) {
  return <Elements stripe={stripePromise}>{children}</Elements>;
}
