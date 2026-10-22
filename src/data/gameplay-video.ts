/**
 * "See FTK In Action" homepage video section config.
 *
 * ftk-gameplay.mp4 is a web-optimized re-encode (H.264/AAC, 1280x720,
 * faststart) of the original camera export — the original lives untouched
 * at local-media-source/ (gitignored, never deployed; Cloudflare Workers
 * rejects any asset over 25 MiB, which the raw 4K file was 17x over).
 *
 * The posters are a real frame grabbed from this video via ffmpeg, resized
 * for desktop/mobile with sharp. Re-run that process if the video changes.
 */
// Served through /api/video (not the static /videos/ path directly) so the
// Worker can answer Range requests — see src/app/api/video/[...path]/route.ts.
export const GAMEPLAY_VIDEO_SRC = "/api/video/ftk-gameplay.mp4";
export const GAMEPLAY_VIDEO_POSTER = "/videos/ftk-gameplay-poster.webp";
export const GAMEPLAY_VIDEO_POSTER_MOBILE = "/videos/ftk-gameplay-poster-mobile.webp";
export const GAMEPLAY_VIDEO_POSTER_ALT =
  "Kids playing outdoors with foam blasters on a sunny field during an FTK event";
