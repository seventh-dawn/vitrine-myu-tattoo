import type { Metadata } from "next";
import { AnimatedReveal } from "@/components/ui/AnimatedReveal";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Le salon",
  description: `Retrouvez le salon de tatouage À l'encre de lune au ${SITE.address}. Dieppe, Normandie. Sur rendez-vous ou en walk-in pour les flashs.`,
  alternates: { canonical: "/salon" },
};

export default function SalonPage() {
  return (
    <section className="mx-auto max-w-4xl px-6 py-20">
      <AnimatedReveal>
        <h1 className="font-display text-4xl font-bold text-center text-foreground md:text-5xl">
          Le salon
        </h1>
        <p className="mt-3 text-center text-muted">
          Venez me retrouver à Dieppe
        </p>
      </AnimatedReveal>

      <div className="mt-12 grid gap-10 md:grid-cols-2">
        <AnimatedReveal delay={200}>
          <div className="space-y-6">
            <div>
              <h2 className="font-display text-xl font-bold text-foreground">
                Adresse
              </h2>
              <p className="mt-2 text-muted">{SITE.address}</p>
            </div>

            <div>
              <h2 className="font-display text-xl font-bold text-foreground">
                Horaires
              </h2>
              <p className="mt-2 text-muted">
                Sur rendez-vous ou sans rendez-vous — passez au salon pour
                découvrir les flashs disponibles et démarrer votre projet.
              </p>
            </div>

            <div>
              <h2 className="font-display text-xl font-bold text-foreground">
                Accès
              </h2>
              <p className="mt-2 text-muted">
                En plein cœur de Dieppe, dans les Arcades de la Poissonnerie.
              </p>
            </div>
          </div>
        </AnimatedReveal>

        <AnimatedReveal delay={400}>
          <div className="overflow-hidden rounded-lg">
            <iframe
              src={`https://maps.google.com/maps?q=${SITE.mapQuery}&output=embed`}
              width="100%"
              height="350"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Localisation du salon"
            />
          </div>
        </AnimatedReveal>
      </div>
    </section>
  );
}
