import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AnimatedReveal } from "@/components/ui/AnimatedReveal";
import { SITE, SOCIALS } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Contact — Réserver une séance",
  description:
    "Contactez Myu Tattoo à Dieppe pour réserver votre séance de tatouage : Instagram, email ou directement au salon.",
  alternates: { canonical: "/contact" },
};

type Contact = {
  label: string;
  value: string;
  hint: string;
  href: string;
  external?: boolean;
  icon: ReactNode;
};

const InstagramIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} aria-hidden="true" className="h-full w-full">
    <rect x="2" y="2" width="20" height="20" rx="5.5" />
    <circle cx="12" cy="12" r="4.2" />
    <circle cx="17.4" cy="6.6" r="1.1" fill="currentColor" stroke="none" />
  </svg>
);

const MailIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} aria-hidden="true" className="h-full w-full">
    <rect x="2.5" y="4.5" width="19" height="15" rx="2.5" />
    <path d="m3.5 6.5 8.5 6 8.5-6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const PinIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} aria-hidden="true" className="h-full w-full">
    <path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11Z" strokeLinejoin="round" />
    <circle cx="12" cy="10" r="2.6" />
  </svg>
);

const CONTACTS: Contact[] = [
  {
    label: "Instagram",
    value: "@myutattoo",
    hint: "Le plus rapide — écrivez-moi en message privé",
    href: SOCIALS.instagram,
    external: true,
    icon: InstagramIcon,
  },
  {
    label: "Email",
    value: SOCIALS.email,
    hint: "Pour une demande détaillée avec photos",
    href: `mailto:${SOCIALS.email}?subject=${encodeURIComponent("Demande de tatouage")}`,
    icon: MailIcon,
  },
  {
    label: "Le salon",
    value: SITE.address,
    hint: "Voir l'itinéraire sur Google Maps",
    href: `https://www.google.com/maps/search/?api=1&query=${SITE.mapQuery}`,
    external: true,
    icon: PinIcon,
  },
];

export default function ContactPage() {
  return (
    <section className="mx-auto max-w-2xl px-6 py-20">
      <AnimatedReveal>
        <h1 className="font-display text-4xl font-bold text-center text-foreground md:text-5xl">
          Me contacter
        </h1>
        <p className="mx-auto mt-3 max-w-md text-center text-muted">
          Envie d&apos;un projet ? Choisissez le moyen qui vous arrange, je vous
          réponds rapidement.
        </p>
      </AnimatedReveal>

      <AnimatedReveal delay={150}>
        <ul className="mt-12 flex flex-col gap-4">
          {CONTACTS.map((c) => (
            <li key={c.label}>
              <a
                href={c.href}
                {...(c.external
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
                className="group flex items-center gap-5 rounded-2xl border border-surface bg-surface p-5 transition-all duration-300 hover:border-accent hover:shadow-[0_0_24px_rgba(212,168,67,0.25)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-background text-accent transition-colors duration-300 group-hover:bg-accent group-hover:text-background">
                  <span className="h-6 w-6">{c.icon}</span>
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block text-xs font-medium uppercase tracking-wide text-muted">
                    {c.label}
                  </span>
                  <span className="block truncate text-lg font-medium text-foreground">
                    {c.value}
                  </span>
                  <span className="mt-0.5 block text-sm text-muted">{c.hint}</span>
                </span>

                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden="true"
                  className="h-5 w-5 shrink-0 text-muted transition-all duration-300 group-hover:translate-x-1 group-hover:text-accent"
                >
                  <path d="m9 6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>
            </li>
          ))}
        </ul>
      </AnimatedReveal>

      <AnimatedReveal delay={300}>
        <p className="mt-10 text-center text-sm text-muted">
          Sur place au {SITE.address} — les visites se font sur rendez-vous.
        </p>
      </AnimatedReveal>
    </section>
  );
}
