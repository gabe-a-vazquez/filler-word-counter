import Link from "next/link";
import { Button } from "@filler-word-counter/components/shadcn/button";
import { X } from "lucide-react";
import { CardContent } from "@filler-word-counter/components/shadcn/card";

interface GuestNoticeProps {
  onDismiss: () => void;
}

export function GuestNotice({ onDismiss }: GuestNoticeProps) {
  return (
    <CardContent className="border mt-4 mb-10 ml-4 mr-4 p-4 rounded-lg bg-muted">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">
            You're currently using the app as a guest. Sign up for free to save
            your results and track your progress over time.
          </p>
          <div className="pt-2">
            <Link
              href="/signup"
              className="text-sm font-medium text-blue-500 hover:text-blue-600 hover:underline"
            >
              Create an account →
            </Link>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-4 w-8"
          onClick={onDismiss}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </CardContent>
  );
}
