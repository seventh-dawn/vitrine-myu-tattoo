import type { Metadata } from "next";
import { BookingForm } from "@/components/contact/BookingForm";
import { AnimatedReveal } from "@/components/ui/AnimatedReveal";

export const metadata: Metadata = {
  title: "Contact — A l'encre de lune",
  description:
    "Réservez votre séance de tatouage avec Myu Tattoo. Décrivez votre projet.",
};

export default function ContactPage() {
  return (
    <section className="mx-auto max-w-3xl px-6 py-20">
      <AnimatedReveal>
        <h1 className="font-display text-4xl font-bold text-center text-foreground md:text-5xl">
          Réserver une séance
        </h1>
        <p className="mt-3 text-center text-muted">
          Décrivez votre projet et je reviendrai vers vous rapidement.
        </p>
      </AnimatedReveal>

      <AnimatedReveal delay={200}>
        <div className="mt-12">
          <BookingForm />
        </div>
      </AnimatedReveal>
    </section>
  );
}
