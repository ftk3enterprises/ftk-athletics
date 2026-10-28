import type { Metadata } from "next";
import { ProgramCard } from "@/components/programs/program-card";
import { programs, sortByRegistrationStatus } from "@/data/programs";

export const metadata: Metadata = {
  title: "All Programs | For The Kids Athletics",
};

export default function ProgramsPage() {
  return (
    <div className="bg-background">
      <div className="bg-navy py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-carolina">
            One Organization. Four Ways To Move.
          </p>
          <h1 className="mt-2 text-4xl text-white sm:text-5xl">All Programs</h1>
          <p className="mt-4 max-w-xl text-white/70">
            Clinics, camps, and leagues for kids, families, and adults. Pick a program below to
            see schedule, pricing, and registration details.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {sortByRegistrationStatus(programs).map((program) => (
            <ProgramCard key={program.id} program={program} />
          ))}
        </div>
      </div>
    </div>
  );
}
