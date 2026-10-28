import { GameplayVideoPlayer } from "@/components/home/gameplay-video-player";
import { Reveal } from "@/components/ui/reveal";

export function GameplayVideoSection() {
  return (
    <section id="in-action" className="scroll-mt-20 bg-navy py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-carolina">
            Watch
          </p>
        </Reveal>

        <Reveal delay={0.08}>
          <h2 className="mt-3 max-w-2xl text-4xl uppercase leading-[1.05] text-white sm:text-5xl">
            Nerf Battles!
          </h2>
        </Reveal>

        <Reveal delay={0.16}>
          <p className="mt-5 max-w-2xl leading-relaxed text-white/70">
            Get ready for action-packed Nerf Battles! From Capture the Flag
            to Last Man Standing, enjoy exciting games, friendly
            competition, and fun for the whole family.
          </p>
        </Reveal>

        <Reveal delay={0.24}>
          <div className="mt-10">
            <GameplayVideoPlayer />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
