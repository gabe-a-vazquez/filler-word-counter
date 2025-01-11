import { PricingSection } from "@filler-word-counter/components/pricing/pricing-section";

export default function PricingPage() {
  return (
    <div className="container mx-auto py-16 px-4 sm:px-6 lg:px-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl mb-4">
          Choose Your Plan
        </h1>
        <p className="text-xl text-muted-foreground mb-8">
          Start with our free plan or upgrade for unlimited features
        </p>
      </div>
      <PricingSection />
    </div>
  );
}
