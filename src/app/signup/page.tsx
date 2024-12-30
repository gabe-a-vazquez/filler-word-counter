"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@filler-word-counter/components/shadcn/input";
import { Button } from "@filler-word-counter/components/shadcn/button";
import { Label } from "@filler-word-counter/components/shadcn/label";

export default function SignUpPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
  });
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      // Here you would typically make an API call to your backend
      console.log("Sign up data:", formData);
      router.push("/dashboard");
    } catch (err) {
      setError("Failed to create account");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col items-center justify-center bg-white px-4">
      <div className="w-full max-w-3xl text-center mb-8">
        <h1 className="text-5xl font-bold tracking-tight text-black mb-4">
          Create Account
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Join us to improve your public speaking by tracking and reducing
          filler words in real-time.
        </p>
      </div>

      <div className="w-full max-w-md">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-3">
            <div>
              <Input
                id="name"
                name="name"
                type="text"
                required
                className="h-11 text-base border-2 text-black"
                placeholder="Full Name"
                value={formData.name}
                onChange={handleChange}
              />
            </div>
            <div>
              <Input
                id="email"
                name="email"
                type="email"
                required
                className="h-11 text-base border-2 text-black"
                placeholder="Email address"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
            <div>
              <Input
                id="password"
                name="password"
                type="password"
                required
                className="h-11 text-base border-2 text-black"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
              />
            </div>
            <div>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                className="h-11 text-base border-2 text-black"
                placeholder="Confirm Password"
                value={formData.confirmPassword}
                onChange={handleChange}
              />
            </div>
          </div>

          {error && (
            <div className="text-red-500 text-sm text-center">{error}</div>
          )}

          <Button
            type="submit"
            className="w-full h-11 text-base font-medium bg-black text-white hover:bg-gray-900"
          >
            Sign up
          </Button>
        </form>
      </div>
    </div>
  );
}
