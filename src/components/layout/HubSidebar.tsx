"use client";

import Link from "next/link";
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  LineChart,
  FileText,
  Gift,
  Settings,
  LogOut,
} from "lucide-react";
import { SideNavLink } from "./SideNavLink";
import { logout } from "@/lib/actions/auth";
import { ROLE_LABEL } from "@/lib/roles";
import { Avatar } from "@/components/ui/Avatar";
import type { AppUser } from "@/lib/dal";

export function HubSidebar({
  user,
  avatarUrl,
}: {
  user: AppUser | null;
  avatarUrl: string | null;
}) {
  return (
    <aside className="w-64 bg-brand-900 flex flex-col shrink-0">
      {/* Marca — leva ao Dashboard. Wordmark simplificado, igual ao da tela
          de login: só o texto, sem ícone nem legenda "HFC Consultoria". */}
      <Link
        href="/"
        className="shrink-0 flex items-center pl-9 pr-6 py-[1.125rem] border-b border-white/10 hover:bg-brand-600/20 transition-colors"
      >
        {/* `pl-9` = padding do <nav> (px-4) + borda-esquerda do SideNavLink
            (border-l-4) + padding do próprio SideNavLink (px-4) — alinha o
            texto com os ícones das abas logo abaixo. `py-[1.125rem]` em vez
            de `py-5`: o texto maior (text-3xl) tem 4px a mais de altura de
            linha que o texto-2xl anterior; reduzir o padding compensa, para
            a caixinha continuar com a mesma altura de antes. */}
        <span className="font-outfit font-medium text-white text-3xl tracking-tight lowercase">
          hfc <span className="text-brand-300">hub</span>
        </span>
      </Link>

      <nav className="flex-1 overflow-y-auto px-4 py-6 flex flex-col gap-2">
        <SideNavLink href="/" icon={LayoutDashboard} label="Visão Geral" exact />
        <SideNavLink href="/clientes" icon={Users} label="Clientes" />
        <SideNavLink href="/agenda" icon={CalendarDays} label="Agenda" />
        <SideNavLink href="/investimentos" icon={LineChart} label="Investimentos" />
        <SideNavLink href="/relatorios" icon={FileText} label="Relatórios" soon />
        <SideNavLink href="/indicacoes" icon={Gift} label="Rewards" soon />
      </nav>

      <div className="shrink-0 px-4 pb-4 flex flex-col gap-2">
        <SideNavLink href="/configuracoes" icon={Settings} label="Configurações" />

        {/* Identidade e saída juntas: é onde o usuário procura por "sair". */}
        <div className="mt-2 pt-4 border-t border-white/10 flex items-center gap-3 px-2">
          <Avatar src={avatarUrl} nome={user?.nome ?? null} size={40} />

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
