"use client";

import { useState, type FormEvent } from "react";

const PLACEMENTS = [
  "Bras",
  "Avant-bras",
  "Jambe",
  "Dos",
  "Poitrine",
  "Côtes",
  "Main",
  "Cheville",
  "Autre",
];

const SIZES = ["Petit (< 5cm)", "Moyen (5-15cm)", "Grand (15-30cm)", "Très grand (> 30cm)"];

const STYLES = [
  "Fine line",
  "Blackwork",
  "Dotwork",
  "Néo-traditionnel",
  "Kawaii",
  "Ésotérique",
  "Floral",
  "Autre",
];

export function BookingForm() {
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");

    const formData = new FormData(e.currentTarget);

    try {
      // TODO: Replace with actual Formspree endpoint
      const res = await fetch("https://formspree.io/f/YOUR_FORM_ID", {
        method: "POST",
        body: formData,
        headers: { Accept: "application/json" },
      });

      if (res.ok) {
        setStatus("success");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="rounded-xl bg-surface p-8 text-center">
        <p className="text-lg font-semibold text-accent">Message envoyé !</p>
        <p className="mt-2 text-muted">
          Merci pour votre demande. Je vous recontacte très vite.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Name */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-foreground">
          Nom *
        </label>
        <input
          type="text"
          id="name"
          name="name"
          required
          className="mt-1 w-full rounded-lg border border-surface bg-surface px-4 py-3 text-foreground placeholder:text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          placeholder="Votre nom"
        />
      </div>

      {/* Email */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-foreground">
          Email *
        </label>
        <input
          type="email"
          id="email"
          name="email"
          required
          className="mt-1 w-full rounded-lg border border-surface bg-surface px-4 py-3 text-foreground placeholder:text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          placeholder="votre@email.com"
        />
      </div>

      {/* Placement */}
      <div>
        <label htmlFor="placement" className="block text-sm font-medium text-foreground">
          Emplacement *
        </label>
        <select
          id="placement"
          name="placement"
          required
          className="mt-1 w-full rounded-lg border border-surface bg-surface px-4 py-3 text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        >
          <option value="">Choisir un emplacement</option>
          {PLACEMENTS.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>

      {/* Size */}
      <div>
        <label htmlFor="size" className="block text-sm font-medium text-foreground">
          Taille *
        </label>
        <select
          id="size"
          name="size"
          required
          className="mt-1 w-full rounded-lg border border-surface bg-surface px-4 py-3 text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        >
          <option value="">Choisir une taille</option>
          {SIZES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {/* Style */}
      <div>
        <label htmlFor="style" className="block text-sm font-medium text-foreground">
          Style
        </label>
        <select
          id="style"
          name="style"
          className="mt-1 w-full rounded-lg border border-surface bg-surface px-4 py-3 text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        >
          <option value="">Choisir un style (optionnel)</option>
          {STYLES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {/* Message */}
      <div>
        <label htmlFor="message" className="block text-sm font-medium text-foreground">
          Description du projet *
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={5}
          className="mt-1 w-full rounded-lg border border-surface bg-surface px-4 py-3 text-foreground placeholder:text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent resize-none"
          placeholder="Décrivez votre idée de tatouage..."
        />
      </div>

      {/* Reference image */}
      <div>
        <label htmlFor="reference" className="block text-sm font-medium text-foreground">
          Image de référence
        </label>
        <input
          type="file"
          id="reference"
          name="reference"
          accept="image/*"
          className="mt-1 w-full text-sm text-muted file:mr-4 file:rounded-full file:border-0 file:bg-accent file:px-4 file:py-2 file:text-sm file:font-semibold file:text-background hover:file:bg-accent-bright file:cursor-pointer file:transition-colors"
        />
        <p className="mt-1 text-xs text-muted">Optionnel — Max 5 Mo</p>
      </div>

      {/* Submit */}
      {status === "error" && (
        <p className="text-sm text-red-400">
          Une erreur est survenue. Réessayez ou contactez-moi sur Instagram.
        </p>
      )}

      <button
        type="submit"
        disabled={status === "sending"}
        className="w-full rounded-full bg-accent px-8 py-3 font-semibold text-background transition-all duration-300 hover:bg-accent-bright hover:shadow-[0_0_20px_rgba(212,168,67,0.4)] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {status === "sending" ? "Envoi en cours..." : "Envoyer ma demande"}
      </button>
    </form>
  );
}
