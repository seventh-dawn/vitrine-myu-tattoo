import type { Metadata } from "next";
import type { ReactNode } from "react";
import Image from "next/image";
import { AnimatedReveal } from "@/components/ui/AnimatedReveal";
import { SITE, SOCIALS } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Mes liens",
  description:
    "Tous les liens de Myu Tattoo — À l'encre de lune : le site, Instagram, contact et itinéraire vers le salon à Dieppe.",
  alternates: { canonical: "/liens" },
  robots: { index: false, follow: true },
};

type LinkItem = {
  label: string;
  value: string;
  href: string;
  external?: boolean;
  icon: ReactNode;
};

const SiteIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} aria-hidden="true" className="h-full w-full">
    <circle cx="12" cy="12" r="9.5" />
    <path d="M2.5 12h19M12 2.5c2.6 2.6 4 6 4 9.5s-1.4 6.9-4 9.5c-2.6-2.6-4-6-4-9.5s1.4-6.9 4-9.5Z" strokeLinejoin="round" />
  </svg>
);

const GalleryIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} aria-hidden="true" className="h-full w-full">
    <rect x="2.5" y="2.5" width="19" height="19" rx="2.5" />
    <circle cx="8.5" cy="8.5" r="1.8" />
    <path d="m3 18 5-5 4 4 3-3 6 6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

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

const LINKS: LinkItem[] = [
  {
    label: "Le site",
    value: "alencredelune.fr",
    href: "/",
    icon: SiteIcon,
  },
  {
    label: "La galerie",
    value: "Mes réalisations",
    href: "/gallery",
    icon: GalleryIcon,
  },
  {
    label: "Instagram",
    value: "@myutattoo",
    href: SOCIALS.instagram,
    external: true,
    icon: InstagramIcon,
  },
  {
    label: "Me contacter",
    value: SOCIALS.email,
    href: "/contact",
    icon: MailIcon,
  },
  {
    label: "Itinéraire",
    value: SITE.address,
    href: `https://www.google.com/maps/search/?api=1&query=${SITE.mapQuery}`,
    external: true,
    icon: PinIcon,
  },
];

export default function LiensPage() {
  return (
    <section className="mx-auto max-w-md px-6 py-16">
      <AnimatedReveal>
        <div className="flex flex-col items-center text-center">
          <Image
            src="/logo.jpg"
            alt={`Logo ${SITE.name}`}
            width={96}
            height={96}
            className="h-24 w-24 rounded-full border border-surface object-cover"
            priority
          />
          <h1 className="mt-5 font-display text-3xl font-bold text-foreground">
            {SITE.name}
          </h1>
          <p className="mt-1 text-sm uppercase tracking-[0.2em] text-muted">
            {SITE.artist} · Dieppe
          </p>
        </div>
      </AnimatedReveal>

      <AnimatedReveal delay={150}>
        <ul className="mt-10 flex flex-col gap-3">
          {LINKS.map((l) => (
            <li key={l.label}>
              <a
                href={l.href}
                {...(l.external
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
                className="group flex items-center gap-4 rounded-2xl border border-surface bg-surface p-4 transition-all duration-300 hover:border-accent hover:shadow-[0_0_24px_rgba(212,168,67,0.25)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-background text-accent transition-colors duration-300 group-hover:bg-accent group-hover:text-background">
                  <span className="h-5 w-5">{l.icon}</span>
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-foreground">
                    {l.label}
                  </span>
                  <span className="block truncate text-xs text-muted">
                    {l.value}
                  </span>
                </span>

                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden="true"
                  className="h-4 w-4 shrink-0 text-muted transition-all duration-300 group-hover:translate-x-1 group-hover:text-accent"
                >
                  <path d="m9 6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>
            </li>
          ))}
        </ul>
      </AnimatedReveal>

      <AnimatedReveal delay={300}>
        <div className="mt-8 overflow-hidden rounded-2xl border border-surface">
          <iframe
            src={`https://maps.google.com/maps?q=${SITE.mapQuery}&output=embed`}
            width="100%"
            height="220"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Localisation du salon"
          />
        </div>
        <p className="mt-4 text-center text-xs text-muted">
          {SITE.address} — sur rendez-vous
        </p>
      </AnimatedReveal>
    </section>
  );
}
