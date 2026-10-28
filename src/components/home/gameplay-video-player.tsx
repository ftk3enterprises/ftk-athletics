"use client";

import { useRef, useState } from "react";
import { AlertTriangle, Loader2, Play } from "lucide-react";
import { PictureFill } from "@/components/ui/picture-fill";
import {
  GAMEPLAY_VIDEO_POSTER,
  GAMEPLAY_VIDEO_POSTER_ALT,
  GAMEPLAY_VIDEO_POSTER_MOBILE,
  GAMEPLAY_VIDEO_SRC,
} from "@/data/gameplay-video";

type PlaybackState = "idle" | "loading" | "playing" | "error";

/**
 * Poster-first video: the <video> element (and therefore the MP4 itself)
 * isn't rendered into the DOM at all until the visitor clicks Play, so
 * there's nothing for the browser to fetch on initial page load beyond the
 * poster image. `preload="none"` is set too as a second guarantee once it
 * does mount.
 */
export function GameplayVideoPlayer() {
  const [state, setState] = useState<PlaybackState>("idle");
  const videoRef = useRef<HTMLVideoElement>(null);

  function handlePlayClick() {
    setState("loading");
  }

  function handleVideoRef(node: HTMLVideoElement | null) {
    videoRef.current = node;
    if (node) {
      // Autoplay here is the user's own explicit click a moment ago, not
      // page-load autoplay — still subject to the browser's normal
      // inline/muted rules, which is why playsInline is set below.
      node.play().catch(() => setState("error"));
    }
  }

  function handleRetry() {
    setState("idle");
  }

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-sm bg-navy">
      {state === "playing" || state === "loading" || state === "error" ? (
        state === "error" ? (
          <div className="flex h-full w-full flex-col items-center justify-center gap-3 px-6 text-center text-white">
            <AlertTriangle className="size-8 text-impact" aria-hidden />
            <p className="max-w-sm text-sm text-white/80">
              This video couldn&apos;t play right now.
            </p>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={handleRetry}
                className="text-sm font-semibold uppercase tracking-wide text-carolina underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-carolina"
              >
                Try Again
              </button>
              <a
                href={GAMEPLAY_VIDEO_SRC}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-semibold uppercase tracking-wide text-white/70 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-carolina"
              >
                Open Video Directly
              </a>
            </div>
          </div>
        ) : (
          <>
            <video
              ref={handleVideoRef}
              src={GAMEPLAY_VIDEO_SRC}
              controls
              playsInline
              preload="none"
              onPlaying={() => setState("playing")}
              onError={() => setState("error")}
              onWaiting={() => setState("loading")}
              className="h-full w-full"
            >
              <p className="p-4 text-sm text-white">
                Your browser doesn&apos;t support embedded video.{" "}
                <a href={GAMEPLAY_VIDEO_SRC} className="underline">
                  Download the video
                </a>{" "}
                instead.
              </p>
            </video>
            {state === "loading" && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-navy/40">
                <Loader2 className="size-10 animate-spin text-white" aria-hidden />
              </div>
            )}
          </>
        )
      ) : (
        <button
          type="button"
          onClick={handlePlayClick}
          aria-label="Play video: Nerf Battles"
          className="group absolute inset-0 flex h-full w-full items-center justify-center focus-visible:outline-none"
        >
          <PictureFill
            desktopSrc={GAMEPLAY_VIDEO_POSTER}
            mobileSrc={GAMEPLAY_VIDEO_POSTER_MOBILE}
            fallbackSrc={GAMEPLAY_VIDEO_POSTER}
            alt={GAMEPLAY_VIDEO_POSTER_ALT}
            className="motion-safe:transition-transform motion-safe:duration-500 motion-safe:group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-navy/0 motion-safe:transition-colors motion-safe:duration-300 group-hover:bg-navy/20" />
          <span
            className="relative flex size-20 shrink-0 items-center justify-center rounded-full bg-white/95 shadow-lg motion-safe:transition-transform motion-safe:duration-300 group-hover:scale-110 group-focus-visible:scale-110 group-focus-visible:ring-4 group-focus-visible:ring-carolina sm:size-24"
            aria-hidden
          >
            <Play className="ml-1 size-8 fill-navy text-navy sm:size-10" />
          </span>
        </button>
      )}
    </div>
  );
}
