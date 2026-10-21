"use client";

import { useState, type FormEvent } from "react";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { submitSponsorInquiry } from "@/services/sponsor-inquiry-service";

export function SponsorInquiryForm() {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");
    setError(null);
    const formData = new FormData(e.currentTarget);

    try {
      await submitSponsorInquiry({
        businessName: String(formData.get("businessName") ?? ""),
        contactName: String(formData.get("contactName") ?? ""),
        email: String(formData.get("email") ?? ""),
        phone: String(formData.get("phone") ?? ""),
        message: String(formData.get("message") ?? ""),
      });
      setStatus("success");
    } catch {
      setError("Something went wrong. Please try again.");
      setStatus("error");
    }
  }

if (status === "success") {
  return (
    <div className="flex min-h-[320px] flex-col items-center justify-center border border-carolina/40 bg-carolina/10 px-8 py-12 text-center">
      <CheckCircle2
        className="size-10 text-carolina"
        aria-hidden
      />

      <h3 className="mt-5 text-2xl text-white">
        Inquiry Sent
      </h3>

      <p className="mt-3 max-w-md leading-6 text-white/70">
        Thanks for your interest in sponsoring For The Kids Athletics.
        Our team will reach out to your contact email shortly.
      </p>
    </div>
  );
}

return (
  <form
    onSubmit={handleSubmit}
    className="grid gap-x-5 gap-y-6 sm:grid-cols-2"
  >
    <div className="space-y-2">
      <Label
        htmlFor="businessName"
        className="text-sm font-semibold text-white/80"
      >
        Business Name
      </Label>

      <Input
        id="businessName"
        name="businessName"
        required
        className="h-12 rounded-none border-white/20 bg-white/5 px-4 text-white placeholder:text-white/40"
      />
    </div>

    <div className="space-y-2">
      <Label
        htmlFor="contactName"
        className="text-sm font-semibold text-white/80"
      >
        Contact Name
      </Label>

      <Input
        id="contactName"
        name="contactName"
        required
        className="h-12 rounded-none border-white/20 bg-white/5 px-4 text-white placeholder:text-white/40"
      />
    </div>

    <div className="space-y-2">
      <Label
        htmlFor="email"
        className="text-sm font-semibold text-white/80"
      >
        Email
      </Label>

      <Input
        id="email"
        name="email"
        type="email"
        required
        className="h-12 rounded-none border-white/20 bg-white/5 px-4 text-white placeholder:text-white/40"
      />
    </div>

    <div className="space-y-2">
      <Label
        htmlFor="phone"
        className="text-sm font-semibold text-white/80"
      >
        Phone
      </Label>

      <Input
        id="phone"
        name="phone"
        type="tel"
        required
        className="h-12 rounded-none border-white/20 bg-white/5 px-4 text-white placeholder:text-white/40"
      />
    </div>

    <div className="space-y-2 sm:col-span-2">
      <Label
        htmlFor="message"
        className="text-sm font-semibold text-white/80"
      >
        Message
      </Label>

      <Textarea
        id="message"
        name="message"
        rows={5}
        placeholder="Tell us about your business and sponsorship interest"
        className="resize-none rounded-none border-white/20 bg-white/5 px-4 py-3 text-white placeholder:text-white/40"
      />
    </div>

    {error && (
      <p className="text-sm text-impact sm:col-span-2">
        {error}
      </p>
    )}

    <div className="pt-2 sm:col-span-2">
<Button
  type="submit"
  disabled={status === "submitting"}
  className="h-14 w-full rounded-none bg-impact px-8 font-heading text-base uppercase text-impact-foreground transition-colors hover:bg-impact/90 sm:w-auto sm:min-w-[270px]"
>
  <span className="flex items-center justify-center gap-3">
    {status === "submitting" ? "Sending..." : "Submit Inquiry"}

    {status !== "submitting" && (
      <ArrowRight className="size-4" aria-hidden />
    )}
  </span>
</Button>
    </div>
  </form>
);
}
