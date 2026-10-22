import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * "nav" is the icon + FTK ATHLETICS wordmark (no tagline — illegible at
 * navbar height). "footer" is the full lockup including the tagline, sized
 * up where there's room for it to stay readable.
 */
export function BrandMark({
  className,
  variant = "nav",
}: {
  className?: string;
  variant?: "nav" | "footer";
}) {
  const isFooter = variant === "footer";
  return (
    <Link
      href="/"
      className={cn("flex shrink-0 items-center", className)}
      aria-label="For The Kids Athletics home"
    >
      {isFooter ? (
        <Image
          src="/brand/ftk-logo-full.png"
          alt="For The Kids Athletics — For The Kids. For The Family. For The Community."
          width={700}
          height={488}
          unoptimized
          className="h-24 w-auto sm:h-28"
        />
      ) : (
        <picture>
          <source srcSet="/brand/ftk-logo-mark.webp" type="image/webp" />
          <img
            src="/brand/ftk-logo-mark.png"
            alt="For The Kids Athletics"
            width={700}
            height={446}
            loading="eager"
            fetchPriority="high"
            decoding="async"
            className="h-14 w-auto sm:h-16"
          />
        </picture>
      )}
    </Link>
  );
}
