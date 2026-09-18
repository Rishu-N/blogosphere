import Link from "next/link";
import type { ReactNode } from "react";
import LogoutButton from "@/components/admin/LogoutButton";

export default function AdminDashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <nav className="border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-5">
            <span className="font-semibold text-[var(--color-text)]">Blogosphere admin</span>
            <Link href="/admin" className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)]">
              Dashboard
            </Link>
            <Link href="/admin/articles" className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)]">
              Articles
            </Link>
            <Link href="/admin/settings" className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)]">
              Settings
            </Link>
            <Link href="/admin/stats" className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)]">
              Stats
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)]">
              View site
            </Link>
            <LogoutButton />
          </div>
        </div>
      </nav>
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
