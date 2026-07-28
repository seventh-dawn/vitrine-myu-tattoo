import { del, put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { addGalleryImage, deleteGalleryImage } from "@/lib/gallery";

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "Fichier manquant" }, { status: 400 });
  }

  const blob = await put(`gallery/${file.name}`, file, { access: "public" });

  const images = await addGalleryImage({
    src: blob.url,
    alt: "Tatouage",
  });

  return NextResponse.json({ images });
}

export async function DELETE(request: Request) {
  const { id, src } = await request.json();
  if (typeof id !== "string") {
    return NextResponse.json({ error: "id manquant" }, { status: 400 });
  }

  const images = await deleteGalleryImage(id);

  if (typeof src === "string") {
    await del(src).catch(() => {});
  }

  return NextResponse.json({ images });
}
