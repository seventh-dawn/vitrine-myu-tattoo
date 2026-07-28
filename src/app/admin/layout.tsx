import Link from "next/link";
import { LogoutButton } from "@/components/admin/LogoutButton";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <nav className="mb-10 flex items-center justify-between border-b border-surface pb-4">
        <div className="flex gap-6">
          <Link
            href="/admin/flash"
            className="font-display text-lg font-semibold text-foreground hover:text-accent"
          >
            Flash
          </Link>
          <Link
            href="/admin/gallery"
            className="font-display text-lg font-semibold text-foreground hover:text-accent"
          >
            Galerie
          </Link>
        </div>
        <LogoutButton />
      </nav>
      {children}
    </div>
  );
}
