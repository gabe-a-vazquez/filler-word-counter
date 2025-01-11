import { Button } from "@filler-word-counter/components/shadcn/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@filler-word-counter/components/shadcn/card";
import { Check } from "lucide-react";
import { cn } from "@filler-word-counter/lib/utils";
import { useRouter } from "next/navigation";

interface PricingCardProps {
  title: string;
  price: string;
  description: string;
  features: string[];
  onSubscribe: () => void;
  isPopular?: boolean;
}

export function PricingCard({
  title,
  price,
  description,
  features,
  onSubscribe,
  isPopular,
}: PricingCardProps) {
  const router = useRouter();

  const handleClick = () => {
    if (price === "$0") {
      router.push("/signup");
    } else {
      onSubscribe();
    }
  };

  return (
    <Card
      className={cn(
        "w-full max-w-sm h-[500px] flex flex-col",
        isPopular && "border-primary"
      )}
    >
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-2xl">{title}</CardTitle>
            <p className="text-muted-foreground">{description}</p>
          </div>
          {isPopular && (
            <span className="px-2.5 py-0.5 text-sm bg-primary/10 text-primary rounded-full">
              Most Popular
            </span>
          )}
        </div>
        <div className="mt-4">
          <span className="text-4xl font-bold">{price}</span>
          {price !== "$0" && (
            <span className="text-muted-foreground">/month</span>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-between">
        <ul className="space-y-2">
          {features.map((feature, i) => (
            <li key={i} className="flex items-center">
              <Check className="mr-2 h-4 w-4" />
              {feature}
            </li>
          ))}
        </ul>
        <Button className="w-full mt-6" onClick={handleClick}>
          {price === "$0" ? "Get Started" : "Subscribe"}
        </Button>
      </CardContent>
    </Card>
  );
}
