import { del, put } from "@vercel/blob";
import { NextResponse } from "next/server";
import {
  addFlashItem,
  deleteFlashItem,
  updateFlashItem,
  type FlashStatus,
} from "@/lib/flash";

const VALID_STATUSES: FlashStatus[] = ["disponible", "reserve", "realise"];

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const price = Number(formData.get("price"));
  const status = formData.get("status") as string;
  const note = formData.get("note") as string | null;

  if (!file || !Number.isFinite(price) || !VALID_STATUSES.includes(status as FlashStatus)) {
    return NextResponse.json({ error: "Champs invalides" }, { status: 400 });
  }

  const blob = await put(`flash/${file.name}`, file, { access: "public" });

  const items = await addFlashItem({
    src: blob.url,
    alt: "Flash tattoo",
    price,
    status: status as FlashStatus,
    ...(note ? { note } : {}),
  });

  return NextResponse.json({ items });
}

export async function PATCH(request: Request) {
  const { id, price, status, note } = await request.json();

  if (typeof id !== "string") {
    return NextResponse.json({ error: "id manquant" }, { status: 400 });
  }
  if (status !== undefined && !VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: "status invalide" }, { status: 400 });
  }

  const items = await updateFlashItem(id, {
    ...(price !== undefined ? { price: Number(price) } : {}),
    ...(status !== undefined ? { status } : {}),
    ...(note !== undefined ? { note: note === "" ? undefined : note } : {}),
  });

  return NextResponse.json({ items });
}

export async function DELETE(request: Request) {
  const { id, src } = await request.json();
  if (typeof id !== "string") {
    return NextResponse.json({ error: "id manquant" }, { status: 400 });
  }

  const items = await deleteFlashItem(id);

  if (typeof src === "string") {
    await del(src).catch(() => {});
  }

  return NextResponse.json({ items });
}
