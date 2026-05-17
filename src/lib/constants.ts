export const SITE = {
  name: "A l'encre de lune",
  artist: "Myu Tattoo",
  description:
    "Salon de tatouage par Myu Tattoo — A l'encre de lune. Réservez votre séance.",
  url: "https://alencredelune.fr",
  address: "21 Arcades de la Poissonnerie, Dieppe",
  mapQuery: "21+Arcades+de+la+Poissonnerie+Dieppe",
} as const;

export const NAV_LINKS = [
  { label: "Accueil", href: "/" },
  { label: "Galerie", href: "/gallery" },
  { label: "Contact", href: "/contact" },
] as const;

export const SOCIALS = {
  instagram: "https://www.instagram.com/myu.tattoo",
} as const;
