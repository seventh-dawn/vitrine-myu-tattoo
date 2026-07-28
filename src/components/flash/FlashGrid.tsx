"use client";

import Image from "next/image";
import { useState } from "react";
import type { FlashItem } from "@/lib/flash";
import { FlashLightbox } from "./FlashLightbox";
import { StatusBadge } from "./StatusBadge";

export function FlashGrid({ items }: { items: FlashItem[] }) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  return (
    <>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {items.map((item, i) => (
          <button
            key={item.id}
            onClick={() => setLightboxIndex(i)}
            className="group relative block overflow-hidden rounded-lg bg-surface text-left"
          >
            <Image
              src={item.src}
              alt={item.alt}
              width={400}
              height={400}
              className={`aspect-square w-full object-cover transition-transform duration-500 group-hover:scale-105 ${
                item.status !== "disponible" ? "opacity-60" : ""
              }`}
              sizes="(max-width: 768px) 50vw, 25vw"
            />
            <div className="absolute left-2 top-2">
              <StatusBadge status={item.status} />
            </div>
            <div className="absolute bottom-0 left-0 right-0 bg-background/80 px-3 py-2 backdrop-blur-sm">
              <span className="font-display text-sm font-semibold text-accent">
                {item.price}€
              </span>
              {item.note && (
                <p className="mt-0.5 truncate text-xs text-muted">{item.note}</p>
              )}
            </div>
          </button>
        ))}
      </div>

      {lightboxIndex !== null && (
        <FlashLightbox
          items={items}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNavigate={setLightboxIndex}
        />
      )}
    </>
  );
}
