"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, ClipboardPlus, Home, LayoutGrid, ShieldCheck, User } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { cn } from "@/lib/utils";

/**
 * Mobile-only quick-action bar — a supplement to the header/hamburger menu,
 * not a replacement. Lives at the root layout so it's available on every
 * route without duplicating navigation logic.
 */
export function MobileBottomNav() {
  const pathname = usePathname();
  const { user, isAdmin, isLoading } = useAuth();

  const isHome = pathname === "/";
  const isPrograms = pathname.startsWith("/programs");
  const isRegister = pathname.startsWith("/register");
  const isSchedule = pathname.startsWith("/schedule");
  const isAdminRoute = pathname.startsWith("/admin");
  const isProfileRoute = user ? pathname.startsWith("/profile") : pathname.startsWith("/auth");

  const accountHref = isAdmin ? "/admin" : user ? "/profile" : "/auth?tab=sign-in";
  const accountLabel = isLoading ? "" : isAdmin ? "Admin" : user ? "My Profile" : "Sign In";
  const registerHref = user ? "/register" : "/auth?redirect=/register";

  return (
    <nav
      aria-label="Quick actions"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-navy pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      <div className="grid h-16 grid-cols-4">
        <Link
          href="/"
          prefetch={false}
          onClick={(e) => {
            if (isHome) {
              e.preventDefault();
              window.scrollTo({ top: 0 });
            }
          }}
          className={cn(
            "flex flex-col items-center justify-center gap-1 text-[11px] font-semibold uppercase tracking-wide transition-colors",
            isHome ? "text-carolina" : "text-white/55"
          )}
        >
          <Home className="size-5" aria-hidden />
          Home
        </Link>

        <Link
          href="/programs"
          prefetch={false}
          className={cn(
            "flex flex-col items-center justify-center gap-1 text-[11px] font-semibold uppercase tracking-wide transition-colors",
            isPrograms ? "text-carolina" : "text-white/55"
          )}
        >
          <LayoutGrid className="size-5" aria-hidden />
          Programs
        </Link>

        {isAdmin ? (
          <Link
            href="/schedule"
            prefetch={false}
            className={cn(
              "flex flex-col items-center justify-center gap-1 text-[11px] font-semibold uppercase tracking-wide transition-colors",
              isSchedule ? "text-carolina" : "text-white/55"
            )}
          >
            <CalendarDays className="size-5" aria-hidden />
            Schedule
          </Link>
        ) : (
          <Link
            href={registerHref}
            prefetch={false}
            className={cn(
              "flex flex-col items-center justify-center gap-1 text-[11px] font-semibold uppercase tracking-wide transition-colors",
              // Same active/inactive logic as Home/Programs/Profile (muted
              // until this tab is the current route, Carolina blue once it
              // is) — the only addition is that signing in always turns it
              // impact red, regardless of route.
              user ? "text-impact" : isRegister ? "text-carolina" : "text-white/55"
            )}
          >
            <ClipboardPlus className="size-5" aria-hidden />
            Register
          </Link>
        )}

        <Link
          href={accountHref}
          prefetch={false}
          className={cn(
            "flex flex-col items-center justify-center gap-1 text-[11px] font-semibold uppercase tracking-wide transition-colors",
            (isAdmin ? isAdminRoute : isProfileRoute) ? "text-carolina" : "text-white/55"
          )}
        >
          {isAdmin ? <ShieldCheck className="size-5" aria-hidden /> : <User className="size-5" aria-hidden />}
          {accountLabel}
        </Link>
      </div>
    </nav>
  );
}
