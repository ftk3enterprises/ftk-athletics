import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ProgramCard } from "@/components/programs/program-card";
import { getCategoryBySlug, getCategoryPrograms, programCategories } from "@/data/program-categories";

export function generateStaticParams() {
  return programCategories.map((category) => ({ slug: category.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = getCategoryBySlug(slug);
  return { title: category ? `${category.name} | For The Kids Athletics` : "Not Found" };
}

export default async function ProgramCategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = getCategoryBySlug(slug);
  if (!category) notFound();

  const categoryPrograms = getCategoryPrograms(category);
  if (categoryPrograms.length === 0) notFound();
  if (categoryPrograms.length === 1) {
    redirect(`/programs/${categoryPrograms[0].slug}`);
  }

  return (
    <div className="bg-background">
      <div className="bg-navy py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Link
            href="/programs"
            className="inline-flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wide text-white/70 transition-colors hover:text-carolina"
          >
            <ArrowLeft className="size-3.5" aria-hidden />
            All Programs
          </Link>
          <p className="mt-6 text-sm font-semibold uppercase tracking-wide text-carolina">
            Program Category
          </p>
          <h1 className="mt-2 text-4xl text-white sm:text-5xl">{category.name}</h1>
          <p className="mt-4 max-w-xl text-white/70">
            {categoryPrograms.length} programs currently planned under {category.name}.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {categoryPrograms.map((program) => (
            <ProgramCard key={program.id} program={program} />
          ))}
        </div>
      </div>
    </div>
  );
}
