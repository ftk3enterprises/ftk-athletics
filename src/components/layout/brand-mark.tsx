import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Both variants use the same full lockup artwork (mark + tagline banner) —
 * "nav" is a smaller, pre-sized export for the compact header, "footer" is
 * the larger export for where there's more room.
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
          width={1200}
          height={446}
          unoptimized
          className="h-24 w-auto sm:h-28"
        />
      ) : (
        <picture>
          <source srcSet="/brand/ftk-logo-mark.webp" type="image/webp" />
          <img
            src="/brand/ftk-logo-mark.png"
            alt="For The Kids Athletics — For The Kids. For The Family. For The Community."
            width={688}
            height={256}
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
