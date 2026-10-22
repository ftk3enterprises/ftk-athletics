/**
 * Fills its (already `position: relative`) parent the same way next/image's
 * `fill` + `object-cover` does, but as a real `<picture>` so mobile gets a
 * smaller, WebP-encoded source instead of the same desktop-sized file —
 * needed because `images.unoptimized: true` (no Workers image optimizer)
 * means next/image never generates a responsive srcset on its own.
 */
/** Only pre-generated local .webp files get a declared MIME type — remote
 * sources (e.g. Unsplash) content-negotiate their own format server-side,
 * so forcing `type="image/webp"` on those could make the browser skip the
 * `<source>` if the server ever decides to return AVIF instead. */
function sourceType(src: string): string | undefined {
  return src.endsWith(".webp") ? "image/webp" : undefined;
}

interface PictureFillProps {
  /** Source for the 1024px+ (lg) breakpoint — a local .webp file, or a
   * remote URL that content-negotiates its own format. */
  desktopSrc: string;
  /** Source below 1024px. Omit when the image is small enough, or always
   * full-bleed (e.g. the hero), that one size covers every viewport. */
  mobileSrc?: string;
  /** Original file, used as the `<img src>` fallback for browsers/crawlers
   * that ignore `<picture>`. */
  fallbackSrc: string;
  alt: string;
  /** Applied to the `<img>` in addition to the fill/object-cover base classes. */
  className?: string;
  /** Eager-loads with high fetch priority — use only for the LCP candidate. */
  priority?: boolean;
}

export function PictureFill({
  desktopSrc,
  mobileSrc,
  fallbackSrc,
  alt,
  className,
  priority,
}: PictureFillProps) {
  return (
    <picture>
      {mobileSrc ? (
        <source media="(max-width: 1023px)" srcSet={mobileSrc} type={sourceType(mobileSrc)} />
      ) : null}
      <source srcSet={desktopSrc} type={sourceType(desktopSrc)} />
      <img
        src={fallbackSrc}
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : undefined}
        decoding="async"
        className={`absolute inset-0 h-full w-full object-cover${className ? ` ${className}` : ""}`}
      />
    </picture>
  );
}
