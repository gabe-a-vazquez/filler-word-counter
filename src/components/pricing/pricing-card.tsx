import { Button } from "@filler-word-counter/components/shadcn/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@filler-word-counter/components/shadcn/card";
import { Check } from "lucide-react";

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
  return (
    <Card className={`w-[300px] ${isPopular ? "border-primary" : ""}`}>
      <CardHeader>
        <CardTitle className="flex justify-between">
          {title}
          {isPopular && (
            <span className="text-sm text-primary">Most Popular</span>
          )}
        </CardTitle>
        <div className="text-2xl font-bold">{price}</div>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {features.map((feature, i) => (
            <li key={i} className="flex items-center">
              <Check className="mr-2 h-4 w-4" />
              {feature}
            </li>
          ))}
        </ul>
        <Button className="w-full mt-6" onClick={onSubscribe}>
          Subscribe
        </Button>
      </CardContent>
    </Card>
  );
}
