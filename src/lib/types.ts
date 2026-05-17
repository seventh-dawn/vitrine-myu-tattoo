export interface InstagramPost {
  id: string;
  media_url: string;
  permalink: string;
  caption?: string;
  media_type: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
  timestamp: string;
}

export interface NavLink {
  label: string;
  href: string;
}
