import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Indicates Step Up For Students funds can be used toward this program —
 * never implies a scholarship balance or price has been applied.
 */
export function StepUpBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-sm bg-navy/5 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-navy ring-1 ring-inset ring-navy/15",
        className
      )}
    >
      <CheckCircle2 className="size-3.5 text-carolina" aria-hidden />
      Step Up Accepted
    </span>
  );
}
