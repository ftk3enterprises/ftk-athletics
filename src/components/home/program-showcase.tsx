import Link from "next/link";
import { ArrowRight, Gift, Trophy, Users, Zap } from "lucide-react";
import { getCategoryPrograms, programCategories, type ProgramCategory } from "@/data/program-categories";
import { PictureFill } from "@/components/ui/picture-fill";
import { Reveal } from "@/components/ui/reveal";
import type { Program } from "@/types";

const UNSPLASH_HOSTS = ["images.unsplash.com", "plus.unsplash.com"];

/**
 * Derives a mobile-sized source alongside the original image: for images we
 * host, a pre-generated `-mobile.webp` sibling; for Unsplash URLs, the same
 * URL with a smaller `w=` (Unsplash content-negotiates format itself, so
 * only the width needs adjusting). Categories without a pre-generated
 * sibling just get one size everywhere — no missing-asset risk.
 */
function responsiveSources(src: string): { desktop: string; mobile?: string } {
  try {
    const url = new URL(src);
    if (UNSPLASH_HOSTS.includes(url.hostname)) {
      const mobileUrl = new URL(src);
      mobileUrl.searchParams.set("w", "800");
      return { desktop: src, mobile: mobileUrl.toString() };
    }
    return { desktop: src };
  } catch {
    // Not a full URL — a local /about/*.jpg path.
    const webp = src.replace(/\.jpe?g$/i, ".webp");
    if (webp === src) return { desktop: src };
    return { desktop: webp, mobile: webp.replace(/\.webp$/, "-mobile.webp") };
  }
}

type Tone = "carolina" | "white" | "navy" | "impact";

interface BlockStyle {
  tone: Tone;
  icon: React.ComponentType<{ className?: string }>;
}

const BLOCK_STYLES: BlockStyle[] = [
  { tone: "carolina", icon: Zap },
  { tone: "white", icon: Gift },
  { tone: "navy", icon: Trophy },
  { tone: "impact", icon: Users },
];

const TONE_CLASSES: Record<Tone, { bg: string; text: string; muted: string; eyebrow: string }> = {
  carolina: { bg: "bg-carolina", text: "text-navy", muted: "text-navy/70", eyebrow: "text-navy/60" },
  white: { bg: "bg-background", text: "text-navy", muted: "text-muted-foreground", eyebrow: "text-impact" },
  navy: { bg: "bg-navy", text: "text-white", muted: "text-white/70", eyebrow: "text-carolina" },
  impact: { bg: "bg-impact", text: "text-white", muted: "text-white/80", eyebrow: "text-white/70" },
};

function CategoryBlock({
  category,
  categoryPrograms,
  index,
  style,
}: {
  category: ProgramCategory;
  categoryPrograms: Program[];
  index: number;
  style: BlockStyle;
}) {
  const imageOnRight = index % 2 === 1;
  const tone = TONE_CLASSES[style.tone];
  const Icon = style.icon;
  const primaryProgram = categoryPrograms[0];

  const ctaLabel = category.ctaLabel;
  const ctaHref = `/programs/category/${category.slug}`;

  const content = (
    <div
      className={`flex min-h-[420px] flex-col justify-center ${tone.bg} ${tone.text} px-6 py-14 sm:px-10 md:px-14 lg:min-h-[480px] lg:py-14`}
    >
      <div className="flex items-center justify-between">
        <span className={`font-heading text-sm ${tone.eyebrow}`}>
          {String(index + 1).padStart(2, "0")}
        </span>
        <Icon className={`size-6 ${tone.eyebrow}`} aria-hidden />
      </div>

      <h3 className="mt-6 text-4xl leading-[0.95] sm:text-5xl">{category.name}</h3>
      <p className={`mt-4 max-w-md text-lg ${tone.muted}`}>{category.description}</p>

      <Link
        href={ctaHref}
        className={`group mt-7 inline-flex w-fit items-center gap-2 border-b-2 pb-1 text-base font-bold uppercase tracking-wide ${tone.text} ${style.tone === "white" ? "border-impact" : "border-current"}`}
      >
        {ctaLabel}
        <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden />
      </Link>
    </div>
  );

  const imageSrc = category.image ?? primaryProgram.image;
  const { desktop, mobile } = responsiveSources(imageSrc);

  const image = (
    <div className="relative min-h-[280px] lg:min-h-[480px]">
      <PictureFill desktopSrc={desktop} mobileSrc={mobile} fallbackSrc={imageSrc} alt="" />
    </div>
  );

  return (
    <Reveal amount={0.15} className="grid grid-cols-1 lg:grid-cols-2">
      <div className={`order-1 ${imageOnRight ? "lg:order-2" : "lg:order-1"}`}>{image}</div>
      <div className={`order-2 ${imageOnRight ? "lg:order-1" : "lg:order-2"}`}>{content}</div>
    </Reveal>
  );
}

export function ProgramShowcase() {
  return (
    <div className="divide-y divide-border/10 border-t border-border/10">
      {programCategories.map((category, index) => (
        <CategoryBlock
          key={category.id}
          category={category}
          categoryPrograms={getCategoryPrograms(category)}
          index={index}
          style={BLOCK_STYLES[index % BLOCK_STYLES.length]}
        />
      ))}
    </div>
  );
}
