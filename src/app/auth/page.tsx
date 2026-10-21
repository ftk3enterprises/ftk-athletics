import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/auth-form";

export const metadata: Metadata = {
  title: "Create Your Profile | For The Kids Athletics",
};

export default async function AuthPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string; tab?: string; error?: string }>;
}) {
  const { redirect, tab, error } = await searchParams;
  const redirectTo = redirect && redirect.startsWith("/") ? redirect : "/profile";
  const defaultTab = tab === "sign-in" ? "sign-in" : "sign-up";

  return (
    <div className="bg-background">
      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:items-center lg:px-8 lg:py-24">
        <div>
          {defaultTab === "sign-in" ? (
            <>
              <p className="text-sm font-semibold uppercase tracking-wide text-impact">Welcome Back</p>
              <h1 className="mt-2 text-4xl sm:text-5xl">Sign In</h1>
              <p className="mt-5 max-w-md text-lg text-muted-foreground">
                Sign in to manage your family profile, register for programs, and view your
                registrations.
              </p>
            </>
          ) : (
            <>
              <p className="text-sm font-semibold uppercase tracking-wide text-impact">Step One</p>
              <h1 className="mt-2 text-4xl sm:text-5xl">Create Your Profile</h1>
              <p className="mt-5 max-w-md text-lg text-muted-foreground">
                Save your contact details, your children&apos;s grades, schools, and birthdays once.
                After that, signing up for a camp, after school program, league, or tournament
                takes seconds.
              </p>

              <ul className="mt-8 space-y-3">
                {[
                  "One profile for the whole family",
                  "Add every child",
                  "Register in a few clicks",
                ].map((item, i) => (
                  <li key={item} className="flex items-center gap-3">
                    <span
                      className="h-6 w-1 shrink-0"
                      style={{ backgroundColor: ["#f2000b", "#64b2de", "#001f50"][i] }}
                      aria-hidden
                    />
                    <span className="font-semibold">{item}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        <AuthForm redirectTo={redirectTo} defaultTab={defaultTab} initialError={error} />
      </div>
    </div>
  );
}
