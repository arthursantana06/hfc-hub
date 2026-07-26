import { CheckCircle2, Circle, TrendingUp, PieChart } from "lucide-react";
import { ProgressBar } from "@/components/ui/ProgressBar";

export default function ClientDashboard() {
  return (
    <>
      {/* Header */}
      <header className="p-8 pb-6 shrink-0 flex justify-between items-end border-b border-slate-200/60 bg-white shadow-sm z-0">
        <div>
          <h1 className="font-poppins font-medium text-2xl text-brand-950">Resumo do Planejamento</h1>
        </div>
        <div className="text-sm text-slate-500 font-medium">
          Última atualização: 13 de Julho, 2026
        </div>
      </header>

      {/* Conteúdo */}
      <div className="flex-1 overflow-y-auto p-8">

        {/* Linha 1: KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between">
            <h3 className="font-inter text-sm text-slate-500 mb-3">Patrimônio Líquido</h3>
            <div className="font-poppins text-2xl text-brand-950 font-bold">R$ 1.245.000</div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between">
            <h3 className="font-inter text-sm text-slate-500 mb-3">Liquidez Imediata</h3>
            <div className="font-poppins text-2xl text-brand-950 font-bold">R$ 150.000</div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between">
            <h3 className="font-inter text-sm text-slate-500 mb-3">Capacidade de Poupança</h3>
            <div className="font-poppins text-2xl text-brand-950 font-bold">R$ 4.500 <span className="text-sm font-medium text-slate-400">/ mês</span></div>
          </div>
        </div>

        {/* Linha 2: Painéis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">

          {/* Painel Esquerdo: Alocação Atual */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 bg-blue-50 rounded-lg text-brand-600">
                <PieChart className="w-5 h-5" />
              </div>
              <h2 className="font-poppins font-medium text-lg text-brand-950">Alocação Atual</h2>
            </div>

            <div className="flex flex-col gap-6">
              <div>
                <div className="flex justify-between text-sm font-medium mb-2.5">
                  <span className="text-brand-950">Renda Fixa</span>
                  <span className="text-slate-500">60%</span>
                </div>
                <ProgressBar value={60} colorClassName="bg-brand-950" />
              </div>

              <div>
                <div className="flex justify-between text-sm font-medium mb-2.5">
                  <span className="text-brand-950">Renda Variável</span>
                  <span className="text-slate-500">30%</span>
                </div>
                <ProgressBar value={30} colorClassName="bg-brand-600" />
              </div>

              <div>
                <div className="flex justify-between text-sm font-medium mb-2.5">
                  <span className="text-brand-950">Caixa / Liquidez</span>
                  <span className="text-slate-500">10%</span>
                </div>
                <ProgressBar value={10} colorClassName="bg-brand-300" />
              </div>
            </div>
          </div>

          {/* Painel Direito: Próximos Passos */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h2 className="font-poppins font-medium text-lg text-brand-950">Próximos Passos</h2>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex items-start gap-4 p-3 rounded-lg bg-emerald-50/50 border border-emerald-100 transition-colors cursor-pointer">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-brand-950 text-sm">Aguardando envio do IR</h4>
                  <p className="text-xs text-slate-500 mt-1">Cliente precisa enviar a declaração de 2025.</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-3 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-colors cursor-pointer">
                <Circle className="w-5 h-5 text-slate-300 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-brand-950 text-sm">Reunião de alinhamento</h4>
                  <p className="text-xs text-slate-500 mt-1">Agendar apresentação do diagnóstico inicial.</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-3 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-colors cursor-pointer">
                <Circle className="w-5 h-5 text-slate-300 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-brand-950 text-sm">Assinatura do termo</h4>
                  <p className="text-xs text-slate-500 mt-1">Formalizar o início do planejamento financeiro.</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
