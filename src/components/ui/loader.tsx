"use client";

import { cn } from "@filler-word-counter/lib/tailwind/tailwind-utils";

interface LoaderProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "default" | "sm" | "lg";
}

export function Loader({ className, size = "default", ...props }: LoaderProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center justify-center",
        {
          "h-6 w-6": size === "sm",
          "h-8 w-8": size === "default",
          "h-12 w-12": size === "lg",
        },
        className
      )}
      {...props}
    >
      <div
        className={cn(
          "border-primary/30 border-t-primary animate-spin rounded-full border-4",
          "h-full w-full"
        )}
      />
    </div>
  );
}
