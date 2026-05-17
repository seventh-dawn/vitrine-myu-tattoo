"use client";

import { useRef, useEffect, useState } from "react";

interface AnimatedRevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

export function AnimatedReveal({
  children,
  className = "",
  delay = 0,
}: AnimatedRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    setMounted(true);
    const el = ref.current;
    if (!el) return;

    // If already in viewport, reveal immediately
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      setRevealed(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRevealed(true);
          observer.disconnect();
        }
      },
      { threshold: 0.05 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Before hydration, show content (no animation)
  if (!mounted) {
    return (
      <div className={className}>
        {children}
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${className}`}
      style={{
        opacity: revealed ? 1 : 0,
        transform: revealed ? "translateY(0)" : "translateY(2rem)",
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}
