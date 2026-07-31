"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeft,
  LayoutDashboard,
  Compass,
  LineChart,
  Gift,
  Calculator,
  SquarePen,
} from "lucide-react";
import type { Client } from "@/lib/types";
import { Avatar } from "@/components/ui/Avatar";
import { SideNavLink } from "./SideNavLink";

export function ClientSidebar({ client }: { client: Client }) {
  const pathname = usePathname();
  const cadastro = `/clientes/${client.id}/cadastro`;
  const noCadastro = pathname === cadastro;

  return (
    <aside className="w-64 bg-brand-900 flex flex-col shrink-0 shadow-lg z-10">
      {/* Wordmark simplificado, igual ao da tela de login — só o texto, sem
          o ícone da logo nem a legenda "HFC Consultoria". */}
      <Link
        href="/"
        className="shrink-0 flex items-center px-6 py-5 border-b border-white/10 hover:bg-brand-600/20 transition-colors"
      >
        <span className="font-outfit font-medium text-white text-2xl tracking-tight lowercase">
          hfc <span className="text-brand-300">hub</span>
        </span>
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

          {/* No lugar do antigo selo de status do plano — que era digitado à
              mão e envelhecia sozinho — o atalho para editar quem é a pessoa.
              É o que se quer clicar quando se está olhando para o nome dela. */}
          <Link
            href={cadastro}
            className={`inline-flex items-center gap-1.5 font-inter text-xs transition-colors ${
              noCadastro ? "text-white" : "text-brand-300 hover:text-white"
            }`}
          >
            <SquarePen className="w-3.5 h-3.5" />
            Cadastro
          </Link>
        </div>
      </div>

      <nav className="flex-1 px-4 mt-8 flex flex-col gap-2 overflow-y-auto">
        <SideNavLink href={`/clientes/${client.id}`} icon={LayoutDashboard} label="Dashboard" exact />
        <SideNavLink href={`/clientes/${client.id}/planejamento`} icon={Compass} label="Planejamento" />
        <SideNavLink href={`/clientes/${client.id}/acompanhamento`} icon={LineChart} label="Acompanhamento" />
        <SideNavLink href={`/clientes/${client.id}/indicacoes`} icon={Gift} label="Rewards" soon />
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
