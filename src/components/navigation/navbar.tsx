"use client";

import Link from "next/link";
import { Button } from "@filler-word-counter/components/ui/button";
import { auth } from "@filler-word-counter/lib/firebase/firebase-client";
import { useEffect, useState } from "react";
import { User } from "firebase/auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@filler-word-counter/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [isCustomer, setIsCustomer] = useState<boolean>(false);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setUser(user);
      if (user) {
        // Check if user is a customer
        const token = await user.getIdToken();
        try {
          const response = await fetch("/api/check-subscription", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          const data = await response.json();
          setIsCustomer(data.isCustomer);
        } catch (error) {
          console.error("Error checking subscription:", error);
          setIsCustomer(false);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
      await auth.signOut();
      router.push("/login");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handlePortalRedirect = async () => {
    if (!isCustomer) {
      router.push("/pricing");
    } else {
      try {
        const token = await auth.currentUser?.getIdToken();

        const response = await fetch("/api/create-portal-session", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) throw new Error("Failed to create portal session");

        const { url } = await response.json();
        window.location.href = url;
      } catch (error) {
        console.error("Error:", error);
      }
    }
  };

  return (
    <nav className="h-16 border-b">
      <div className="h-full mx-auto flex items-center justify-between px-4">
        <Link
          href={user ? "/dashboard" : "/"}
          className="text-xl font-semibold"
        >
          Uhm Counter
        </Link>

        <div className="flex items-center gap-4">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="rounded-full w-10 h-10 p-0">
                  <Image
                    src={user.photoURL || "/default-avatar.png"}
                    alt="Profile"
                    width={40}
                    height={40}
                    className="rounded-full"
                  />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem>
                  <Link href="/counter" className="w-full">
                    Counter
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Link href="/dashboard" className="w-full">
                    Dashboard
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handlePortalRedirect}>
                  Subscription
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSignOut}>
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost">Login</Button>
              </Link>
              <Link href="/signup">
                <Button>Sign up</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
