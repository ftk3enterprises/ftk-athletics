import { Hero } from "@/components/home/hero";
import { Marquee } from "@/components/home/marquee";
import { ProgramsSection } from "@/components/home/programs-section";
import { LeagueFlyerSection } from "@/components/home/league-flyer-section";
import { StepUpSection } from "@/components/home/step-up-section";
import { SponsorsSection } from "@/components/home/sponsors-section";
import { RegistrationCta } from "@/components/home/registration-cta";
import { AboutSection } from "@/components/home/about-section";

export default function Home() {
  return (
    <>
      <Hero />
      <Marquee />
      <ProgramsSection />
      <LeagueFlyerSection />
      <StepUpSection />
      <SponsorsSection />
      <RegistrationCta />
      <AboutSection />
    </>
  );
}
