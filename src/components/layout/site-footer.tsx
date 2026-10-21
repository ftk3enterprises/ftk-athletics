import Link from "next/link";
import { BrandMark } from "@/components/layout/brand-mark";
import { FacebookIcon, InstagramIcon, XIcon } from "@/components/shared/social-icons";
import { STEP_UP_URL, CONTACT_EMAIL, CONTACT_PHONE, CONTACT_LOCATION, SOCIAL_LINKS } from "@/data/config";

const SOCIAL_ICON_BY_PLATFORM = {
  facebook: FacebookIcon,
  instagram: InstagramIcon,
  twitter: XIcon,
} as const;

const SOCIAL_LABEL_BY_PLATFORM = {
  facebook: "Facebook",
  instagram: "Instagram",
  twitter: "Twitter",
} as const;

export function SiteFooter() {
  return (
    <footer className="bg-navy border-t border-white/10">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2 lg:col-span-1">
            <BrandMark variant="footer" />
            <p className="mt-4 max-w-xs text-sm text-white/60">
              Programs that move kids, adults, and entire families.
            </p>
            <div className="mt-5 flex items-center gap-4">
              {SOCIAL_LINKS.map(({ platform, href }) => {
                const Icon = SOCIAL_ICON_BY_PLATFORM[platform];
                const label = SOCIAL_LABEL_BY_PLATFORM[platform];
                return href ? (
                  <a
                    key={platform}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="text-white/60 transition-colors hover:text-carolina"
                  >
                    <Icon className="size-5" />
                  </a>
                ) : (
                  <span key={platform} aria-label={label} className="text-white/30">
                    <Icon className="size-5" />
                  </span>
                );
              })}
            </div>
          </div>

          <FooterColumn
            title="Programs"
            links={[
              { label: "All Programs", href: "/programs" },
              { label: "Schedule", href: "/schedule" },
            ]}
          />

          <FooterColumn
            title="For The Kids"
            links={[
              { label: "Step Up", href: STEP_UP_URL, external: true },
              { label: "Sponsors", href: "/#sponsors" },
              { label: "About", href: "/#about" },
            ]}
          />

          <FooterColumn
            title="Get Started"
            links={[
              { label: "Register Now", href: "/register" },
              { label: "Sign In", href: "/auth?tab=sign-in" },
            ]}
          />
        </div>

        <div className="mt-12 flex flex-col gap-2 border-t border-white/10 pt-6 text-xs text-white/50 sm:flex-row sm:items-center sm:justify-between">
          <span>
            © {new Date().getFullYear()} For The Kids Athletics.{CONTACT_LOCATION ? ` ${CONTACT_LOCATION}.` : ""} All rights reserved.
          </span>
          {(CONTACT_EMAIL || CONTACT_PHONE) && (
            <span className="flex flex-wrap items-center gap-x-1.5">
              {CONTACT_EMAIL && (
                <a href={`mailto:${CONTACT_EMAIL}`} className="transition-colors hover:text-carolina">
                  {CONTACT_EMAIL}
                </a>
              )}
              {CONTACT_EMAIL && CONTACT_PHONE ? <span>·</span> : null}
              {CONTACT_PHONE && (
                <a href={`tel:${CONTACT_PHONE.replace(/[^0-9+]/g, "")}`} className="transition-colors hover:text-carolina">
                  {CONTACT_PHONE}
                </a>
              )}
            </span>
          )}
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string; external?: boolean }[];
}) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wide text-white/50">{title}</h3>
      <ul className="mt-4 space-y-2.5">
        {links.map((link) => (
          <li key={link.href + link.label}>
            {link.external ? (
              <a
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-white/80 transition-colors hover:text-carolina"
              >
                {link.label}
              </a>
            ) : (
              <Link
                href={link.href}
                className="text-sm text-white/80 transition-colors hover:text-carolina"
              >
                {link.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
