import { cn } from "@/lib/utils";
import type { RegistrationStatus } from "@/types";

const statusConfig: Record<RegistrationStatus, { label: string; className: string }> = {
  open: { label: "Registration Open", className: "bg-carolina text-navy" },
  "coming-soon": { label: "Coming Soon", className: "bg-muted text-muted-foreground" },
  waitlist: { label: "Waitlist", className: "bg-impact text-impact-foreground" },
  closed: { label: "Closed", className: "bg-ink/10 text-ink" },
};

export function StatusBadge({
  status,
  className,
}: {
  status: RegistrationStatus;
  className?: string;
}) {
  const config = statusConfig[status];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm px-2.5 py-1 text-xs font-semibold uppercase tracking-wide",
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}
