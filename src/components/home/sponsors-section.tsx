"use client";

import { useRef, useState } from "react";
import { Link2, ArrowRight } from "lucide-react";
import { SponsorInquiryForm } from "@/components/home/sponsor-inquiry-form";
import { Reveal } from "@/components/ui/reveal";

const SPONSOR_TIERS = [
  {
    title: "Team",
    description: "Jersey and banner placement for one team",
  },
  {
    title: "Program",
    description: "Season-long presence across a full program",
  },
  {
    title: "Season",
    description: "Top billing at every event and tournament",
  },
];

// Matches the exact filenames in public/sponsor-cards — they're prefixed
// with a sort order, not a plain sequential index, so the list is explicit
// rather than assumed.
const SPONSOR_FILES = [
  "01-captain-curts-village.png",
  "02-chick-fil-a-pelican-plaza.png",
  "03-sarasota-sign-machine.png",
  "04-the-ups-store.png",
  "05-normans-liquors.png",
  "06-cox-chevrolet.png",
  "07-bodhi-ccs-plumbing.png",
  "08-snook-tiki-captain-curts.png",
  "09-srq-smiles.png",
  "10-sos-sherk-outdoor-services.png",
  "11-lakewood-ranch-plastic-surgery.png",
  "12-build-srq.png",
  "13-bold-live-work-play.png",
  "14-siesta-key-watersports.png",
  "15-bafmin-agentic-ai.png",
  "16-catch-sarasota-fishing-charters.png",
  "17-madison-street-capital.png",
  "18-keen-construction-co.png",
  "19-battaglia-flooring.png",
  "20-i-got-your-back-sarasota-sign-machine.png",
  "21-gail-baird-foundation.png",
];

const ACRONYMS = new Set(["ups", "srq", "sos", "ccs"]);

function sponsorAlt(filename: string): string {
  const slug = filename.replace(/\.png$/, "").replace(/^\d+-/, "");
  return slug
    .split("-")
    .map((word) => (ACRONYMS.has(word) ? word.toUpperCase() : word.charAt(0).toUpperCase() + word.slice(1)))
    .join(" ");
}

const sponsorLogos = SPONSOR_FILES.map((file, index) => ({
  id: index + 1,
  src: `/sponsor-cards/${file}`,
  alt: sponsorAlt(file),
}));

// First 2 rows of the mobile 2-column grid.
const MOBILE_COLLAPSED_COUNT = 4;

