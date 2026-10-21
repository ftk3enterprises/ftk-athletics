import Image from "next/image";
import {
  CheckCircle2,
  GraduationCap,
  HeartHandshake,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Trophy,
  Users,
} from "lucide-react";
import { Reveal } from "@/components/ui/reveal";

const COMMUNITY_GOALS = [
  "Organized",
  "Safe",
  "Welcoming",
  "Competitive",
  "Dependable",
  "Affordable Where Possible",
  "Participant-Focused",
];

const PHOTOS: { src: string; alt: string; position: string }[] = [
  {
    src: "/about/coach-huddle.jpg",
    alt: "Coach huddled with a youth flag football team on the field",
    position: "object-[50%_78%]",
  },
  {
    src: "/about/IMG_0179.jpeg",
    alt: "Coach Jay with a young flag football player after a game",
    position: "object-[50%_52%]",
  },
  {
    src: "/about/camp-bus.jpeg",
    alt: "Campers waving and celebrating on the bus during an FTK camp trip",
    position: "object-center",
  },
  {
    src: "/about/Nerf.jpg",
    alt: "Families and kids together at an FTK community event",
    position: "object-[50%_60%]",
  },
  {
    src: "/about/end-of-camp.jpeg",
    alt: "A large group of campers and coaches celebrating together at the end of an FTK camp",
    position: "object-[50%_55%]",
  },
  {
    src: "/about/kids-zone-camp.jpeg",
    alt: "Campers gathered at the Kids Zone during an FTK camp day",
    position: "object-[50%_60%]",
  },
];

const FOUNDERS = [
  {
    name: "Zachary Talkovic",
    title: "President & Co-Founder",
    bio: "A Sarasota native and former collegiate and professional athlete, Zach brings business operations, marketing, and growth strategy to FTK — along with the vision to bring organized athletic opportunities to more families across Sarasota.",
  },
  {
    name: "Jay Haren",
    title: "Vice President & Co-Founder",
    bio: 'For more than 15 years, Jay has built the Sarasota athletic community through Suncoast Flag Football and Suncoast Athletics — coaching, organizing, and creating the "For The Kids" identity that would become FTK’s name and mission.',
  },
];

const VALUES = [
  {
    icon: HeartHandshake,
    title: "Integrity",
    body: "We operate honestly and responsibly with everyone FTK serves.",
  },
  {
    icon: ShieldCheck,
    title: "Safety",
    body: "Physical and emotional safety come first in every program.",
  },
  {
    icon: TrendingUp,
    title: "Development",
    body: "We help athletes grow as competitors, teammates, and individuals.",
  },
  {
    icon: GraduationCap,
    title: "Mentorship",
    body: "Coaches lead knowing their influence extends beyond the game.",
  },
  {
    icon: Trophy,
    title: "Competition",
    body: "We encourage healthy competition with respect for everyone involved.",
  },
  {
    icon: Users,
    title: "Community",
    body: "FTK exists to strengthen the communities we operate in.",
  },
  {
    icon: Sparkles,
    title: "Opportunity",
    body: "Programs welcome every experience level and ability.",
  },
  {
    icon: CheckCircle2,
    title: "Accountability",
    body: "We hold ourselves to the same standards we expect from our athletes.",
  },
];

