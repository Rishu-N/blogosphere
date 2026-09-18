"use client";

import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <button type="button" onClick={handleLogout} className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)]">
      Log out
    </button>
  );
}
