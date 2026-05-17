"use client";

import Image from "next/image";
import { useEffect } from "react";

interface LightboxImage {
  id: string;
  src: string;
  alt: string;
}

interface LightboxModalProps {
  images: LightboxImage[];
  currentIndex: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

export function LightboxModal({
  images,
  currentIndex,
  onClose,
  onNavigate,
}: LightboxModalProps) {
  const current = images[currentIndex];

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight" && currentIndex < images.length - 1)
        onNavigate(currentIndex + 1);
      if (e.key === "ArrowLeft" && currentIndex > 0)
        onNavigate(currentIndex - 1);
    }
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [currentIndex, images.length, onClose, onNavigate]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative max-h-[90vh] max-w-[90vw]"
        onClick={(e) => e.stopPropagation()}
      >
        <Image
          src={current.src}
          alt={current.alt}
          width={900}
          height={1200}
          className="max-h-[85vh] w-auto rounded-lg object-contain"
        />

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 text-muted hover:text-foreground transition-colors"
          aria-label="Fermer"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-7 w-7">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Prev */}
        {currentIndex > 0 && (
          <button
            onClick={() => onNavigate(currentIndex - 1)}
            className="absolute left-0 top-1/2 -translate-x-12 -translate-y-1/2 text-muted hover:text-foreground transition-colors"
            aria-label="Précédent"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-8 w-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
        )}

        {/* Next */}
        {currentIndex < images.length - 1 && (
          <button
            onClick={() => onNavigate(currentIndex + 1)}
            className="absolute right-0 top-1/2 translate-x-12 -translate-y-1/2 text-muted hover:text-foreground transition-colors"
            aria-label="Suivant"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-8 w-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
