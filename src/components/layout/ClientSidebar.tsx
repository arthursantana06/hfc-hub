"use client";

import Link from "next/link";
import { ArrowLeft, LayoutDashboard, Compass, Target, Gift, FileText, Calculator } from "lucide-react";
import { PLAN_STATUS_LABEL, type Client } from "@/lib/types";
import { Avatar } from "@/components/ui/Avatar";
import { SideNavLink } from "./SideNavLink";
import { Logo } from "./Logo";

export function ClientSidebar({ client }: { client: Client }) {
  return (
    <aside className="w-64 bg-brand-900 flex flex-col shrink-0 shadow-lg z-10">
      <Link
        href="/"
        className="group shrink-0 flex items-center gap-3 px-6 py-5 border-b border-white/10 hover:bg-brand-600/20 transition-colors"
      >
        <div className="flex items-center justify-center h-11 w-11 rounded-xl bg-white/10 ring-1 ring-inset ring-white/10 group-hover:bg-white/15 group-hover:ring-white/20 transition-colors">
          <Logo tone="light" size="sm" className="h-7 w-7" />
        </div>
        <div className="flex flex-col leading-tight">
          <span className="font-poppins font-medium text-white text-lg">Hub</span>
          <span className="font-inter text-[10px] uppercase tracking-wider text-brand-300/70">
            HFC Consultoria
          </span>
        </div>
      </Link>

      <div className="p-6 pb-2 shrink-0">
        <Link href="/clientes" className="flex items-center gap-2 text-sm text-brand-300 hover:text-white mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4"/>
          Voltar para Clientes
        </Link>

        <div className="flex flex-col items-center text-center">
          <Avatar
            src={client.avatarUrl}
            nome={client.nome}
            size={80}
            className="mb-4 shadow-sm ring-2 ring-brand-300"
          />
          <h2 className="font-poppins text-xl font-medium text-white mb-2">{client.nome}</h2>
          <span className="bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full text-xs font-medium border border-emerald-500/30">
            {PLAN_STATUS_LABEL[client.planoStatus]}
          </span>
        </div>
      </div>

      {/* Mesmo wordmark simplificado da tela de login — só a marca, sem o
          painel inteiro. Valor estético, acima das abas do menu do cliente. */}
      <div className="px-6 pt-2 shrink-0">
        <span className="font-outfit font-medium text-sm tracking-tight lowercase text-brand-300/70">
          hfc <span className="text-brand-300">hub</span>
        </span>
      </div>

      <nav className="flex-1 px-4 mt-4 flex flex-col gap-2 overflow-y-auto">
        <SideNavLink href={`/clientes/${client.id}`} icon={LayoutDashboard} label="Dashboard Resumo" exact />
        <SideNavLink href={`/clientes/${client.id}/ponto-de-partida`} icon={Compass} label="Ponto de Partida" />
        <SideNavLink href={`/clientes/${client.id}/diagnostico`} icon={Target} label="Diagnóstico & Metas" />
        <SideNavLink href={`/clientes/${client.id}/indicacoes`} icon={Gift} label="Rewards" soon />
        <SideNavLink href={`/clientes/${client.id}/relatorios`} icon={FileText} label="Relatórios" soon />
        <SideNavLink
          href={`/clientes/${client.id}/simuladores`}
          icon={Calculator}
          label="Simuladores"
          soon
        />
      </nav>
    </aside>
  );
}
