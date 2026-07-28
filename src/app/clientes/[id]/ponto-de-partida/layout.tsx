import { TabLink } from "@/components/layout/TabLink";

function getTabs(id: string) {
  return [
    { href: `/clientes/${id}/ponto-de-partida`, label: "Visão Geral" },
    { href: `/clientes/${id}/ponto-de-partida/cadastro`, label: "Cadastro" },
    { href: `/clientes/${id}/ponto-de-partida/fluxo-de-caixa`, label: "Fluxo de Caixa" },
    { href: `/clientes/${id}/ponto-de-partida/patrimonio`, label: "Patrimônio" },
    { href: `/clientes/${id}/ponto-de-partida/objetivos`, label: "Objetivos" },
    { href: `/clientes/${id}/ponto-de-partida/linha-do-tempo`, label: "Mudanças" },
  ];
}

export default async function PontoDePartidaLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <>
      <header className="p-8 pb-0 shrink-0 bg-white border-b border-slate-200 shadow-sm z-0 flex flex-col">
        {/* Mesmo wordmark simplificado da tela de login, em tom claro — só a
            marca, sem o painel inteiro. Valor estético, não informativo. */}
        <span className="font-outfit font-medium text-sm tracking-tight lowercase text-slate-400 mb-2">
          hfc <span className="text-brand-600">hub</span>
        </span>

        <h1 className="font-poppins font-medium text-2xl text-brand-950">Ponto de Partida</h1>

        {/* Abas Horizontais */}
        <div className="mt-6 flex gap-8">
          {getTabs(id).map((tab) => (
            <TabLink key={tab.href} href={tab.href} label={tab.label} />
          ))}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-8 relative">
        {children}
      </div>
    </>
  );
}
