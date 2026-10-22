"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

export function Hero() {
  return (
    <section className="relative isolate overflow-hidden bg-navy">
      <div className="absolute inset-0">
        <Image
          src="/about/hero-4.jpg"
          alt="Kids playing flag football on a sunlit field at golden hour"
          fill
          priority
          fetchPriority="high"
          sizes="100vw"
          className="object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-navy from-0% via-navy/75 via-45% to-navy/10 to-100%" />
      </div>

      <div className="relative mx-auto flex min-h-[640px] max-w-7xl flex-col justify-center px-4 py-24 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="max-w-2xl"
        >
          <span className="inline-block bg-impact px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-impact-foreground">
            Multi-Sport Programs · Leagues For All Ages
          </span>

          <h1 className="mt-5 text-[3.4rem] leading-[0.88] text-white sm:text-[4.2rem] md:text-[5.1rem]">
            More Sports.
            <br />
            <span className="text-carolina">More Ways To Play.</span>
          </h1>

          <p className="mt-6 max-w-lg text-lg text-white/80">
Find your game, build your skills, and compete with a community that plays together.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/register"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-sm bg-impact px-7 font-heading text-base uppercase text-impact-foreground transition-colors hover:bg-impact/90"
            >
              Register Now
              <ArrowRight className="size-4" aria-hidden />
            </Link>
            <Link
              href="#programs"
              className="inline-flex h-12 items-center justify-center rounded-sm border border-white/30 px-7 font-heading text-base uppercase text-white transition-colors hover:bg-white/10"
            >
              Explore Programs
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
