import { connection } from "next/server";
import { readJson, writeJson } from "./blob-store";

export type FlashStatus = "disponible" | "reserve" | "realise";

export interface FlashItem {
  id: string;
  src: string;
  alt: string;
  price: number;
  status: FlashStatus;
  note?: string;
}

const DATA_PATH = "data/flash.json";

export async function getFlashItems(): Promise<FlashItem[]> {
  await connection();
  return readJson<FlashItem[]>(DATA_PATH, []);
}

export async function addFlashItem(
  item: Omit<FlashItem, "id">
): Promise<FlashItem[]> {
  const items = await getFlashItems();
  const newItem: FlashItem = { ...item, id: crypto.randomUUID() };
  const updated = [newItem, ...items];
  await writeJson(DATA_PATH, updated);
  return updated;
}

export async function updateFlashItem(
  id: string,
  patch: Partial<Pick<FlashItem, "price" | "status" | "note">>
): Promise<FlashItem[]> {
  const items = await getFlashItems();
  const updated = items.map((item) =>
    item.id === id ? { ...item, ...patch } : item
  );
  await writeJson(DATA_PATH, updated);
  return updated;
}

export async function deleteFlashItem(id: string): Promise<FlashItem[]> {
  const items = await getFlashItems();
  const updated = items.filter((item) => item.id !== id);
  await writeJson(DATA_PATH, updated);
  return updated;
}
