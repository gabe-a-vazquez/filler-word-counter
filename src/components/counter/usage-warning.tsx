import { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";

export default function UsageWarning() {
  const [usage, setUsage] = useState<any>(null);
  const auth = getAuth();

  useEffect(() => {
    const checkUsage = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const token = await user.getIdToken();
      const response = await fetch("/api/deepgram/check-usage", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      setUsage(data);
    };

    checkUsage();
  }, []);

  if (!usage || (!usage.isApproachingLimit && !usage.isOverLimit)) {
    return null;
  }

  return (
    <div
      className={`p-4 rounded-lg ${
        usage.isOverLimit ? "bg-red-100" : "bg-yellow-100"
      }`}
    >
      <p className="text-sm">
        {usage.isOverLimit
          ? `You've reached your usage limit of ${usage.limit} hours. Please upgrade your plan to continue.`
          : `You're approaching your usage limit (${Math.round(
              usage.usagePercentage
            )}% used)`}
      </p>
      {/* Add upgrade button/link here */}
    </div>
  );
}
