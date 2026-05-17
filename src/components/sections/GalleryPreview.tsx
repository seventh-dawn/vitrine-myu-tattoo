import Image from "next/image";
import Link from "next/link";
import { AnimatedReveal } from "@/components/ui/AnimatedReveal";

// TODO: Replace with Instagram feed data
const PLACEHOLDER_IMAGES = Array.from({ length: 6 }, (_, i) => ({
  id: String(i),
  src: `/gallery/placeholder-${i + 1}.svg`,
  alt: `Tattoo ${i + 1}`,
}));

export function GalleryPreview() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-20">
      <AnimatedReveal>
        <h2 className="font-display text-3xl font-bold text-center text-foreground md:text-4xl">
          Dernières créations
        </h2>
        <p className="mt-2 text-center text-muted">
          Découvrez mes tatouages les plus récents
        </p>
      </AnimatedReveal>

      <div className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-3">
        {PLACEHOLDER_IMAGES.map((img, i) => (
          <AnimatedReveal key={img.id} delay={i * 100}>
            <div className="group relative aspect-square overflow-hidden rounded-lg bg-surface">
              <Image
                src={img.src}
                alt={img.alt}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-110"
                sizes="(max-width: 768px) 50vw, 33vw"
              />
              <div className="absolute inset-0 bg-primary-dark/0 transition-colors duration-300 group-hover:bg-primary-dark/30" />
            </div>
          </AnimatedReveal>
        ))}
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
