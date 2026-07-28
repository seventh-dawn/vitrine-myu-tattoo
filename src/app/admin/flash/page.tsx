import { Suspense } from "react";
import { FlashAdminManager } from "@/components/admin/FlashAdminManager";
import { getFlashItems } from "@/lib/flash";

async function FlashAdminContent() {
  const items = await getFlashItems();
  return <FlashAdminManager initialItems={items} />;
}

export default function AdminFlashPage() {
  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-foreground">
        Gérer les flashs
      </h1>
      <div className="mt-8">
        <Suspense fallback={<p className="text-muted">Chargement…</p>}>
          <FlashAdminContent />
        </Suspense>
      </div>
    </div>
  );
}