export function SponsorsSection() {
  const [logosExpanded, setLogosExpanded] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const logoGridRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLDivElement>(null);

  function openForm() {
    setShowForm(true);
    // Already visible at lg: and up (same as before); on mobile this is
    // also where the form will expand into, so scrolling there immediately
    // feels natural rather than jumpy.
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function toggleLogosExpanded() {
    const next = !logosExpanded;
    setLogosExpanded(next);
    if (!next) {
      // Collapsing removes a lot of height below the grid — bring the user
      // back to the top of the grid instead of leaving them stranded over
      // whatever section now happens to have scrolled into view.
      logoGridRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  return (
    <section
      id="sponsors"
      className="scroll-mt-20 bg-navy py-20 sm:py-24"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Heading */}
        <Reveal>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-carolina">
            Our Sponsors
          </p>
        </Reveal>

        <Reveal delay={0.08}>
          <h2 className="mt-3 text-4xl text-white sm:text-5xl">
            Backed By Our Community
          </h2>
        </Reveal>

        {/* Sponsor logos */}
        <Reveal delay={0.16}>
          <div ref={logoGridRef} id="sponsor-logos" className="scroll-mt-20">
            <div
              className={`mt-12 grid grid-cols-2 gap-3 overflow-hidden sm:grid-cols-4 sm:max-h-none! sm:overflow-visible lg:grid-cols-7 ${
                logosExpanded ? "max-h-[6000px]" : "max-h-[320px]"
              } motion-safe:transition-[max-height] motion-safe:duration-700 motion-safe:ease-[cubic-bezier(0.22,1,0.36,1)]`}
            >
              {sponsorLogos.map((sponsor, index) => {
                const isExtra = index >= MOBILE_COLLAPSED_COUNT;
                return (
                  <div
                    key={sponsor.id}
                    aria-hidden={isExtra && !logosExpanded ? true : undefined}
                    className={`relative z-0 flex items-center justify-center border border-white/15 bg-white/[0.04] p-2.5 transition-[transform,opacity] duration-300 ease-out will-change-transform hover:z-20 hover:scale-110 sm:h-28 sm:px-3 sm:py-6 ${
                      isExtra ? `sm:opacity-100 ${logosExpanded ? "opacity-100" : "opacity-0"}` : ""
                    }`}
                  >
                    <img
                      src={sponsor.src}
                      alt={sponsor.alt}
                      className="h-auto w-full object-contain sm:h-auto sm:w-auto sm:max-h-full sm:max-w-full"
                    />
                  </div>
                );
              })}
            </div>

            <div className="mt-6 flex justify-center sm:hidden">
              <button
                type="button"
                onClick={toggleLogosExpanded}
                className="border border-white/20 px-6 py-2.5 text-xs font-semibold uppercase tracking-wide text-white/80 transition-colors hover:border-carolina hover:text-carolina"
              >
                {logosExpanded ? "Show Less ↑" : "View All Sponsors ↓"}
              </button>
            </div>
          </div>
        </Reveal>

        {/* Become a sponsor — desktop keeps the original always-visible
            two-column layout; only mobile collapses the form behind a
            Become A Sponsor tap. */}
        <div className="mt-24 grid gap-14 lg:grid-cols-2 lg:gap-20">
          <div>
            <Reveal>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-carolina">
                Partner With Us
              </p>
            </Reveal>

            <Reveal delay={0.08}>
              <h3 className="mt-3 text-3xl text-white sm:text-4xl">
                Become A Sponsor
              </h3>
            </Reveal>

            <Reveal delay={0.16}>
              <p className="mt-6 max-w-lg text-base leading-7 text-white/70">
                Local businesses and families keep kids on the field. Sponsors
                get visibility on jerseys, banners, and event days across every
                program we run.
              </p>
            </Reveal>

            <Reveal delay={0.24}>
              <button
                type="button"
                onClick={openForm}
                className="mt-8 inline-flex h-14 w-full items-center justify-center gap-3 bg-impact px-8 font-heading text-base uppercase text-impact-foreground transition-colors hover:bg-impact/90 sm:w-auto sm:min-w-[270px]"
              >
                Become A Sponsor
                <ArrowRight className="size-4" aria-hidden />
              </button>
            </Reveal>

            {/* Sponsor tiers */}
            <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-3">
              {SPONSOR_TIERS.map((tier, index) => (
                <Reveal key={tier.title} delay={0.32 + index * 0.08}>
                  <div className="border border-white/15 bg-white/5 px-3 py-6">
                    <Link2
                      className="size-5 text-carolina"
                      aria-hidden
                    />

                    <p className="mt-4 font-heading text-lg text-white">
                      {tier.title}
                    </p>

                    <p className="mt-3 text-sm leading-6 text-white/60">
                      {tier.description}
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>

          {/* Inquiry form — always rendered (and always visible at lg: and
              up, exactly as before); on mobile it stays collapsed to 0
              height until "Become A Sponsor" is tapped. */}
          <Reveal delay={0.1} id="sponsor-form" className="scroll-mt-24 lg:pt-1">
            <div
              className={`overflow-hidden motion-safe:transition-[max-height,opacity] motion-safe:duration-500 motion-safe:ease-[cubic-bezier(0.22,1,0.36,1)] lg:max-h-none! lg:overflow-visible lg:opacity-100! ${
                showForm ? "max-h-[1400px] opacity-100" : "max-h-0 opacity-0"
              }`}
            >
              <div ref={formRef} className="scroll-mt-24 border border-white/15 bg-white/5 p-6 sm:p-8 lg:border-0 lg:bg-transparent lg:p-0">
                <div className="flex items-center justify-between gap-4 lg:hidden">
                  <h4 className="font-heading text-xl text-white">Sponsor Inquiry</h4>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="text-sm font-semibold uppercase tracking-wide text-white/50 transition-colors hover:text-white"
                  >
                    Cancel
                  </button>
                </div>

                <div className="mt-6 lg:mt-0">
                  <SponsorInquiryForm />
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
