import type { CSSProperties } from "react";
import Image from "next/image";
import { ArrowRight, Maximize2, MapPin } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { ACTIVE_FLYERS, type LeagueFlyer } from "@/data/flyers";

function flyerRatio(flyer: LeagueFlyer): CSSProperties {
  return { aspectRatio: `${flyer.flyerWidth} / ${flyer.flyerHeight}` };
}

function FlyerDialog({ flyer }: { flyer: LeagueFlyer }) {
  const src = flyer.fullFlyerSrc ?? flyer.flyerSrc;
  const ratio: CSSProperties = {
    aspectRatio: `${flyer.fullFlyerWidth ?? flyer.flyerWidth} / ${flyer.fullFlyerHeight ?? flyer.flyerHeight}`,
  };
  return (
    <DialogContent className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-sm border-none bg-white p-3 ring-1 ring-foreground/10">
      <DialogTitle className="sr-only">
        {flyer.eyebrow} — {flyer.title} flyer
      </DialogTitle>
      <DialogDescription className="sr-only">Full-size view of the official flyer.</DialogDescription>
      <div className="relative w-full overflow-hidden rounded-sm" style={ratio}>
        <Image src={src} alt={flyer.flyerAlt} fill sizes="(min-width: 640px) 28rem, 90vw" className="object-contain" />
      </div>
    </DialogContent>
  );
}

/** Flyer image on top, compact info directly beneath — flyer renders at its own true aspect ratio, never cropped. */
function FlyerCard({ flyer }: { flyer: LeagueFlyer }) {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-sm border border-border bg-card">
      <Dialog>
        <DialogTrigger
          aria-label={`View full flyer for ${flyer.eyebrow} ${flyer.title}`}
          className="group relative block w-full bg-muted outline-none focus-visible:ring-2 focus-visible:ring-impact focus-visible:ring-offset-2"
          style={flyerRatio(flyer)}
        >
          <div className="relative h-full w-full">
            <Image
              src={flyer.flyerSrc}
              alt={flyer.flyerAlt}
              fill
              sizes="(min-width: 1024px) 380px, (min-width: 640px) 45vw, 90vw"
              className="object-contain"
            />
          </div>
          <span className="absolute inset-0 flex items-center justify-center bg-navy/0 opacity-0 transition group-hover:bg-navy/40 group-hover:opacity-100 group-focus-visible:bg-navy/40 group-focus-visible:opacity-100">
            <span className="inline-flex items-center gap-1.5 rounded-sm bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-navy">
              <Maximize2 className="size-3.5" aria-hidden />
              View Flyer
            </span>
          </span>
        </DialogTrigger>
        <FlyerDialog flyer={flyer} />
      </Dialog>

      <div className="flex flex-1 flex-col gap-1.5 border-t border-border p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-impact">{flyer.eyebrow}</p>
        <h4 className="text-lg text-navy">{flyer.title}</h4>
        <p className="flex items-start gap-1.5 text-sm text-muted-foreground">
          <MapPin className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          <span>{flyer.supportingText}</span>
        </p>

        <div className="mt-auto pt-3">
          {flyer.cta ? (
            <a
              href={flyer.cta.href}
              {...(flyer.cta.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              className="inline-flex h-9 items-center gap-1.5 rounded-sm bg-navy px-3 text-xs font-semibold uppercase tracking-wide text-white transition-colors hover:bg-navy/90"
            >
              {flyer.cta.label}
              <ArrowRight className="size-3.5" aria-hidden />
            </a>
          ) : (
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground/60">
              Details &amp; registration opening soon
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export function LeagueFlyerSection() {
  const flyers = ACTIVE_FLYERS;

  if (flyers.length === 0) return null;

  return (
    <section className="bg-background py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-impact">
            What&apos;s Happening At FTK
          </p>
        </Reveal>
        <Reveal delay={0.08}>
          <h3 className="mt-3 text-2xl text-navy sm:text-3xl">Leagues &amp; Community Events</h3>
        </Reveal>

        <div
          className={cn(
            "mt-8 grid grid-cols-1 gap-5",
            flyers.length >= 2 && "sm:grid-cols-2",
            flyers.length >= 3 && "lg:grid-cols-3"
          )}
        >
          {flyers.map((flyer, index) => (
            <Reveal key={flyer.id} delay={0.1 + index * 0.08} duration={0.6} amount={0.2}>
              <FlyerCard flyer={flyer} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
