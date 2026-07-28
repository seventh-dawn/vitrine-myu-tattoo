import { head, put } from "@vercel/blob";

export async function readJson<T>(pathname: string, fallback: T): Promise<T> {
  try {
    const blob = await head(pathname);
    const res = await fetch(blob.url, { cache: "no-store" });
    if (!res.ok) return fallback;
    return (await res.json()) as T;
  } catch {
    return fallback;
  }
}

export async function writeJson<T>(pathname: string, data: T): Promise<void> {
  await put(pathname, JSON.stringify(data, null, 2), {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true,
  });
}
