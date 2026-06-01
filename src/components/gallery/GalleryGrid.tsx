"use client";

import Image from "next/image";
import { useState } from "react";
import { LightboxModal } from "./LightboxModal";

interface GalleryImage {
  id: string;
  src: string;
  alt: string;
}

export function GalleryGrid({ images }: { images: GalleryImage[] }) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  return (
    <>
      <div className="columns-2 gap-4 md:columns-3">
        {images.map((img, i) => (
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
          images={images}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNavigate={setLightboxIndex}
        />
      )}
    </>
  );
}
