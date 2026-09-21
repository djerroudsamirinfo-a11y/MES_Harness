"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ROLE_LABELS } from "@/lib/auth-client";

type Props = {
  user: { name: string; email: string; role: string };
};

const links = [
  { href: "/dashboard", label: "Tableau de bord" },
  { href: "/work-orders", label: "Ordres de fab." },
  { href: "/execution", label: "Exécution" },
  { href: "/articles", label: "Articles / BOM" },
  { href: "/work-centers", label: "Postes" },
];

export function Nav({ user }: Props) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="border-b border-slate-200 bg-white shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-700 text-sm font-bold text-white">
              MES
            </div>
            <div className="leading-tight">
              <div className="text-sm font-bold text-slate-900">MES Harness</div>
              <div className="text-[11px] text-slate-500">Usine Oran — Phase 1</div>
            </div>
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {links.map((l) => {
              const active = pathname.startsWith(l.href);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                    active
                      ? "bg-emerald-50 text-emerald-800"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  {l.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right text-xs">
            <div className="font-semibold text-slate-800">{user.name}</div>
            <div className="text-slate-500">
              {ROLE_LABELS[user.role] || user.role}
            </div>
          </div>
          <button
            onClick={logout}
            className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
          >
            Déconnexion
          </button>
        </div>
      </div>
      <nav className="flex gap-1 overflow-x-auto border-t border-slate-100 px-4 py-2 md:hidden">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={`whitespace-nowrap rounded-md px-3 py-1 text-xs font-medium ${
              pathname.startsWith(l.href)
                ? "bg-emerald-50 text-emerald-800"
                : "text-slate-600"
            }`}
          >
            {l.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
