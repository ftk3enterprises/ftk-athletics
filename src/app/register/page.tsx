import { RegisterEntryClient } from "@/components/registration/register-entry-client";

export default async function RegisterEntryPage({
  searchParams,
}: {
  searchParams: Promise<{ program?: string; participant?: string }>;
}) {
  const { program, participant } = await searchParams;
  return <RegisterEntryClient programSlug={program} participantId={participant} />;
}
