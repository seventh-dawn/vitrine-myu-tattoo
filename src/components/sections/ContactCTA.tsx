import { Button } from "@/components/ui/Button";
import { AnimatedReveal } from "@/components/ui/AnimatedReveal";

export function ContactCTA() {
  return (
    <section className="py-20 px-6">
      <div className="mx-auto max-w-4xl text-center">
        <AnimatedReveal>
          <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl">
            Envie d&apos;un tatouage ?
          </h2>
        </AnimatedReveal>

        <AnimatedReveal delay={200}>
          <p className="mt-4 text-lg text-muted">
            Parlez-moi de votre projet et réservons une séance ensemble.
          </p>
        </AnimatedReveal>

        <AnimatedReveal delay={400}>
          <div className="mt-8">
            <Button href="/contact">Me contacter</Button>
          </div>
        </AnimatedReveal>
      </div>
    </section>
  );
}
