import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const sourcePath = path.join(rootDir, "src", "assets", "poop.webp");
const outputDir = path.join(rootDir, "public");

const TARGETS = [
  {
    name: "icon-192.png",
    size: 192,
    contentPct: 0.86,
    background: null,
  },
  {
    name: "icon-512.png",
    size: 512,
    contentPct: 0.86,
    background: null,
  },
  {
    name: "maskable-icon-512.png",
    size: 512,
    contentPct: 0.58,
    background: "#000000",
  },
  {
    name: "favicon-32.png",
    size: 32,
    contentPct: 0.9,
    background: null,
  },
  {
    name: "apple-touch-icon-180.png",
    size: 180,
    contentPct: 0.82,
    background: null,
  },
];

await mkdir(outputDir, { recursive: true });

const source = sharp(sourcePath);
const { width: srcW, height: srcH } = await source.metadata();

for (const target of TARGETS) {
  const contentSize = Math.round(target.size * target.contentPct);
  const resized = await source
    .clone()
    .resize(contentSize, contentSize, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .toBuffer();

  const canvas = target.background
    ? sharp({
        create: {
          width: target.size,
          height: target.size,
          channels: 4,
          background: target.background,
        },
      })
    : sharp({
        create: {
          width: target.size,
          height: target.size,
          channels: 4,
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        },
      });

  const composite = await canvas
    .composite([
      {
        input: resized,
        gravity: "center",
      },
    ])
    .png()
    .toBuffer();

  await sharp(composite)
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toFile(path.join(outputDir, target.name));

  console.log(
    `generato ${target.name} (${target.size}x${target.size}, contenuto ${contentPctToPercent(
      target.contentPct,
    )}%)`,
  );
}

function contentPctToPercent(value) {
  return Math.round(value * 100);
}

console.log(
  `Icone generate da ${sourcePath} in ${outputDir} (src ${srcW}x${srcH})`,
);