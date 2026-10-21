// One-off/occasional image optimizer for /public. Next's runtime image
// optimizer is disabled for the Cloudflare deploy (see next.config.ts), so
// oversized source images are compressed once at build time instead:
// camera-resolution JPEGs are downscaled to a sane web max edge and
// re-encoded; PNGs are losslessly recompressed only (no resize, no quality
// loss) since several are flat sponsor-card graphics where banding would
// show. Run with: node scripts/optimize-images.mjs
import sharp from "sharp";
import { readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";

const PUBLIC_DIR = path.join(import.meta.dirname, "..", "public");
const MAX_EDGE = 2400;
const JPEG_QUALITY = 82;
const SKIP_UNDER_BYTES = 300 * 1024;

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(full)));
    else files.push(full);
  }
  return files;
}

async function optimize(file) {
  const ext = path.extname(file).toLowerCase();
  const before = (await stat(file)).size;
  if (before < SKIP_UNDER_BYTES) return;

  if (ext === ".jpg" || ext === ".jpeg") {
    // .rotate() with no args bakes the EXIF orientation into the pixel
    // data — required because the output strips metadata (no
    // withMetadata()), so an un-rotated image would lose its orientation
    // tag and display sideways.
    const img = sharp(file).rotate();
    const meta = await img.metadata();
    const longEdge = Math.max(meta.width ?? 0, meta.height ?? 0);
    const resized = longEdge > MAX_EDGE ? img.resize({ width: MAX_EDGE, height: MAX_EDGE, fit: "inside", withoutEnlargement: true }) : img;
    const buffer = await resized.jpeg({ quality: JPEG_QUALITY, mozjpeg: true }).toBuffer();
    if (buffer.length < before) {
      await writeFile(file, buffer);
      report(file, before, buffer.length);
    }
  } else if (ext === ".png") {
    const buffer = await sharp(file).png({ compressionLevel: 9, palette: true }).toBuffer();
    if (buffer.length < before) {
      await writeFile(file, buffer);
      report(file, before, buffer.length);
    }
  }
}

function report(file, before, after) {
  const pct = (100 * (1 - after / before)).toFixed(0);
  console.log(`${path.relative(PUBLIC_DIR, file)}: ${(before / 1024).toFixed(0)}KB -> ${(after / 1024).toFixed(0)}KB (-${pct}%)`);
}

const files = await walk(PUBLIC_DIR);
for (const file of files) {
  await optimize(file).catch((err) => console.error(`skip ${file}: ${err.message}`));
}
