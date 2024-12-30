import FillerWordCounter from "@filler-word-counter/components/widgets/filler-word-counter";

export default function Home() {
  return (
    <main className="container mx-auto p-4">
      <h1 className="text-4xl font-bold text-center my-8">
        Filler Word Counter
      </h1>
      <FillerWordCounter />
    </main>
  );
}
