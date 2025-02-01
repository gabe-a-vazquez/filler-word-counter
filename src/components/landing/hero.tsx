import { HeroButtons } from "./hero-buttons";

export default function Hero() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-4">
      <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
        Speak With Confidence
      </h1>
      <p className="mt-6 text-xl md:text-2xl text-muted-foreground max-w-2xl">
        Improve your public speaking by tracking and reducing filler words in
        real-time. Perfect for presentations, interviews, and speeches.
      </p>
      <HeroButtons />
    </div>
  );
}
