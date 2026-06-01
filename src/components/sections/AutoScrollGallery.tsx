"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

interface GalleryImage {
  id: string;
  src: string;
  alt: string;
}

export function AutoScrollGallery({ images }: { images: GalleryImage[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    let raf: number;
    let accumulator = 0;
    const speed = 0.3; // px per frame (accumulated, applied as whole pixels)

    function step() {
      if (!paused && el) {
        accumulator += speed;
        if (accumulator >= 1) {
          const px = Math.floor(accumulator);
          el.scrollLeft += px;
          accumulator -= px;
        }
        // Loop: when reaching halfway (the duplicate set), reset to start
        if (el.scrollLeft >= el.scrollWidth / 2) {
          el.scrollLeft = 0;
        }
      }
      raf = requestAnimationFrame(step);
    }

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [paused]);

  // Duplicate images for seamless loop
  const loopImages = [...images, ...images];

  return (
    <div
      ref={scrollRef}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      onTouchEnd={() => setPaused(false)}
      className="flex gap-4 overflow-x-auto px-6 scrollbar-hide"
      style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
    >
      {loopImages.map((img, i) => (
        <div
          key={`${img.id}-${i}`}
          className="group relative aspect-[3/4] w-64 flex-shrink-0 overflow-hidden rounded-lg bg-surface md:w-72"
        >
          <Image
            src={img.src}
            alt={img.alt}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
            sizes="288px"
          />
          <div className="absolute inset-0 bg-primary-dark/0 transition-colors duration-300 group-hover:bg-primary-dark/30" />
        </div>
      ))}
    </div>
  );
}
