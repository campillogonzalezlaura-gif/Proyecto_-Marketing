import { cn } from "@/lib/utils";
import { Rocket } from "lucide-react";

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="bg-primary/20 p-2 rounded-lg">
        <Rocket className="h-6 w-6 text-primary" />
      </div>
      <h1 className="text-xl font-bold font-headline text-foreground tracking-tight">
        MarketFlow
      </h1>
    </div>
  );
}
