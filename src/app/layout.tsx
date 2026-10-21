import type { Metadata } from "next";
import { Archivo_Black, Hind } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { AuthProvider } from "@/context/auth-context";
import { RegistrationDraftProvider } from "@/context/registration-draft-context";

const archivoBlack = Archivo_Black({
  variable: "--font-archivo-black",
  subsets: ["latin"],
  weight: "400",
});

const hind = Hind({
  variable: "--font-hind",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://ftkathletics.com";
const title = "For The Kids Athletics | Multi-Sport Programs";
const description =
  "For The Kids Athletics offers multi-sport programs, camps, and leagues for kids, families, and adults in Sarasota, Florida.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title,
  description,
  openGraph: {
    title,
    description,
    url: siteUrl,
    siteName: "For The Kids Athletics",
    images: [{ url: "/brand/ftk-logo-full.png", width: 700, height: 488, alt: "For The Kids Athletics" }],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/brand/ftk-logo-full.png"],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${archivoBlack.variable} ${hind.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col pb-[calc(4rem+env(safe-area-inset-bottom))] lg:pb-0">
        <AuthProvider>
          <RegistrationDraftProvider>
            <SiteHeader />
            <main className="flex-1">{children}</main>
            <SiteFooter />
            <MobileBottomNav />
          </RegistrationDraftProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
