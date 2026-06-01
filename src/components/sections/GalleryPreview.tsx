import Link from "next/link";
import { AnimatedReveal } from "@/components/ui/AnimatedReveal";
import { getGalleryImages } from "@/lib/gallery";
import { AutoScrollGallery } from "./AutoScrollGallery";

export function GalleryPreview() {
  const images = getGalleryImages();

  return (
    <section className="pt-6 pb-20">
      <div className="mx-auto max-w-6xl px-6">
        <AnimatedReveal>
          <h2 className="font-display text-3xl font-bold text-center text-foreground md:text-4xl">
            Dernières créations
          </h2>
          <p className="mt-2 text-center text-muted">
            Découvrez mes tatouages les plus récents
          </p>
        </AnimatedReveal>
      </div>

      <div className="mt-6">
        <AutoScrollGallery images={images} />
      </div>

      <AnimatedReveal delay={600}>
        <div className="mt-10 text-center">
          <Link
            href="/gallery"
            className="text-accent hover:text-accent-bright transition-colors font-semibold"
          >
            Voir toute la galerie &rarr;
          </Link>
        </div>
      </AnimatedReveal>
    </section>
  );
}
