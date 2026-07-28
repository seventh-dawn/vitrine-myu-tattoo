import { Suspense } from "react";
import { GalleryAdminManager } from "@/components/admin/GalleryAdminManager";
import { getGalleryImages } from "@/lib/gallery";

async function GalleryAdminContent() {
  const images = await getGalleryImages();
  return <GalleryAdminManager initialImages={images} />;
}

export default function AdminGalleryPage() {
  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-foreground">
        Gérer la galerie
      </h1>
      <div className="mt-8">
        <Suspense fallback={<p className="text-muted">Chargement…</p>}>
          <GalleryAdminContent />
        </Suspense>
      </div>
    </div>
  );
}
