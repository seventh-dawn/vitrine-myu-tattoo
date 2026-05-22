"use client";

/**
 * CSS-based starfield with 4-pointed sparkle stars (two crossed lozenges).
 * No canvas — pure DOM elements with CSS animations.
 */

import { useState, useEffect } from "react";

interface Star {
  id: number;
  x: number;
  y: number;
  size: number;
  delay: number;
  duration: number;
  opacity: number;
}

function generateStars(count: number): Star[] {
  const stars: Star[] = [];
  for (let i = 0; i < count; i++) {
    // Keep stars away from center text area (20-80% x, 15-85% y)
    let x: number, y: number;
    do {
      x = Math.random() * 100;
      y = Math.random() * 100;
    } while (x > 15 && x < 85 && y > 10 && y < 90);

    stars.push({
      id: i,
      x,
      y,
      size: Math.random() * 20 + 8,
      delay: Math.random() * 8,
      duration: Math.random() * 4 + 3,
      opacity: Math.random() * 0.3 + 0.2,
    });
  }
  return stars;
}

export function Starfield() {
  const [stars, setStars] = useState<Star[]>([]);

  useEffect(() => {
    setStars(generateStars(20));
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {stars.map((star) => (
        <span
          key={star.id}
          className="absolute animate-twinkle"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            opacity: star.opacity,
            animationDelay: `${star.delay}s`,
            animationDuration: `${star.duration}s`,
          }}
        >
          {/* 4-pointed star — taller than wide */}
          <span
            className="absolute inset-0"
            style={{
              clipPath: "polygon(50% 0%, 56% 42%, 100% 50%, 56% 58%, 50% 100%, 44% 58%, 0% 50%, 44% 42%)",
              background: "linear-gradient(180deg, #f0e6f6, #d4a843)",
              transform: "scaleY(1.6)",
            }}
          />
        </span>
      ))}
    </div>
  );
}
