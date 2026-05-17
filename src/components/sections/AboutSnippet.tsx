import { AnimatedReveal } from "@/components/ui/AnimatedReveal";
import { SITE } from "@/lib/constants";

export function AboutSnippet() {
  return (
    <section className="bg-surface py-20">
      <div className="mx-auto max-w-4xl px-6 text-center">
        <AnimatedReveal>
          <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl">
            À propos
          </h2>
        </AnimatedReveal>

        <AnimatedReveal delay={200}>
          <p className="mt-6 text-lg leading-relaxed text-muted">
            Bienvenue chez {SITE.name}. Je suis {SITE.artist}, tatoueuse
            passionnée par l&apos;univers ésotérique et kawaii. Chaque pièce est
            unique, créée sur mesure pour raconter votre histoire sur votre peau.
          </p>
        </AnimatedReveal>

        <AnimatedReveal delay={400}>
          <p className="mt-4 text-lg leading-relaxed text-muted">
            Mon salon vous accueille dans une ambiance mystique et
            bienveillante. N&apos;hésitez pas à me contacter pour discuter de
            votre projet.
          </p>
        </AnimatedReveal>
      </div>
    </section>
  );
}
