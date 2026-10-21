import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { STEP_UP_URL } from "@/data/config";
import { Reveal } from "@/components/ui/reveal";

const STEPS = [
  "Apply for the scholarship on the Step Up For Students site",
  "Create your For The Kids profile and add each child",
  "Register for camps, after school, leagues, and tournaments",
  "We help you apply funds to your chosen programs",
];

export function StepUpSection() {
  return (
    <section
      id="step-up"
      className="scroll-mt-20 bg-muted py-20 sm:py-24"
    >
      <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:items-center lg:gap-16 lg:px-8">
        {/* Left */}
        <div>
          <Reveal>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-impact">
              Scholarship Funding
            </p>
          </Reveal>

          <Reveal delay={0.08}>
            <h2 className="mt-3 text-4xl uppercase leading-[1.05] sm:text-5xl">
              Step Up For
              <br />
              Students
            </h2>
          </Reveal>

          <Reveal delay={0.16}>
            <p className="mt-5 max-w-xl leading-relaxed text-muted-foreground">
              Florida families can use Step Up For Students scholarship funds
              toward our programs. Apply through Step Up For Students, then create
              your For The Kids profile so we can match your award to your
              child&apos;s sign-ups.
            </p>
          </Reveal>

          <Reveal delay={0.24}>
            <div className="mt-8 flex flex-col items-start gap-3">
              <a
                href={STEP_UP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-14 w-full items-center justify-center gap-3 bg-navy px-8 font-heading text-base uppercase text-white transition-colors hover:bg-navy/90 sm:w-auto sm:min-w-[410px]"
              >
                Sign Up At Step Up For Students
                <ArrowRight className="size-4" aria-hidden />
              </a>

              <Link
                href="/auth"
                className="inline-flex h-14 w-full items-center justify-center border-2 border-navy px-8 font-heading text-base uppercase text-navy transition-colors hover:bg-navy/5 sm:w-auto sm:min-w-[270px]"
              >
                Create Your Profile
              </Link>
            </div>
          </Reveal>
        </div>

        {/* Right */}
        <Reveal delay={0.1}>
          <ol className="border-2 border-navy bg-background px-6 py-7 sm:px-8 sm:py-8">
            {STEPS.map((step, i) => (
              <li
                key={step}
                className="flex items-start gap-4 py-2"
              >
                <span className="w-8 shrink-0 font-heading text-lg text-impact">
                  {String(i + 1).padStart(2, "0")}
                </span>

                <span className="pt-0.5 font-semibold leading-snug text-navy">
                  {step}
                </span>
              </li>
            ))}
          </ol>
        </Reveal>
      </div>
    </section>
  );
}
