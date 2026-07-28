import fs from "fs";
import path from "path";
import { connection } from "next/server";
import { readJson, writeJson } from "./blob-store";

export interface GalleryImage {
  id: string;
  src: string;
  alt: string;
  source: "legacy" | "blob";
}

const DATA_PATH = "data/gallery.json";

function getLegacyImages(): GalleryImage[] {
  const dir = path.join(process.cwd(), "public", "gallery");
  const files = fs
    .readdirSync(dir)
    .filter((f) => /\.(jpe?g|png|webp)$/i.test(f));
  files.sort();

  return files.map((file, i) => ({
    id: `legacy-${i}`,
    src: `/gallery/${file}`,
    alt: `Tatouage ${i + 1}`,
    source: "legacy" as const,
  }));
}

export async function getGalleryImages(): Promise<GalleryImage[]> {
  await connection();
  const blobImages = await readJson<GalleryImage[]>(DATA_PATH, []);
  return [...blobImages, ...getLegacyImages()];
}

export async function addGalleryImage(
  image: Omit<GalleryImage, "id" | "source">
): Promise<GalleryImage[]> {
  const blobImages = await readJson<GalleryImage[]>(DATA_PATH, []);
  const newImage: GalleryImage = {
    ...image,
    id: crypto.randomUUID(),
    source: "blob",
  };
  const updated = [newImage, ...blobImages];
  await writeJson(DATA_PATH, updated);
  return [...updated, ...getLegacyImages()];
}

export async function deleteGalleryImage(id: string): Promise<GalleryImage[]> {
  const blobImages = await readJson<GalleryImage[]>(DATA_PATH, []);
  const updated = blobImages.filter((image) => image.id !== id);
  await writeJson(DATA_PATH, updated);
  return [...updated, ...getLegacyImages()];
}
