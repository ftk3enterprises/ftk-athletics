import { RegistrationSteps } from "@/components/registration/registration-steps";

export function RegistrationHeader({
  title = "Family Registration",
  subtitle,
  step,
}: {
  title?: string;
  subtitle?: string;
  step: number;
}) {
  return (
    <div className="bg-navy py-10 sm:py-12">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-carolina">
          {subtitle ?? "Secure Your Spot"}
        </p>
        <h1 className="mt-1 text-3xl text-white sm:text-4xl">{title}</h1>
        <div className="mt-6">
          <RegistrationSteps current={step} />
        </div>
      </div>
    </div>
  );
}
