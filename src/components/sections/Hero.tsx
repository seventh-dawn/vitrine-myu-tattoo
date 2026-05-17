import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { AnimatedReveal } from "@/components/ui/AnimatedReveal";
import { Starfield } from "@/components/ui/Starfield";
import { SITE } from "@/lib/constants";

const STYLES = [
  "Fine line",
  "Blackwork",
  "Dotwork",
  "Kawaii",
  "Ésotérique",
  "Floral",
];

export function Hero() {
  return (
    <section className="relative flex flex-col min-h-[75vh] items-center justify-center overflow-hidden px-6 pb-16">
      {/* Starfield */}
      <div className="absolute inset-0 z-[1]">
        <Starfield />
      </div>

      {/* Soft fade at bottom for section transition */}
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background to-transparent z-[2]" />

      <div className="relative z-10 text-center">
        {/* Banner as hero title — mix-blend-lighten makes black bg transparent */}
        <AnimatedReveal>
          <h1>
            <Image
              src="/banner.jpg"
              alt={SITE.name}
              width={900}
              height={300}
              priority
              className="mx-auto w-full max-w-3xl mix-blend-lighten"
            />
          </h1>
        </AnimatedReveal>

        <AnimatedReveal delay={200}>
          <p className="mt-4 text-lg text-muted md:text-xl">
            {SITE.artist} &mdash; Tatouages sur mesure
          </p>
        </AnimatedReveal>

        <AnimatedReveal delay={300}>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {STYLES.map((style) => (
              <span
                key={style}
                className="rounded-full border border-primary/30 px-4 py-1.5 text-xs text-muted"
              >
                {style}
              </span>
            ))}
          </div>
        </AnimatedReveal>

        <AnimatedReveal delay={400}>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Button href="/contact">Réserver une séance</Button>
            <Button href="/gallery" variant="outline">
              Voir la galerie
            </Button>
          </div>
        </AnimatedReveal>
      </div>

      {/* Scroll indicator — below content, not absolute */}
      <div className="relative z-10 mt-12 animate-bounce">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="mx-auto h-6 w-6 text-muted"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </div>
    </section>
  );
}
