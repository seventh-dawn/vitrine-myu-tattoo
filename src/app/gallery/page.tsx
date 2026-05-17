import type { Metadata } from "next";
import { GalleryGrid } from "@/components/gallery/GalleryGrid";
import { AnimatedReveal } from "@/components/ui/AnimatedReveal";

export const metadata: Metadata = {
  title: "Galerie — A l'encre de lune",
  description: "Découvrez les tatouages réalisés par Myu Tattoo.",
};

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
        <GalleryGrid />
      </div>
    </section>
  );
}
