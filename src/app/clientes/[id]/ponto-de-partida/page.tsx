import { Wallet, Landmark, Target, Flag, CalendarDays } from "lucide-react";
import { ProgressBar } from "@/components/ui/ProgressBar";

export default function PontoDePartida() {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 max-w-6xl">

      {/* Quadrante 1: Fluxo de Caixa */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
            <Wallet className="w-5 h-5" />
          </div>
          <h2 className="font-poppins font-medium text-lg text-brand-950">Fluxo de Caixa Mensal</h2>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center p-3 rounded-lg bg-emerald-50/50 border border-emerald-100">
            <span className="font-inter text-sm text-slate-600 font-medium">Entradas Totais</span>
            <span className="font-poppins font-semibold text-emerald-600 text-lg">R$ 15.000</span>
          </div>

          <div className="flex flex-col gap-3 px-3">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <span className="font-inter text-sm text-slate-500">Custo de Vida</span>
              <span className="font-poppins font-medium text-brand-950">R$ 8.000</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <span className="font-inter text-sm text-slate-500">Dívidas (Parcelas)</span>
              <span className="font-poppins font-medium text-orange-600">R$ 2.000</span>
            </div>
            <div className="flex justify-between items-center pt-1">
              <span className="font-inter text-sm text-slate-500">Aportes/Investimentos</span>
              <span className="font-poppins font-medium text-brand-600">R$ 3.000</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quadrante 2: Patrimônio Líquido */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-50 rounded-lg text-brand-600">
            <Landmark className="w-5 h-5" />
          </div>
          <h2 className="font-poppins font-medium text-lg text-brand-950">Patrimônio Líquido</h2>
        </div>

        <div className="mb-8">
          <span className="font-inter text-sm text-slate-500 block mb-1">Total Consolidado</span>
          <span className="font-poppins text-3xl font-bold text-brand-950">R$ 1.245.000</span>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-auto">
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-100">
            <span className="font-inter text-xs text-slate-500 block mb-1">Total de Ativos</span>
            <span className="font-poppins font-semibold text-brand-950">R$ 1.450.000</span>
          </div>
          <div className="p-4 rounded-lg bg-red-50/30 border border-red-100/50">
            <span className="font-inter text-xs text-slate-500 block mb-1">Total de Passivos</span>
            <span className="font-poppins font-semibold text-red-600">R$ 205.000</span>
          </div>
        </div>
      </div>

      {/* Quadrante 3: Objetivos Principais */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
            <Target className="w-5 h-5" />
          </div>
          <h2 className="font-poppins font-medium text-lg text-brand-950">Objetivos Principais</h2>
        </div>

        <div className="flex flex-col gap-6 mt-2">
          <div>
            <div className="flex justify-between items-end mb-2">
              <span className="font-poppins font-medium text-sm text-brand-950">Independência Financeira</span>
              <span className="font-inter text-xs font-semibold text-brand-600">45%</span>
            </div>
            <ProgressBar value={45} colorClassName="bg-brand-600" />
            <span className="font-inter text-[10px] text-slate-400 mt-1.5 block">R$ 900.000 de R$ 2.000.000</span>
          </div>

          <div>
            <div className="flex justify-between items-end mb-2">
              <span className="font-poppins font-medium text-sm text-brand-950">Troca de Veículo</span>
              <span className="font-inter text-xs font-semibold text-brand-300">80%</span>
            </div>
            <ProgressBar value={80} colorClassName="bg-brand-300" />
            <span className="font-inter text-[10px] text-slate-400 mt-1.5 block">R$ 80.000 de R$ 100.000</span>
          </div>
        </div>
      </div>

      {/* Quadrante 4: Linha do Tempo */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-orange-50 rounded-lg text-orange-600">
            <CalendarDays className="w-5 h-5" />
          </div>
          <h2 className="font-poppins font-medium text-lg text-brand-950">Próximo Marco</h2>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-slate-50 rounded-xl border border-dashed border-slate-200">
          <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 mb-4">
            <Flag className="w-5 h-5" />
          </div>
          <h3 className="font-poppins font-medium text-brand-950 mb-2">Quitação do Financiamento Imobiliário</h3>
          <p className="font-inter text-sm text-slate-500">Novembro de 2026</p>
          <div className="mt-4 px-4 py-1.5 bg-white border border-slate-200 rounded-full text-xs font-semibold text-slate-600 shadow-sm">
            Faltam 4 meses
          </div>
        </div>
      </div>

    </div>
  );
}
