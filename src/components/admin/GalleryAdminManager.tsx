"use client";

import Image from "next/image";
import { useState } from "react";
import type { GalleryImage } from "@/lib/gallery";

export function GalleryAdminManager({
  initialImages,
}: {
  initialImages: GalleryImage[];
}) {
  const [images, setImages] = useState(initialImages);
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setError("Choisis une photo");
      return;
    }
    setSubmitting(true);
    setError("");

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/admin/gallery", {
      method: "POST",
      body: formData,
    });

    setSubmitting(false);

    if (!res.ok) {
      setError("Échec de l'ajout, réessaie");
      return;
    }

    const data = await res.json();
    setImages(data.images);
    setFile(null);
    (e.target as HTMLFormElement).reset();
  }

  async function handleDelete(image: GalleryImage) {
    if (!confirm("Supprimer cette photo ?")) return;
    setImages((prev) => prev.filter((i) => i.id !== image.id));
    await fetch("/api/admin/gallery", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: image.id, src: image.src }),
    });
  }

  return (
    <div>
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 rounded-lg bg-surface p-6 md:flex-row md:items-end"
      >
        <div className="flex-1">
          <label className="mb-1 block text-sm text-muted">Photo</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="w-full text-sm text-foreground file:mr-3 file:rounded-full file:border-0 file:bg-accent file:px-4 file:py-2 file:text-sm file:font-semibold file:text-background"
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-full bg-accent px-6 py-2 text-sm font-semibold text-background hover:bg-accent-bright disabled:opacity-50"
        >
          {submitting ? "Ajout…" : "Ajouter"}
        </button>
      </form>
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
        {images.map((image) => (
          <div key={image.id} className="rounded-lg bg-surface p-3">
            <Image
              src={image.src}
              alt={image.alt}
              width={300}
              height={300}
              className="aspect-square w-full rounded object-cover"
            />
            {image.source === "blob" ? (
              <button
                onClick={() => handleDelete(image)}
                className="mt-2 w-full rounded border border-red-400/40 py-1 text-sm text-red-400 hover:bg-red-400/10"
              >
                Supprimer
              </button>
            ) : (
              <p className="mt-2 text-center text-xs text-muted">
                Photo d&apos;origine du site
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
