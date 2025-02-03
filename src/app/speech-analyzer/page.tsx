"use client";

import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@filler-word-counter/lib/firebase/firebase-client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import FillerWordCounter from "@filler-word-counter/components/counter/filler-word-counter";

export default function SpeechAnalysis() {
  const [user] = useAuthState(auth);
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push("/");
    }
  }, [user, router]);

  if (!user) {
    return null;
  }

  return (
    <main className="container mx-auto p-4">
      <FillerWordCounter />
    </main>
  );
}
