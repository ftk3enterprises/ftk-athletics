import { cn } from "@/lib/utils";

const STEPS = [
  "Participants",
  "Programs",
  "Schedule",
  "Details",
  "Waiver",
  "Review & Pay",
  "Confirmation",
] as const;

export function RegistrationSteps({ current }: { current: number }) {
  return (
    <ol className="flex flex-wrap items-center gap-x-2 gap-y-2 text-xs font-semibold uppercase tracking-wide md:flex-nowrap md:gap-x-1.5 lg:gap-x-2">
      {STEPS.map((step, i) => {
        const index = i + 1;
        const state = index === current ? "current" : index < current ? "done" : "upcoming";
        return (
          <li key={step} className="flex items-center gap-1.5 whitespace-nowrap sm:gap-2">
            <span
              className={cn(
                "flex size-5 shrink-0 items-center justify-center rounded-full text-[10px]",
                state === "current" && "bg-impact text-impact-foreground",
                state === "done" && "bg-carolina text-navy",
                state === "upcoming" && "bg-white/15 text-white/50"
              )}
            >
              {index}
            </span>
            <span className={state === "upcoming" ? "text-white/40" : "text-white"}>{step}</span>
            {index < STEPS.length && <span className="ml-1 text-white/20">/</span>}
          </li>
        );
      })}
    </ol>
  );
}
