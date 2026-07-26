"use client";

import Link from "next/link";
import { ArrowLeft, LayoutDashboard, Compass, Target, Calculator, Download } from "lucide-react";
import type { Client } from "@/lib/types";
import { SideNavLink } from "./SideNavLink";
import { Logo } from "./Logo";

export function ClientSidebar({ client }: { client: Client }) {
  return (
    <aside className="w-64 bg-brand-900 flex flex-col shrink-0 shadow-lg z-10">
      <Link
        href="/"
        className="shrink-0 flex items-center gap-3 px-6 py-5 border-b border-white/10 hover:bg-brand-600/20 transition-colors"
      >
        <Logo tone="light" size="sm" className="h-9 w-9" />
        <span className="font-poppins font-medium text-white text-lg">Hub</span>
      </Link>

      <div className="p-6 pb-2 shrink-0">
        <Link href="/clientes" className="flex items-center gap-2 text-sm text-brand-300 hover:text-white mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4"/>
          Voltar para o Hub de Clientes
        </Link>

        <div className="flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-full bg-slate-100 text-brand-950 flex items-center justify-center font-poppins font-semibold text-3xl mb-4 shadow-sm border-2 border-brand-300">
            {client.initials}
          </div>
          <h2 className="font-poppins text-xl font-medium text-white mb-2">{client.name}</h2>
          <span className="bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full text-xs font-medium border border-emerald-500/30">
            {client.planStatus}
          </span>
        </div>
      </div>

      <nav className="flex-1 px-4 mt-8 flex flex-col gap-2 overflow-y-auto">
        <SideNavLink href={`/clientes/${client.id}`} icon={LayoutDashboard} label="Dashboard Resumo" exact />
        <SideNavLink href={`/clientes/${client.id}/ponto-de-partida`} icon={Compass} label="Ponto de Partida" />
        <SideNavLink href={`/clientes/${client.id}/diagnostico`} icon={Target} label="Diagnóstico & Metas" />
        <SideNavLink href="/simuladores" icon={Calculator} label="Simuladores" soon />
      </nav>

      <div className="p-6 mt-auto">
        <button className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors font-medium text-sm">
          <Download className="w-4 h-4" />
          Gerar Relatório PDF
        </button>
      </div>
    </aside>
  );
}
