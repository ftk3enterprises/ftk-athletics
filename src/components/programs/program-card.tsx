import Image from "next/image";
import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";
import { StatusBadge } from "@/components/shared/status-badge";
import { StepUpBadge } from "@/components/shared/step-up-badge";
import { formatProgramPriceDisplay } from "@/lib/pricing";
import type { Program } from "@/types";

export function ProgramCard({ program }: { program: Program }) {
  const price = formatProgramPriceDisplay(program);
  return (
    <div className="group flex flex-col overflow-hidden rounded-sm border border-border bg-card transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg">
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <Image
          src={program.image}
          alt=""
          fill
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute left-3 top-3 drop-shadow-sm">
          <StatusBadge status={program.registrationStatus} />
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div>
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-impact">
              {program.category}
            </p>
            {program.stepUpEligible && <StepUpBadge />}
          </div>
          <h3 className="mt-1 text-xl leading-tight">{program.name}</h3>
        </div>

        <p className="text-sm text-muted-foreground">{program.shortDescription}</p>

        <div className="mt-auto space-y-1.5 pt-2 text-sm">
          <p className="font-heading text-base text-navy">
            {price.headline}
            {price.sublabel && (
              <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                {price.sublabel}
              </span>
            )}
          </p>
          <p className="font-medium text-navy">{program.scheduleDisplay}</p>
          {program.location && (
            <p className="flex items-center gap-1.5 text-muted-foreground">
              <MapPin className="size-3.5 shrink-0" aria-hidden />
              {program.location}
            </p>
          )}
        </div>

        <div className="mt-3 flex items-center gap-4 border-t border-border pt-4">
          <Link
            href={`/programs/${program.slug}`}
            className="inline-flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wide text-navy transition-colors hover:text-impact"
          >
            View Program
            <ArrowRight className="size-3.5" aria-hidden />
          </Link>
          {program.registrationOpen && (
            <Link
              href={`/register?program=${program.slug}`}
              className="ml-auto inline-flex items-center rounded-sm bg-impact px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-impact-foreground transition-colors hover:bg-impact/90"
            >
              Register
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
