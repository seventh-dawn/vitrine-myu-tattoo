import { InstagramPost } from "./types";

const PLACEHOLDER_POSTS: InstagramPost[] = Array.from({ length: 12 }, (_, i) => ({
  id: `placeholder-${i}`,
  media_url: `/gallery/placeholder-${(i % 6) + 1}.svg`,
  permalink: "#",
  caption: `Tattoo ${i + 1}`,
  media_type: "IMAGE",
  timestamp: new Date().toISOString(),
}));

export async function getInstagramPosts(limit = 12): Promise<InstagramPost[]> {
  const token = process.env.INSTAGRAM_ACCESS_TOKEN;

  if (!token) {
    return PLACEHOLDER_POSTS.slice(0, limit);
  }

  try {
    const res = await fetch(
      `https://graph.instagram.com/me/media?fields=id,media_url,permalink,caption,media_type,timestamp&limit=${limit}&access_token=${token}`,
      { next: { revalidate: 3600 } }
    );

    if (!res.ok) {
      console.error("Instagram API error:", res.status);
      return PLACEHOLDER_POSTS.slice(0, limit);
    }

    const data = await res.json();
    return (data.data as InstagramPost[]).filter(
      (p) => p.media_type === "IMAGE" || p.media_type === "CAROUSEL_ALBUM"
    );
  } catch (error) {
    console.error("Instagram fetch failed:", error);
    return PLACEHOLDER_POSTS.slice(0, limit);
  }
}
