"use client";

import Link from "next/link";
import { LayoutDashboard, Users, LineChart, Settings, LogOut } from "lucide-react";
import { SideNavLink } from "./SideNavLink";
import { Logo } from "./Logo";
import { logout } from "@/lib/actions/auth";
import { ROLE_LABEL } from "@/lib/roles";
import type { AppUser } from "@/lib/dal";

/** Iniciais para o avatar — "Ana Beatriz Souza" → "AS". */
function initials(nome: string | null) {
  const parts = (nome ?? "").trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase() || "?";
}

export function HubSidebar({ user }: { user: AppUser | null }) {
  return (
    <aside className="w-64 bg-brand-900 flex flex-col shrink-0">
      {/* Marca — leva ao Dashboard, como se espera de um logo de topo. */}
      <Link
        href="/"
        className="shrink-0 flex items-center gap-3 px-6 py-5 border-b border-white/10 hover:bg-brand-600/20 transition-colors"
      >
        <Logo tone="light" size="sm" className="h-9 w-9" />
        <span className="font-poppins font-medium text-white text-lg">Hub</span>
      </Link>

      <nav className="flex-1 overflow-y-auto px-4 py-6 flex flex-col gap-2">
        <SideNavLink href="/" icon={LayoutDashboard} label="Dashboard" exact />
        <SideNavLink href="/clientes" icon={Users} label="Hub de Clientes" />
        <SideNavLink href="/investimentos" icon={LineChart} label="Investimentos" soon />
      </nav>

      <div className="shrink-0 px-4 pb-4 flex flex-col gap-2">
        <SideNavLink href="/configuracoes" icon={Settings} label="Configurações" />

        {/* Identidade e saída juntas: é onde o usuário procura por "sair". */}
        <div className="mt-2 pt-4 border-t border-white/10 flex items-center gap-3 px-2">
          <div className="w-10 h-10 rounded-full bg-brand-300 shrink-0 flex items-center justify-center">
            <span className="text-brand-900 font-poppins font-semibold text-sm">
              {initials(user?.nome ?? null)}
            </span>
          </div>

          <div className="min-w-0 flex-1">
            <p
              className="font-inter text-sm text-white truncate"
              title={user?.nome ?? undefined}
            >
              {user?.nome ?? user?.email ?? "—"}
            </p>
            {user && (
              <p className="font-inter text-xs text-brand-300">
                {ROLE_LABEL[user.role]}
              </p>
            )}
          </div>

          <form action={logout}>
            <button
              type="submit"
              title="Sair"
              aria-label="Sair"
              className="p-2 text-brand-300 hover:text-white hover:bg-brand-600/50 rounded-lg transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
