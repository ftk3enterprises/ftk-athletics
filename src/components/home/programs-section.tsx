import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ProgramShowcase } from "@/components/home/program-showcase";
import { Reveal } from "@/components/ui/reveal";

export function ProgramsSection() {
  return (
    <section id="programs" className="scroll-mt-20 bg-background py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <Reveal>
              <p className="text-sm font-semibold uppercase tracking-wide text-impact">
                One Organization. Four Ways To Move.
              </p>
            </Reveal>
            <Reveal delay={0.08}>
              <h2 className="mt-2 text-4xl sm:text-5xl">
                There Is A Place <br className="hidden sm:block" />
                For Your Family Here.
              </h2>
            </Reveal>
          </div>
          <Reveal delay={0.16}>
            <Link
              href="/schedule"
              className="inline-flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wide text-navy transition-colors hover:text-impact"
            >
              View Full Schedule
              <ArrowRight className="size-3.5" aria-hidden />
            </Link>
          </Reveal>
        </div>
      </div>

      <div className="mt-12">
        <ProgramShowcase />
      </div>
    </section>
  );
}
