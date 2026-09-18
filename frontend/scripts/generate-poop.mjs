import path from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const sourcePath = path.join(rootDir, "src", "assets", "poop.webp");
const outputPath = path.join(rootDir, "src", "assets", "poop-display.webp");

const SIZE = 320;

const { width: srcW, height: srcH } = await sharp(sourcePath).metadata();

await sharp(sourcePath)
  .resize(SIZE, SIZE, { fit: "inside" })
  .webp({ quality: 82 })
  .toFile(outputPath);

console.log(
  `generato poop-display.webp (max ${SIZE}px) da ${sourcePath} (src ${srcW}x${srcH})`,
);
