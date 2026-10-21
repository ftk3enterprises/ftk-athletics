const PHRASES = ["Train", "Play", "Compete", "Connect", "For The Kids Athletics"];

function MarqueeSequence() {
  return (
    <span className="flex shrink-0 items-center" aria-hidden>
      {PHRASES.map((phrase) => (
        <span key={phrase} className="flex shrink-0 items-center whitespace-nowrap">
          <span className="px-5 sm:px-5 md:px-10">{phrase}</span>
          <span className="text-navy/20">·</span>
        </span>
      ))}
    </span>
  );
}

export function Marquee() {
  return (
    <div className="relative flex h-[4.75rem] items-center overflow-hidden bg-carolina/15 sm:h-[5rem] md:h-[6rem]">
      <div className="flex w-max animate-marquee font-heading text-[2rem] leading-none uppercase text-navy/10 sm:text-[3.5rem] md:text-[4.5rem] motion-reduce:animate-none">
        <MarqueeSequence />
        <MarqueeSequence />
      </div>
    </div>
  );
}
