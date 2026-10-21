"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";

/** Guards a registration step: bounces to sign-in, then family setup, before letting the step render. */
export function useRequireFamily(returnPath: string) {
  const { user, family, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace(`/auth?redirect=${encodeURIComponent(returnPath)}`);
      return;
    }
    if (!family) {
      router.replace(`/profile?redirect=${encodeURIComponent(returnPath)}`);
    }
  }, [isLoading, user, family, router, returnPath]);

  return {
    ready: !isLoading && !!user && !!family,
    user,
    family,
  };
}
