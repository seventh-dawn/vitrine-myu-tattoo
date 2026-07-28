import type { Metadata } from "next";
import { Suspense } from "react";
import { FlashGrid } from "@/components/flash/FlashGrid";
import { AnimatedReveal } from "@/components/ui/AnimatedReveal";
import { getFlashItems } from "@/lib/flash";

export const metadata: Metadata = {
  title: "Flash",
  description:
    "Flashs disponibles chez Myu Tattoo à Dieppe. Designs prêts à tatouer, prix fixe.",
  alternates: { canonical: "/flash" },
};

async function FlashContent() {
  const items = await getFlashItems();

  if (items.length === 0) {
    return (
      <p className="text-center text-muted">
        De nouveaux flashs arrivent bientôt. Suivez l&apos;Instagram pour ne
        rien manquer.
      </p>
    );
  }

  return <FlashGrid items={items} />;
}

export default function FlashPage() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-20">
      <AnimatedReveal>
        <h1 className="font-display text-4xl font-bold text-center text-foreground md:text-5xl">
          Flash
        </h1>
        <p className="mt-3 text-center text-muted">
          Designs prêts à tatouer, prix fixe — premier arrivé, premier servi
        </p>
      </AnimatedReveal>

      <div className="mt-12">
        <Suspense fallback={<p className="text-center text-muted">Chargement…</p>}>
          <FlashContent />
        </Suspense>
      </div>
    </section>
  );
}
