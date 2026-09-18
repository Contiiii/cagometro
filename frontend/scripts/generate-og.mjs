import path from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const sourcePath = path.join(rootDir, "public", "screenshot-desktop.png");
const outputPath = path.join(rootDir, "public", "og-image.png");

const WIDTH = 1200;
const HEIGHT = 630;

const { width: srcW, height: srcH } = await sharp(sourcePath).metadata();

await sharp(sourcePath)
  .resize(WIDTH, HEIGHT, { fit: "cover", position: "center" })
  .png({ compressionLevel: 9, adaptiveFiltering: true })
  .toFile(outputPath);

console.log(
  `generato og-image.png (${WIDTH}x${HEIGHT}) da ${sourcePath} (src ${srcW}x${srcH})`,
);
