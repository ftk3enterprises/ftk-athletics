import "server-only";
import Stripe from "stripe";

/**
 * Server-only Stripe client. STRIPE_SECRET_KEY lives only in environment
 * variables (Vercel project settings / .env.local) — never in this
 * codebase, client or server. The `server-only` import throws a build
 * error if this ever gets pulled into a client bundle.
 */
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-09-30.endive",
});
