"use client";

import Image from "next/image";
import { useState } from "react";
import { LightboxModal } from "./LightboxModal";

// TODO: Replace with Instagram API data passed as props
const PLACEHOLDER_IMAGES = Array.from({ length: 12 }, (_, i) => ({
  id: String(i),
  src: `/gallery/placeholder-${(i % 6) + 1}.svg`,
  alt: `Tattoo ${i + 1}`,
}));

export function GalleryGrid() {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  return (
    <>
      <div className="columns-2 gap-4 md:columns-3">
        {PLACEHOLDER_IMAGES.map((img, i) => (
          <button
            key={img.id}
            onClick={() => setLightboxIndex(i)}
            className="group mb-4 block w-full overflow-hidden rounded-lg bg-surface break-inside-avoid"
          >
            <Image
              src={img.src}
              alt={img.alt}
              width={400}
              height={500}
              className="w-full object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 768px) 50vw, 33vw"
            />
          </button>
        ))}
      </div>

      {lightboxIndex !== null && (
        <LightboxModal
          images={PLACEHOLDER_IMAGES}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNavigate={setLightboxIndex}
        />
      )}
    </>
  );
}
