import type { Metadata } from "next";
import { Cinzel_Decorative, DM_Sans } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SITE, SOCIALS } from "@/lib/constants";
import "./globals.css";

const cinzel = Cinzel_Decorative({
  variable: "--font-cinzel",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} — Salon de tatouage à Dieppe | ${SITE.artist}`,
    template: `%s | ${SITE.name}`,
  },
  description:
    "Salon de tatouage à Dieppe par Myu Tattoo. Tatouages sur mesure, style unique. Réservez votre séance au 21 Arcades de la Poissonnerie.",
  keywords: [
    "tatouage Dieppe",
    "tatoueur Dieppe",
    "salon tatouage Dieppe",
    "Myu Tattoo",
    "À l'encre de lune",
    "tatouage sur mesure",
    "tattoo Dieppe",
    "tatoueur Normandie",
    "tatouage artistique",
    "réserver tatouage",
  ],
  authors: [{ name: SITE.artist }],
  creator: SITE.artist,
  publisher: SITE.name,
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: SITE.url,
    siteName: SITE.name,
    title: `${SITE.name} — Salon de tatouage à Dieppe`,
    description:
      "Salon de tatouage à Dieppe par Myu Tattoo. Tatouages sur mesure, style unique. Réservez votre séance.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: `${SITE.name} — Salon de tatouage par ${SITE.artist}`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE.name} — Salon de tatouage à Dieppe`,
    description:
      "Tatouages sur mesure par Myu Tattoo à Dieppe. Réservez votre séance.",
    images: ["/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/icon.png",
    apple: "/apple-icon.png",
  },
  manifest: "/manifest.json",
  category: "tattoo",
};

function LocalBusinessJsonLd() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "TattooParlor",
    name: SITE.name,
    alternateName: SITE.artist,
    url: SITE.url,
    logo: `${SITE.url}/logo.jpg`,
    image: `${SITE.url}/og-image.jpg`,
    email: SOCIALS.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: "21 Arcades de la Poissonnerie",
      addressLocality: "Dieppe",
      postalCode: "76200",
      addressCountry: "FR",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: 49.9254,
      longitude: 1.0841,
    },
    sameAs: [SOCIALS.instagram],
    openingHoursSpecification: {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ],
      description: "Sur rendez-vous ou sans rendez-vous pour les flashs",
    },
    priceRange: "$$",
    description:
      "Salon de tatouage à Dieppe par Myu Tattoo. Tatouages sur mesure dans un cadre intimiste au cœur des Arcades de la Poissonnerie.",
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`${cinzel.variable} ${dmSans.variable} h-full`}>
      <head>
        <LocalBusinessJsonLd />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground antialiased">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
