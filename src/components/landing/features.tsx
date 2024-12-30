import { BarChart, Mic, PlayCircle } from "lucide-react";

export default function Features() {
  return (
    <section id="features" className="w-full py-24 px-4 bg-muted/50">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
        <div className="flex flex-col items-center text-center p-6">
          <Mic className="w-12 h-12 mb-6 text-primary" />
          <h3 className="text-2xl font-semibold mb-4">Real-time Analysis</h3>
          <p className="text-muted-foreground">
            Get instant feedback on your speech patterns and filler word usage
          </p>
        </div>
        <div className="flex flex-col items-center text-center p-6">
          <BarChart className="w-12 h-12 mb-6 text-primary" />
          <h3 className="text-2xl font-semibold mb-4">Detailed Analytics</h3>
          <p className="text-muted-foreground">
            Track your progress over time with comprehensive speech analytics
          </p>
        </div>
        <div className="flex flex-col items-center text-center p-6">
          <PlayCircle className="w-12 h-12 mb-6 text-primary" />
          <h3 className="text-2xl font-semibold mb-4">Practice Mode</h3>
          <p className="text-muted-foreground">
            Perfect your delivery in a low-pressure environment
          </p>
        </div>
      </div>
    </section>
  );
}
