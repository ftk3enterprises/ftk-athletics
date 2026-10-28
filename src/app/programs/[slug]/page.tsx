import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar, DollarSign, MapPin, Users } from "lucide-react";
import { StatusBadge } from "@/components/shared/status-badge";
import { StepUpBadge } from "@/components/shared/step-up-badge";
import { getProgramBySlug, programs } from "@/data/programs";
import { SCHOOLS } from "@/data/schools";
import { formatProgramPriceDisplay } from "@/lib/pricing";
import { formatSelectedDatesLabel } from "@/lib/schedule-dates";

export function generateStaticParams() {
  return programs.map((program) => ({ slug: program.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const program = getProgramBySlug(slug);
  if (!program) return { title: "Program Not Found" };
  const title = `${program.name} | For The Kids Athletics`;
  const description = program.shortDescription;
  const shareImage = { url: "/brand/ftk-logo-full.png", width: 1200, height: 446, alt: "For The Kids Athletics" };
  return {
    title,
    description,
    // Next replaces the whole openGraph/twitter object per page rather than
    // merging field-by-field, so image/card have to be repeated here too —
    // otherwise this page's social preview would silently lose the share
    // image the root layout (src/app/layout.tsx) sets.
    openGraph: { title, description, images: [shareImage], locale: "en_US", type: "website" },
    twitter: { card: "summary_large_image", title, description, images: [shareImage.url] },
  };
}

export default async function ProgramDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const program = getProgramBySlug(slug);
  if (!program) notFound();

  const sessionPrices = Array.from(new Set(program.sessions.map((s) => s.price)));
  const hasTieredPricing = sessionPrices.length > 1 && !program.priceBreakdown;
  const priceDisplay = formatProgramPriceDisplay(program);

  return (
    <div className="bg-background">
      <div className="relative isolate overflow-hidden bg-navy">
        <div className="absolute inset-0">
          <Image
            src={program.image}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/80 to-navy/40" />
        </div>

        <div className="relative mx-auto max-w-5xl px-4 py-20 sm:px-6 lg:px-8">
          <Link
            href="/programs"
            className="inline-flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wide text-white/70 transition-colors hover:text-carolina"
          >
            <ArrowLeft className="size-3.5" aria-hidden />
            All Programs
          </Link>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <StatusBadge status={program.registrationStatus} />
            <span className="text-xs font-semibold uppercase tracking-wide text-carolina">
              {program.category}
            </span>
            {program.stepUpEligible && <StepUpBadge className="bg-white/10 text-white ring-white/25" />}
          </div>
          <h1 className="mt-3 text-5xl text-white sm:text-6xl">{program.name}</h1>
          <p className="mt-5 max-w-2xl text-lg text-white/80">{program.fullDescription}</p>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
          <div className="space-y-8">
            <section>
              <h2 className="text-2xl">Program Details</h2>
              <p className="mt-3 whitespace-pre-line text-muted-foreground">{program.fullDescription}</p>
            </section>

            {program.schoolBasedSessions && (
              <section>
                <h2 className="text-2xl">School Locations &amp; Sessions</h2>
                <p className="mt-3 text-muted-foreground">
                  After School runs at five school locations, one day a week, 3:30 – 4:30 PM. Each
                  session covers four class dates for $120 total per student — families register
                  for the complete four-week session, not individual days.
                </p>
                <div className="mt-5 space-y-3">
                  {SCHOOLS.map((school) => {
                    const sessions = program.sessions.filter(
                      (s) => s.schoolId === school.value && (s.classDates?.length ?? 0) === 4
                    );
                    return (
                      <div key={school.value} className="rounded-sm border border-border p-4">
                        <p className="font-semibold text-navy">{school.label}</p>
                        {sessions.length === 0 ? (
                          <p className="mt-1 text-sm text-muted-foreground">
                            No sessions are currently scheduled for this location. Please check
                            back for updates.
                          </p>
                        ) : (
                          <ul className="mt-1.5 space-y-1 text-sm text-navy">
                            {sessions.map((s) => (
                              <li key={s.id}>
                                {formatSelectedDatesLabel(s.classDates ?? [])} · 3:30 – 4:30 PM · $
                                {s.price}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
          </div>

          <aside className="h-fit space-y-5 rounded-sm border border-border bg-card p-6">
            <InfoRow icon={Calendar} label="Schedule" value={program.scheduleDisplay} />
            <InfoRow
              icon={MapPin}
              label="Location"
              value={program.location ?? "Location TBD"}
            />
            <InfoRow
              icon={Users}
              label="Age / Grade"
              value={program.ageRange ?? "Details Coming Soon"}
              demo={program.capacityIsDemo}
            />
            {hasTieredPricing ? (
              <div className="flex items-start gap-3">
                <DollarSign className="mt-0.5 size-4 shrink-0 text-impact" aria-hidden />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Pricing
                  </p>
                  <ul className="mt-0.5 space-y-0.5">
                    {program.sessions.map((session) => (
                      <li key={session.id} className="text-sm font-medium text-navy">
                        {session.label} — ${session.price}
                        {session.priceIsDemo && (
                          <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                            (estimated)
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3">
                <DollarSign className="mt-0.5 size-4 shrink-0 text-impact" aria-hidden />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Price
                  </p>
                  <p className="text-sm font-medium text-navy">
                    {priceDisplay.headline}
                    {program.priceIsDemo && (
                      <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                        (estimated)
                      </span>
                    )}
                  </p>
                  {priceDisplay.sublabel && (
                    <p className="text-xs text-muted-foreground">{priceDisplay.sublabel}</p>
                  )}
                </div>
              </div>
            )}

            <div className="border-t border-border pt-5">
              {program.registrationOpen ? (
                <Link
                  href={`/register?program=${program.slug}`}
                  className="flex h-12 w-full items-center justify-center rounded-sm bg-impact font-heading text-base text-impact-foreground transition-colors hover:bg-impact/90"
                >
                  Register Now
                </Link>
              ) : (
                <div className="flex h-12 w-full items-center justify-center rounded-sm bg-muted font-heading text-base text-muted-foreground">
                  Registration Opens Soon
                </div>
              )}
              {(program.priceIsDemo || program.capacityIsDemo) && (
                <p className="mt-3 text-xs text-muted-foreground">
                  Pricing and capacity shown are estimates pending final confirmation from For
                  The Kids Athletics.
                </p>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
  demo,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  demo?: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 size-4 shrink-0 text-impact" aria-hidden />
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className="text-sm font-medium text-navy">
          {value}
          {demo && <span className="ml-1.5 text-xs font-normal text-muted-foreground">(estimated)</span>}
        </p>
      </div>
    </div>
  );
}
