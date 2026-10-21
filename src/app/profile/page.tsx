import type { Metadata } from "next";
import { ProfileClient } from "@/components/profile/profile-client";

export const metadata: Metadata = {
  title: "My Profile | For The Kids Athletics",
};

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const { redirect } = await searchParams;
  const redirectTo = redirect && redirect.startsWith("/") ? redirect : undefined;
  return <ProfileClient redirectTo={redirectTo} />;
}
