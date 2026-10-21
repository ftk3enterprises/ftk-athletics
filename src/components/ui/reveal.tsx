"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

const EASE = [0.22, 1, 0.36, 1] as const;

interface RevealProps {
  children: ReactNode;
  className?: string;
  id?: string;
  /** Stagger offset in seconds — space sibling Reveals ~0.06-0.1s apart. */
  delay?: number;
  /** Upward travel distance in px. */
  y?: number;
  duration?: number;
  /** Fraction of the element that must be in view before it triggers. */
  amount?: number;
}

/**
 * Fades + slides content into place the first time it scrolls into view.
 * Renders a plain wrapper with no animation when the user prefers reduced
 * motion, per WCAG 2.3.3.
 */
export function Reveal({
  children,
  className,
  id,
  delay = 0,
  y = 24,
  duration = 0.9,
  amount = 0.2,
}: RevealProps) {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return (
      <div id={id} className={className}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      id={id}
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount }}
      transition={{ duration, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}
