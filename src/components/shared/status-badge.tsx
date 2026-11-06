import { cn } from "@/lib/utils";
import type { RegistrationStatus } from "@/types";

const statusConfig: Record<RegistrationStatus, { label: string; className: string }> = {
  open: { label: "Registration Open", className: "bg-carolina text-navy" },
  // Client-requested: bright yellow background, white text. A navy-tinted
  // shadow (FTK's own brand navy) keeps the white lettering legible against
  // a truly bright/saturated yellow without muting the yellow itself.
  "coming-soon": {
    label: "Coming Soon",
    className: "bg-[#FFD500] text-white [text-shadow:0_1px_3px_rgb(0_31_80_/_70%)]",
  },
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
