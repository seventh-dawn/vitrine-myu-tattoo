"use client";

import Image from "next/image";
import { useState } from "react";
import type { FlashItem, FlashStatus } from "@/lib/flash";

const STATUS_OPTIONS: { value: FlashStatus; label: string }[] = [
  { value: "disponible", label: "Disponible" },
  { value: "reserve", label: "Réservé" },
  { value: "realise", label: "Réalisé" },
];

export function FlashAdminManager({
  initialItems,
}: {
  initialItems: FlashItem[];
}) {
  const [items, setItems] = useState(initialItems);
  const [file, setFile] = useState<File | null>(null);
  const [price, setPrice] = useState("");
  const [status, setStatus] = useState<FlashStatus>("disponible");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !price) {
      setError("Ajoute une image et un prix");
      return;
    }
    setSubmitting(true);
    setError("");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("price", price);
    formData.append("status", status);
    formData.append("note", note);

    const res = await fetch("/api/admin/flash", {
      method: "POST",
      body: formData,
    });

    setSubmitting(false);

    if (!res.ok) {
      setError("Échec de l'ajout, réessaie");
      return;
    }

    const data = await res.json();
    setItems(data.items);
    setFile(null);
    setPrice("");
    setStatus("disponible");
    setNote("");
    (e.target as HTMLFormElement).reset();
  }

  async function handleUpdate(
    id: string,
    patch: { price?: number; status?: FlashStatus; note?: string }
  ) {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...patch } : item))
    );
    await fetch("/api/admin/flash", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...patch }),
    });
  }

  async function handleDelete(item: FlashItem) {
    if (!confirm("Supprimer ce flash ?")) return;
    setItems((prev) => prev.filter((i) => i.id !== item.id));
    await fetch("/api/admin/flash", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: item.id, src: item.src }),
    });
  }

  return (
    <div>
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 rounded-lg bg-surface p-6 md:flex-row md:items-end"
      >
        <div className="flex-1">
          <label className="mb-1 block text-sm text-muted">Image</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="w-full text-sm text-foreground file:mr-3 file:rounded-full file:border-0 file:bg-accent file:px-4 file:py-2 file:text-sm file:font-semibold file:text-background"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-muted">Prix (€)</label>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-28 rounded-lg border border-background bg-background px-3 py-2 text-foreground outline-none focus:border-accent"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-muted">Statut</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as FlashStatus)}
            className="rounded-lg border border-background bg-background px-3 py-2 text-foreground outline-none focus:border-accent"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label className="mb-1 block text-sm text-muted">
            Commentaire (optionnel)
          </label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Ex: prix variable selon la taille"
            className="w-full rounded-lg border border-background bg-background px-3 py-2 text-foreground outline-none focus:border-accent"
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-full bg-accent px-6 py-2 text-sm font-semibold text-background hover:bg-accent-bright disabled:opacity-50"
        >
          {submitting ? "Ajout…" : "Ajouter"}
        </button>
      </form>
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
        {items.map((item) => (
          <div key={item.id} className="rounded-lg bg-surface p-3">
            <Image
              src={item.src}
              alt={item.alt}
              width={300}
              height={300}
              className="aspect-square w-full rounded object-cover"
            />
            <div className="mt-3 flex items-center gap-2">
              <span className="text-muted">€</span>
              <input
                type="number"
                defaultValue={item.price}
                onBlur={(e) =>
                  handleUpdate(item.id, { price: Number(e.target.value) })
                }
                className="w-20 rounded border border-background bg-background px-2 py-1 text-sm text-foreground outline-none focus:border-accent"
              />
            </div>
            <select
              value={item.status}
              onChange={(e) =>
                handleUpdate(item.id, {
                  status: e.target.value as FlashStatus,
                })
              }
              className="mt-2 w-full rounded border border-background bg-background px-2 py-1 text-sm text-foreground outline-none focus:border-accent"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <input
              type="text"
              defaultValue={item.note ?? ""}
              placeholder="Commentaire (ex: prix variable selon la taille)"
              onBlur={(e) => handleUpdate(item.id, { note: e.target.value })}
              className="mt-2 w-full rounded border border-background bg-background px-2 py-1 text-sm text-foreground outline-none focus:border-accent"
            />
            <button
              onClick={() => handleDelete(item)}
              className="mt-2 w-full rounded border border-red-400/40 py-1 text-sm text-red-400 hover:bg-red-400/10"
            >
              Supprimer
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
