import { env } from "cloudflare:workers";
import type { NextRequest } from "next/server";

/**
 * Cloudflare Workers' static-asset serving (the ASSETS binding) ignores the
 * Range header entirely — it always returns the whole file with a plain
 * 200, never 206 Partial Content. That's fine for most assets, but iOS
 * Safari specifically refuses to play self-hosted video at all without a
 * real 206 response to its initial probe request, and seeking is broken
 * everywhere else without it. This route re-serves video files from
 * public/videos/ through the Worker so it can answer Range requests
 * properly, rather than letting Cloudflare serve them directly.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const assetUrl = new URL(`/videos/${path.join("/")}`, request.url);

  const assetResponse = await env.ASSETS.fetch(assetUrl.toString());
  if (!assetResponse.ok || !assetResponse.body) {
    return new Response("Not found", { status: 404 });
  }

  const contentType = assetResponse.headers.get("content-type") ?? "application/octet-stream";
  // env.ASSETS.fetch() doesn't expose a Content-Length header (the response
  // is chunked), so the buffer's own byteLength is the only reliable source
  // of truth for the file's total size.
  const buffer = await assetResponse.arrayBuffer();
  const size = buffer.byteLength;

  const range = request.headers.get("range");
  if (!range) {
    return new Response(buffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(size),
        "Accept-Ranges": "bytes",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  }

  const match = /^bytes=(\d*)-(\d*)$/.exec(range);
  if (!match) return new Response("Invalid Range", { status: 416 });

  const [, startStr, endStr] = match;
  const start = startStr ? parseInt(startStr, 10) : 0;
  const end = endStr ? parseInt(endStr, 10) : size - 1;

  if (Number.isNaN(start) || Number.isNaN(end) || start > end || end >= size) {
    return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${size}` } });
  }

  const slice = buffer.slice(start, end + 1);

  return new Response(slice, {
    status: 206,
    headers: {
      "Content-Type": contentType,
      "Content-Range": `bytes ${start}-${end}/${size}`,
      "Content-Length": String(end - start + 1),
      "Accept-Ranges": "bytes",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
