"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { MailCheck } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { GoogleIcon } from "@/components/auth/google-icon";
import { useAuth } from "@/context/auth-context";
import * as authService from "@/services/auth-service";

const OAUTH_ERROR_MESSAGES: Record<string, string> = {
  oauth_cancelled: "Google sign-in was cancelled. Please try again.",
  oauth_failed: "We couldn't complete Google sign-in. Please try again or use your email and password.",
};

export function AuthForm({
  redirectTo,
  defaultTab = "sign-up",
  initialError,
}: {
  redirectTo: string;
  defaultTab?: "sign-up" | "sign-in";
  initialError?: string;
}) {
  const { signUp, signIn } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<"sign-up" | "sign-in">(defaultTab);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(
    initialError ? (OAUTH_ERROR_MESSAGES[initialError] ?? null) : null
  );
  const [confirmationEmail, setConfirmationEmail] = useState<string | null>(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmailSentTo, setResetEmailSentTo] = useState<string | null>(null);

  async function handleGoogleSignIn() {
    setError(null);
    setIsGoogleSubmitting(true);
    try {
      await authService.signInWithGoogle(redirectTo);
      // On success the browser navigates away to Google — nothing left to do here.
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setIsGoogleSubmitting(false);
    }
  }

  async function handleSignUp(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    const data = new FormData(e.currentTarget);
    const email = String(data.get("email") ?? "");
    try {
      const { needsEmailConfirmation } = await signUp({
        name: String(data.get("name") ?? ""),
        email,
        password: String(data.get("password") ?? ""),
      });
      if (needsEmailConfirmation) {
        setConfirmationEmail(email);
      } else {
        router.push(redirectTo);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSignIn(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    const data = new FormData(e.currentTarget);
    try {
      const { isAdmin } = await signIn({
        email: String(data.get("email") ?? ""),
        password: String(data.get("password") ?? ""),
      });
      router.push(isAdmin ? "/admin" : redirectTo);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleForgotPassword(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    const data = new FormData(e.currentTarget);
    const email = String(data.get("email") ?? "");
    try {
      await authService.requestPasswordReset(email);
      setResetEmailSentTo(email);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (confirmationEmail) {
    return (
      <div className="rounded-sm border border-border bg-card p-6 sm:p-8">
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <MailCheck className="size-10 text-carolina" aria-hidden />
          <h2 className="text-xl text-navy">Check Your Email</h2>
          <p className="max-w-sm text-sm text-muted-foreground">
            We sent a confirmation link to <span className="font-medium text-navy">{confirmationEmail}</span>.
            Click it to activate your account, then come back here to sign in.
          </p>
          <Button
            variant="outline"
            onClick={() => {
              setConfirmationEmail(null);
              setTab("sign-in");
            }}
            className="mt-2 rounded-sm"
          >
            Back To Sign In
          </Button>
        </div>
      </div>
    );
  }

  if (showForgotPassword) {
    if (resetEmailSentTo) {
      return (
        <div className="rounded-sm border border-border bg-card p-6 sm:p-8">
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <MailCheck className="size-10 text-carolina" aria-hidden />
            <h2 className="text-xl text-navy">Check Your Email</h2>
            <p className="max-w-sm text-sm text-muted-foreground">
              We sent a password reset link to{" "}
              <span className="font-medium text-navy">{resetEmailSentTo}</span>. Click it to set a
              new password.
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setShowForgotPassword(false);
                setResetEmailSentTo(null);
              }}
              className="mt-2 rounded-sm"
            >
              Back To Sign In
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="rounded-sm border border-border bg-card p-6 sm:p-8">
        <h2 className="text-xl text-navy">Reset Your Password</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Enter your email and we&apos;ll send you a link to set a new password.
        </p>
        <form onSubmit={handleForgotPassword} className="mt-5 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="forgot-email">Email</Label>
            <Input id="forgot-email" name="email" type="email" required />
          </div>
          {error && <p className="text-sm text-impact">{error}</p>}
          <Button
            type="submit"
            disabled={isSubmitting}
            className="h-11 w-full rounded-sm bg-impact font-heading text-impact-foreground hover:bg-impact/90"
          >
            {isSubmitting ? "Sending..." : "Send Reset Link"}
          </Button>
          <button
            type="button"
            onClick={() => {
              setShowForgotPassword(false);
              setError(null);
            }}
            className="w-full text-center text-sm font-semibold text-muted-foreground hover:text-navy"
          >
            Back To Sign In
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="rounded-sm border border-border bg-card p-6 sm:p-8">
      <Tabs
        value={tab}
        onValueChange={(v) => {
          setTab(v as "sign-up" | "sign-in");
          setError(null);
        }}
      >
        <TabsList className="grid w-full grid-cols-2 rounded-sm bg-muted p-1">
          <TabsTrigger value="sign-up" className="rounded-sm font-heading text-sm">
            New Here
          </TabsTrigger>
          <TabsTrigger value="sign-in" className="rounded-sm font-heading text-sm">
            Sign In
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sign-up" className="mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={handleGoogleSignIn}
            disabled={isGoogleSubmitting}
            className="h-11 w-full gap-2.5 rounded-sm border-border font-heading text-sm text-navy hover:bg-muted"
          >
            <GoogleIcon className="size-[18px]" />
            {isGoogleSubmitting ? "Connecting To Google..." : "Continue With Google"}
          </Button>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Or
            </span>
            <div className="h-px flex-1 bg-border" />
          </div>

          {error && <p className="mb-4 text-sm text-impact">{error}</p>}

          <form onSubmit={handleSignUp} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Parent or Guardian Name</Label>
              <Input id="name" name="name" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="signup-email">Email</Label>
              <Input id="signup-email" name="email" type="email" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="signup-password">Password</Label>
              <PasswordInput id="signup-password" name="password" minLength={6} required />
            </div>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-11 w-full rounded-sm bg-impact font-heading text-impact-foreground hover:bg-impact/90"
            >
              {isSubmitting ? "Creating Profile..." : "Create Profile"}
            </Button>
            <p className="text-xs text-muted-foreground">
              Your profile includes the liability waiver you sign once, so every future sign-up
              takes seconds.
            </p>
          </form>
        </TabsContent>

        <TabsContent value="sign-in" className="mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={handleGoogleSignIn}
            disabled={isGoogleSubmitting}
            className="h-11 w-full gap-2.5 rounded-sm border-border font-heading text-sm text-navy hover:bg-muted"
          >
            <GoogleIcon className="size-[18px]" />
            {isGoogleSubmitting ? "Connecting To Google..." : "Continue With Google"}
          </Button>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Or
            </span>
            <div className="h-px flex-1 bg-border" />
          </div>

          {error && <p className="mb-4 text-sm text-impact">{error}</p>}

          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="signin-email">Email</Label>
              <Input id="signin-email" name="email" type="email" required />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="signin-password">Password</Label>
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotPassword(true);
                    setError(null);
                  }}
                  className="text-xs font-semibold text-impact hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <PasswordInput id="signin-password" name="password" required />
            </div>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-11 w-full rounded-sm bg-impact font-heading text-impact-foreground hover:bg-impact/90"
            >
              {isSubmitting ? "Signing In..." : "Sign In"}
            </Button>
          </form>
        </TabsContent>
      </Tabs>
    </div>
  );
}
