import { Hero } from "@/components/sections/Hero";
import { GalleryPreview } from "@/components/sections/GalleryPreview";
import { AboutSnippet } from "@/components/sections/AboutSnippet";
import { ContactCTA } from "@/components/sections/ContactCTA";

export default function Home() {
  return (
    <>
      <Hero />
      <GalleryPreview />
      <AboutSnippet />
      <ContactCTA />
    </>
  );
}
