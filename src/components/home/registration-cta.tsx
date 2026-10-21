import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";

export function RegistrationCta() {
  return (
    <section className="bg-impact">
      <div className="mx-auto flex max-w-7xl flex-col items-start gap-6 px-4 py-14 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <Reveal>
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-white/80">
              Your Next Season Starts Here
            </p>
            <h2 className="mt-2 text-4xl text-white sm:text-5xl">Ready To Get In The Game?</h2>
          </div>
        </Reveal>
        <Reveal delay={0.08}>
          <Link
            href="/register"
            className="inline-flex h-12 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-sm bg-navy px-7 font-heading text-base text-white transition-colors hover:bg-navy/90"
          >
            Start Registration
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
