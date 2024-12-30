import Hero from "@filler-word-counter/components/landing/hero";
import Features from "@filler-word-counter/components/landing/features";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center">
      <div className="w-full bg-gradient-to-b from-background to-muted">
        <Hero />
      </div>
      <Features />
    </main>
  );
}
