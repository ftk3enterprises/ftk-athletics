"use client";

import { Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useRegistrationDraft } from "@/context/registration-draft-context";
import { useRequireFamily } from "@/hooks/use-require-family";

function LoadingState() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-24 text-center text-muted-foreground">Loading...</div>
  );
}

function RegisterGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = searchParams.toString();
  const returnPath = query ? `${pathname}?${query}` : pathname;
  const { ready } = useRequireFamily(returnPath);
  const { draftReady } = useRegistrationDraft();

  // Both must be true before any step renders: `ready` means auth/family
  // are resolved, `draftReady` means the draft has been hydrated from THIS
  // user's own scoped storage key (see registration-draft-context.tsx) —
  // rendering before that could show a step based on a previous account's
  // leftover draft on a shared browser.
  if (!ready || !draftReady) return <LoadingState />;
  return <>{children}</>;
}

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<LoadingState />}>
      <RegisterGuard>{children}</RegisterGuard>
    </Suspense>
  );
}
