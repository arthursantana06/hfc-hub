"use client";

import { LayoutDashboard, Users, LineChart, Settings, LogOut } from "lucide-react";
import { SideNavLink } from "./SideNavLink";
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
      <div className="p-6 flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-brand-300 overflow-hidden shrink-0 flex items-center justify-center">
          <span className="text-brand-900 font-poppins font-semibold">
            {user ? initials(user.nome) : "HFC"}
          </span>
        </div>
        <div className="min-w-0">
          <p
            className="font-poppins font-medium text-white truncate"
            title={user?.nome ?? undefined}
          >
            {user?.nome ?? user?.email ?? "HFC Hub"}
          </p>
          {user && (
            <p className="font-inter text-xs text-brand-300">
              {ROLE_LABEL[user.role]}
            </p>
          )}
        </div>
      </div>

      <nav className="flex-1 px-4 mt-6 flex flex-col gap-2">
        <SideNavLink href="/" icon={LayoutDashboard} label="Dashboard" exact />
        <SideNavLink href="/clientes" icon={Users} label="Client Hub" />
        <SideNavLink href="#" icon={LineChart} label="Investimentos" />
      </nav>

      <div className="p-4 mt-auto mb-4 flex flex-col gap-2">
        <SideNavLink href="/configuracoes" icon={Settings} label="Configurações" />
        <form action={logout}>
          <button
            type="submit"
            className="w-full flex items-center gap-3 px-4 py-3 text-brand-300 hover:bg-brand-600/50 hover:text-white rounded-lg transition-colors border-l-4 border-transparent cursor-pointer"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-inter text-sm">Sair</span>
          </button>
        </form>
      </div>
    </aside>
  );
}
