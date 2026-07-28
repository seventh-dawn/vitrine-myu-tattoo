import type { Metadata } from "next";
import { Suspense } from "react";
import { GalleryGrid } from "@/components/gallery/GalleryGrid";
import { AnimatedReveal } from "@/components/ui/AnimatedReveal";
import { getGalleryImages } from "@/lib/gallery";

export const metadata: Metadata = {
  title: "Galerie",
  description:
    "Découvrez les tatouages réalisés par Myu Tattoo à Dieppe. Galerie de tatouages sur mesure, styles variés.",
  alternates: { canonical: "/gallery" },
};

async function GalleryContent() {
  const images = await getGalleryImages();
  return <GalleryGrid images={images} />;
}

export default function GalleryPage() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-20">
      <AnimatedReveal>
        <h1 className="font-display text-4xl font-bold text-center text-foreground md:text-5xl">
          Galerie
        </h1>
        <p className="mt-3 text-center text-muted">
          Mes dernières réalisations
        </p>
      </AnimatedReveal>

      <div className="mt-12">
        <Suspense fallback={<p className="text-center text-muted">Chargement…</p>}>
          <GalleryContent />
        </Suspense>
      </div>
    </section>
  );
}
