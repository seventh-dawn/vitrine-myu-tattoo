import Link from "next/link";
import { SITE, SOCIALS } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="border-t border-surface bg-background py-10">
      <div className="mx-auto grid max-w-6xl gap-8 px-6 md:grid-cols-3">
        {/* Brand & Address */}
        <div>
          <p className="font-display text-lg font-bold text-accent">
            {SITE.name}
          </p>
          <p className="mt-1 text-sm text-muted">{SITE.artist}</p>
          <p className="mt-2 text-sm text-muted">{SITE.address}</p>
        </div>

        {/* Quick links */}
        <div className="flex flex-col gap-2">
          <Link href="/gallery" className="text-sm text-muted hover:text-accent transition-colors">
            Galerie
          </Link>
          <Link href="/contact" className="text-sm text-muted hover:text-accent transition-colors">
            Réserver
          </Link>
          <a
            href={SOCIALS.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-muted hover:text-accent transition-colors"
          >
            Instagram
          </a>
        </div>

        {/* Google Maps embed */}
        <div className="overflow-hidden rounded-lg">
          <iframe
            src={`https://maps.google.com/maps?q=${SITE.mapQuery}&output=embed`}
            width="100%"
            height="200"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Localisation du salon"
          />
        </div>
      </div>

      <div className="mx-auto mt-8 max-w-6xl border-t border-surface px-6 pt-6">
        <p className="text-center text-xs text-muted">
          &copy; 2025 {SITE.name}. Tous droits réservés.
        </p>
      </div>
    </footer>
  );
}