export function AboutSection() {
  return (
    <section id="about" className="scroll-mt-20 bg-background py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Intro */}
        <div className="max-w-3xl">
          <Reveal>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-impact">
              About FTK
            </p>
          </Reveal>

          <Reveal delay={0.08}>
            <h2 className="mt-3 text-4xl text-navy sm:text-5xl">
              Founded In Sarasota. Built For The Kids.
            </h2>
          </Reveal>

          <Reveal delay={0.16}>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
              For The Kids Athletics was built on a simple belief: sports can give kids, adults,
              and families something bigger than competition. What started as years of coaching
              and community work on the Suncoast grew into an organization built around real
              relationships, mentorship, and a name that says exactly what we&apos;re here for.
            </p>
          </Reveal>

          <Reveal delay={0.22}>
            <p className="mt-6 max-w-2xl border-l-2 border-carolina pl-5 text-base italic leading-7 text-navy">
              &quot;To create safe, reliable, competitive, and enjoyable athletic opportunities
              that bring children, adults, families, and communities together through sports,
              mentorship, development, and positive relationships.&quot;
            </p>
          </Reveal>
        </div>

        {/* Sarasota story + photos */}
        <div className="mt-20 grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-16">
          <Reveal delay={0.08}>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-impact">
                Our Responsibility To Sarasota
              </p>
              <h3 className="mt-3 text-2xl text-navy sm:text-3xl">
                Sarasota is more than the location where FTK operates. It is home.
              </h3>
              <p className="mt-5 leading-relaxed text-muted-foreground">
                Our Founders grew up here, competed here, and built relationships here — and that
                history comes with responsibility. Our goal is to give Sarasota-area families
                programs they can depend on, with winning always part of competition, but never
                the only purpose.
              </p>
              <ul className="mt-5 flex flex-wrap gap-2">
                {COMMUNITY_GOALS.map((goal) => (
                  <li
                    key={goal}
                    className="rounded-sm bg-navy/5 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-navy ring-1 ring-inset ring-navy/15"
                  >
                    {goal}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          <div className="grid grid-cols-2 gap-3">
            {PHOTOS.map((photo, index) => (
              <Reveal key={photo.src} delay={0.16 + index * 0.1} y={16} duration={0.7}>
                <div className="relative aspect-square overflow-hidden rounded-sm bg-muted">
                  <Image
                    src={photo.src}
                    alt={photo.alt}
                    fill
                    sizes="(min-width: 1024px) 20vw, 50vw"
                    className={`object-cover ${photo.position}`}
                  />
                </div>
              </Reveal>
            ))}
          </div>
        </div>

        {/* Founders */}
        <div className="mt-20">
          <Reveal>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-impact">
              Our Founders
            </p>
          </Reveal>
          <Reveal delay={0.08}>
            <h3 className="mt-3 text-2xl text-navy sm:text-3xl">
              Two Founders. One Shared Purpose.
            </h3>
          </Reveal>

          <div className="mt-8 grid gap-8 sm:grid-cols-2 sm:gap-10">
            {FOUNDERS.map((founder, index) => (
              <Reveal key={founder.name} delay={0.16 + index * 0.08}>
                <div className="border-l-2 border-carolina pl-5 sm:pl-6">
                  <h4 className="text-xl font-semibold text-navy">{founder.name}</h4>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-impact">
                    {founder.title}
                  </p>
                  <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">
                    {founder.bio}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={0.32}>
            <p className="mt-10 max-w-2xl text-base italic leading-7 text-muted-foreground">
              Build something we would have wanted to be part of as kids, something we are proud
              to be part of as adults, and something families can trust.
            </p>
          </Reveal>
        </div>

        {/* Values */}
        <div className="mt-20">
          <Reveal>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-impact">
              FTK Values
            </p>
          </Reveal>
          <Reveal delay={0.08}>
            <h3 className="mt-3 text-2xl text-navy sm:text-3xl">The Standard We Build On</h3>
          </Reveal>

          <div className="mt-10 grid gap-8 sm:grid-cols-2 sm:gap-x-8 sm:gap-y-10 lg:grid-cols-4">
            {VALUES.map((value, index) => {
              const Icon = value.icon;
              return (
                <Reveal key={value.title} delay={0.16 + index * 0.04}>
                  <div className="border-l-2 border-carolina pl-4">
                    <Icon className="size-6 text-impact" strokeWidth={1.8} aria-hidden />
                    <h4 className="mt-3 text-base font-semibold text-navy">{value.title}</h4>
                    <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{value.body}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>

        {/* Closing line */}
        <Reveal delay={0.1}>
          <div className="mt-20 border-t-2 border-navy pt-8 text-center">
            <p className="font-heading text-xl uppercase tracking-wide text-navy sm:text-2xl">
              For The Kids. For The Family. For The Community.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
