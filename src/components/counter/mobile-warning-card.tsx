import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@filler-word-counter/components/ui/card";
import { Laptop } from "lucide-react";

export function MobileWarningCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Laptop className="h-5 w-5" />
          Desktop Only Feature
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          The free version of our speech analysis tool is only available on
          desktop devices. Please switch to a desktop browser to use this
          feature.
        </p>
      </CardContent>
    </Card>
  );
}
