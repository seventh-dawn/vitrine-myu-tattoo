import fs from "fs";
import path from "path";

export interface GalleryImage {
  id: string;
  src: string;
  alt: string;
}

export function getGalleryImages(): GalleryImage[] {
  const dir = path.join(process.cwd(), "public", "gallery");
  const files = fs.readdirSync(dir).filter((f) => /\.(jpe?g|png|webp)$/i.test(f));
  files.sort();

  return files.map((file, i) => ({
    id: String(i),
    src: `/gallery/${file}`,
    alt: `Tatouage ${i + 1}`,
  }));
}
