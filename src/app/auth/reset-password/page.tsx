"use client";

import { Suspense, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, ShieldAlert } from "lucide-react";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import * as authService from "@/services/auth-service";

type Status = "checking" | "ready" | "invalid" | "success";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") === "/admin" ? "/admin" : "/profile";
  const [status, setStatus] = useState<Status>("checking");
  const [linkError, setLinkError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    async function establishSession() {
      // Supabase itself can reject the link before we ever see a token (link
      // already used, expired, or the redirect URL isn't allow-listed in
      // the Supabase dashboard) — it appends error/error_description in
      // that case instead of a token. For the implicit-flow delivery path
      // (the common case for admin-invite/recovery links with no custom
      // email template) this arrives in the URL *hash fragment*
      // (#error=...), not the query string, so it won't show up in
      // searchParams — check both so a real failure reason is never
      // silently swallowed into a generic "invalid".
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const errorDescription =
        searchParams.get("error_description") ||
        searchParams.get("error") ||
        hashParams.get("error_description") ||
        hashParams.get("error");
      if (errorDescription) {
        if (!active) return;
        setLinkError(decodeURIComponent(errorDescription.replace(/\+/g, " ")));
        setStatus("invalid");
        return;
      }

      // Supabase may deliver the link three different ways depending on
      // project config: token_hash + type query params, a PKCE `code` query
      // param, or by auto-establishing a session from the URL hash fragment
      // on page load. Handle all three.
      const tokenHash = searchParams.get("token_hash");
      const type = searchParams.get("type");
      if (tokenHash && type) {
        const { error } = await supabase.auth.verifyOtp({
          type: type as "recovery",
          token_hash: tokenHash,
        });
        if (!active) return;
        if (error) setLinkError(error.message);
        setStatus(error ? "invalid" : "ready");
        return;
      }

      const code = searchParams.get("code");
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!active) return;
        if (error) setLinkError(error.message);
        setStatus(error ? "invalid" : "ready");
        return;
      }

      // Implicit flow delivers the session directly as access_token/
      // refresh_token in the hash fragment. @supabase/ssr's browser client
      // is built around cookie-based sessions and does not auto-consume
      // this the way the plain supabase-js client does — getSession() alone
      // returns null even with a perfectly valid token sitting right there.
      // Set it explicitly.
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");
      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (!active) return;
        if (error) setLinkError(error.message);
        setStatus(error ? "invalid" : "ready");
        return;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!active) return;
      setStatus(session ? "ready" : "invalid");
    }

    establishSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setStatus("ready");
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [searchParams]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }
    setIsSubmitting(true);
    try {
      await authService.updatePassword(password);
      setStatus("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (status === "checking") {
    return <p className="text-center text-muted-foreground">Checking your link...</p>;
  }

  if (status === "invalid") {
    return (
      <div className="flex flex-col items-center gap-3 text-center">
        <ShieldAlert className="size-10 text-impact" aria-hidden />
        <h1 className="text-xl text-navy">Link Expired Or Invalid</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          This link is no longer valid. Go back to sign in and request a new one.
        </p>
        {linkError && <p className="max-w-sm text-xs text-muted-foreground">({linkError})</p>}
        <Link
          href="/auth?tab=sign-in"
          className="mt-2 text-sm font-semibold uppercase tracking-wide text-impact hover:underline"
        >
          Back To Sign In
        </Link>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="flex flex-col items-center gap-3 text-center">
        <CheckCircle2 className="size-10 text-carolina" aria-hidden />
        <h1 className="text-xl text-navy">Password Set</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          {next === "/admin"
            ? "Your password has been set. You're signed in — continue to the Admin Portal."
            : "Your password has been changed. You're signed in — continue to your profile."}
        </p>
        <Button
          onClick={() => router.push(next)}
          className="mt-2 h-11 rounded-sm bg-impact font-heading text-impact-foreground hover:bg-impact/90"
        >
          {next === "/admin" ? "Go To Admin Portal" : "Go To My Profile"}
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <h1 className="text-xl text-navy">Set A New Password</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Choose a new password for your account.
        </p>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="new-password">New Password</Label>
        <PasswordInput
          id="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={6}
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="confirm-password">Confirm Password</Label>
        <PasswordInput
          id="confirm-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          minLength={6}
          required
        />
      </div>
      {error && <p className="text-sm text-impact">{error}</p>}
      <Button
        type="submit"
        disabled={isSubmitting}
        className="h-11 w-full rounded-sm bg-impact font-heading text-impact-foreground hover:bg-impact/90"
      >
        {isSubmitting ? "Updating..." : "Update Password"}
      </Button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="bg-background px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-md rounded-sm border border-border bg-card p-6 sm:p-8">
        <Suspense fallback={<p className="text-center text-muted-foreground">Loading...</p>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
