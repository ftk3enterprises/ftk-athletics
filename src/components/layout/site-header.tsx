"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, ChevronDown, LogOut, Menu, UserCircle } from "lucide-react";
import { useState } from "react";
import { BrandMark } from "@/components/layout/brand-mark";
import { primaryNavLinks, programNavItems } from "@/components/layout/nav-links";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/context/auth-context";

export function SiteHeader() {
  const { user, isAdmin, isLoading, signOut } = useAuth();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleRegisterNow = () => {
    setMobileOpen(false);
    router.push(user ? "/register" : "/auth?redirect=/register");
  };

  const handleLogout = async () => {
    setIsSigningOut(true);
    setMobileOpen(false);
    await signOut();
    // Hard navigation: guarantees we land on the homepage even though the
    // current page (e.g. /profile) has its own "redirect to /auth if logged
    // out" effect that would otherwise race a client-side router.push here.
    window.location.href = "/";
  };

  const accountHref = isAdmin ? "/admin" : user ? "/profile" : "/auth?tab=sign-in";
  const accountLabel = isLoading ? "" : isAdmin ? "Admin Portal" : user ? "My Profile" : "Sign In";

  return (
    <header className="sticky top-0 z-50 bg-navy border-b border-white/10">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <BrandMark />

        <nav className="hidden items-center gap-7 lg:flex" aria-label="Primary">
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-1 text-[0.9375rem] font-bold uppercase tracking-wide text-carolina transition-colors hover:text-white outline-none">
              Programs
              <ChevronDown className="size-3.5" aria-hidden />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="w-80 rounded-xl p-2.5 shadow-lg"
            >
              <DropdownMenuItem
                render={
                  <Link
                    href="/programs"
                    className="flex items-center justify-between gap-2 rounded-lg px-4 py-3 text-[0.95rem] font-bold text-navy focus:bg-carolina focus:text-navy data-[highlighted]:bg-carolina data-[highlighted]:text-navy"
                  />
                }
              >
                View All Programs
                <ArrowRight className="size-3.5" aria-hidden />
              </DropdownMenuItem>

              <DropdownMenuSeparator className="my-2" />

              <div className="space-y-1">
                {programNavItems.map((item) => (
                  <DropdownMenuItem
                    key={item.href}
                    render={
                      <Link
                        href={item.href}
                        className="rounded-lg px-4 py-3 text-[0.95rem] text-navy/90 focus:bg-carolina focus:text-navy data-[highlighted]:bg-carolina data-[highlighted]:text-navy"
                      />
                    }
                  >
                    {item.label}
                  </DropdownMenuItem>
                ))}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {primaryNavLinks.map((link) =>
            link.external ? (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[0.9375rem] font-bold uppercase tracking-wide text-white/90 transition-colors hover:text-carolina"
              >
                {link.label}
              </a>
            ) : (
              <Link
                key={link.href}
                href={link.href}
                className="text-[0.9375rem] font-bold uppercase tracking-wide text-white/90 transition-colors hover:text-carolina"
              >
                {link.label}
              </Link>
            )
          )}

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-1 text-sm font-semibold uppercase tracking-wide text-white/90 transition-colors hover:text-carolina outline-none">
                {accountLabel}
                <ChevronDown className="size-3.5" aria-hidden />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52 rounded-xl p-2.5 shadow-lg">
                <DropdownMenuItem
                  render={
                    <Link
                      href={accountHref}
                      className="rounded-lg px-4 py-2.5 text-[0.95rem] font-bold text-navy focus:bg-carolina focus:text-navy data-[highlighted]:bg-carolina data-[highlighted]:text-navy"
                    />
                  }
                >
                  {accountLabel}
                </DropdownMenuItem>
                <DropdownMenuSeparator className="my-2" />
                <DropdownMenuItem
                  onClick={handleLogout}
                  disabled={isSigningOut}
                  className="cursor-pointer gap-2 rounded-lg px-4 py-2.5 text-[0.95rem] font-bold text-navy focus:bg-carolina focus:text-navy data-[highlighted]:bg-carolina data-[highlighted]:text-navy"
                >
                  <LogOut className="size-4" aria-hidden />
                  {isSigningOut ? "Logging Out..." : "Log Out"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link
              href={accountHref}
              className="text-sm font-semibold uppercase tracking-wide text-white/90 transition-colors hover:text-carolina"
            >
              {accountLabel}
            </Link>
          )}
        </nav>

        {!isAdmin && (
          <div className="hidden lg:block">
            <Button
              onClick={handleRegisterNow}
              className="h-12 gap-2 rounded-sm bg-impact px-7 font-heading text-base text-impact-foreground hover:bg-impact/90"
            >
              Register Now
              <ArrowRight className="size-4" aria-hidden />
            </Button>
          </div>
        )}

        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger
            className="lg:hidden inline-flex size-10 items-center justify-center rounded-sm text-white hover:bg-white/10"
            aria-label="Open menu"
          >
            <Menu className="size-6" />
          </SheetTrigger>
          <SheetContent
            side="right"
            className="bg-navy border-white/10 w-full sm:max-w-sm flex flex-col overflow-y-auto"
          >
            <SheetHeader>
              <SheetTitle className="text-left">
                <BrandMark />
              </SheetTitle>
            </SheetHeader>
            <nav className="flex flex-1 flex-col gap-1 px-4" aria-label="Mobile">
              <span className="mt-2 text-xs font-semibold uppercase tracking-wide text-white/50">
                Programs
              </span>
              <Link
                href="/programs"
                onClick={() => setMobileOpen(false)}
                className="rounded-sm px-2 py-2.5 text-base font-semibold text-carolina"
              >
                View All Programs
              </Link>
              {programNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-sm px-2 py-2.5 text-base font-medium text-white/90"
                >
                  {item.label}
                </Link>
              ))}

              <div className="my-3 h-px bg-white/10" />

              {primaryNavLinks.map((link) =>
                link.external ? (
                  <a
                    key={link.href}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setMobileOpen(false)}
                    className="rounded-sm px-2 py-2.5 text-base font-semibold uppercase tracking-wide text-white/90"
                  >
                    {link.label}
                  </a>
                ) : (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="rounded-sm px-2 py-2.5 text-base font-semibold uppercase tracking-wide text-white/90"
                  >
                    {link.label}
                  </Link>
                )
              )}
              {!user && (
                <Link
                  href={accountHref}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-sm px-2 py-2.5 text-base font-semibold uppercase tracking-wide text-white/90"
                >
                  {accountLabel}
                </Link>
              )}

              {!isAdmin && (
                <Button
                  onClick={handleRegisterNow}
                  className="mt-4 h-12 gap-2 rounded-sm bg-impact font-heading text-base text-impact-foreground hover:bg-impact/90"
                >
                  Register Now
                  <ArrowRight className="size-4" aria-hidden />
                </Button>
              )}
            </nav>

            {user && (
              <div className="mt-auto border-t border-white/10 px-4 pt-4 pb-6">
                <div className="flex items-center gap-2.5 px-2 py-1.5 text-white/90">
                  <UserCircle className="size-5 shrink-0" aria-hidden />
                  <span className="truncate text-sm font-semibold">{user.name}</span>
                </div>
                <Link
                  href={accountHref}
                  onClick={() => setMobileOpen(false)}
                  className="mt-1 block rounded-sm px-2 py-2.5 text-base font-semibold uppercase tracking-wide text-white/90"
                >
                  {accountLabel}
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={isSigningOut}
                  className="mt-1 flex w-full items-center gap-2 rounded-sm px-2 py-2.5 text-base font-semibold uppercase tracking-wide text-white/90 disabled:opacity-50"
                >
                  <LogOut className="size-4" aria-hidden />
                  {isSigningOut ? "Logging Out..." : "Log Out"}
                </button>
              </div>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
