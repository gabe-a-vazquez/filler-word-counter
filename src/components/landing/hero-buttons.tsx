"use client";

import { Button } from "@filler-word-counter/components/ui/button";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";

export function HeroButtons() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
    });

    return () => unsubscribe();
  }, []);

  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="mt-10 flex gap-4">
      <Link href="/pricing">
        <Button size="lg" className="text-lg">
          Start Free
        </Button>
      </Link>
      <Link href="/login">
        <Button size="lg" variant="outline" className="text-lg">
          Login
        </Button>
      </Link>
    </div>
  );
}
