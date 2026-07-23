"use client";

import { useState } from "react";
import { Plus, X, CalendarClock, TrendingUp } from "lucide-react";

export default function LinhaDoTempo() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [frequencia, setFrequencia] = useState("mensal");

  return (
    <>
      <div className="flex justify-end mb-6">
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-brand-600 hover:bg-brand-900 text-white px-4 py-2.5 rounded-lg transition-colors font-medium text-sm shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Novo Evento Futuro
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 max-w-7xl mx-auto">

        {/* Cartão 1: Projetos & Custos Futuros */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-slate-100 rounded-lg text-slate-600">
              <CalendarClock className="w-5 h-5" />
            </div>
            <h2 className="font-poppins text-lg text-brand-950 font-medium">Projetos & Custos Futuros</h2>
          </div>

          <div className="flex flex-col gap-2">
            {/* Mock 1 */}
            <div className="flex justify-between items-center py-3 border-b border-slate-50 last:border-none">
              <div>
                <h4 className="font-inter font-medium text-sm text-slate-700">Nascimento do Filho</h4>
                <p className="text-xs text-slate-500 mt-0.5">Início: Fev/2027 • Duração: 18 anos • Mensal</p>
              </div>
              <span className="font-inter text-sm font-medium text-red-600">R$ 4.000,00 / mês</span>
            </div>
            {/* Mock 2 */}
            <div className="flex justify-between items-center py-3 border-b border-slate-50 last:border-none">
              <div>
                <h4 className="font-inter font-medium text-sm text-slate-700">Troca de Smartphone</h4>
                <p className="text-xs text-slate-500 mt-0.5">Início: Out/2026 • Sem fim • A cada 3 anos</p>
              </div>
              <span className="font-inter text-sm font-medium text-red-600">R$ 5.000,00</span>
            </div>
          </div>
        </div>

        {/* Cartão 2: Projeções de Renda */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h2 className="font-poppins text-lg text-brand-950 font-medium">Projeções de Renda</h2>
          </div>

          <div className="flex flex-col gap-2">
            {/* Mock 1 */}
            <div className="flex justify-between items-center py-3 border-b border-slate-50 last:border-none">
              <div>
                <h4 className="font-inter font-medium text-sm text-slate-700">Promoção para Diretoria</h4>
                <p className="text-xs text-slate-500 mt-0.5">Início: Jan/2028 • Permanente</p>
              </div>
              <span className="font-inter text-sm font-medium text-emerald-600">+ R$ 12.000,00 / mês</span>
            </div>
            {/* Mock 2 */}
            <div className="flex justify-between items-center py-3 border-b border-slate-50 last:border-none">
              <div>
                <h4 className="font-inter font-medium text-sm text-slate-700">Aposentadoria (Fim do Salário)</h4>
                <p className="text-xs text-slate-500 mt-0.5">Início: Nov/2045</p>
              </div>
              <span className="font-inter text-sm font-medium text-red-600">- R$ 25.000,00 / mês</span>
            </div>
          </div>
        </div>

      </div>

      {/* MODAL DE EVENTO FUTURO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-brand-950/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">

            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
              <h2 className="font-poppins font-semibold text-lg text-brand-950">Novo Evento Futuro</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-brand-950 transition-colors p-2 rounded-full hover:bg-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 font-inter">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Natureza do Evento</label>
                  <select
                    defaultValue=""
                    className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-300 transition-all bg-white shadow-sm"
                  >
                    <option value="" disabled>Selecione...</option>
                    <option value="aumento_despesa">Aumento de Despesa/Novo Gasto</option>
                    <option value="reducao_despesa">Redução de Despesa</option>
                    <option value="aumento_renda">Aumento de Renda</option>
                    <option value="reducao_renda">Redução de Renda</option>
                  </select>
                </div>

                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Nome do Evento</label>
                  <input type="text" placeholder="Ex: Faculdade do Filho" className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-300 transition-all shadow-sm" />
                </div>

                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Valor Estimado (R$)</label>
                  <input type="number" placeholder="0.00" className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-300 transition-all font-poppins font-medium shadow-sm" />
                </div>

                <div className="col-span-1">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Início</label>
                  <input type="month" className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-300 transition-all shadow-sm" />
                </div>

                <div className="col-span-1">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Fim <span className="text-slate-400 font-normal">(Opcional)</span></label>
                  <input type="month" className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-300 transition-all shadow-sm" />
                </div>

                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Periodicidade</label>
                  <select
                    value={frequencia}
                    onChange={(e) => setFrequencia(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-300 transition-all bg-white shadow-sm"
                  >
                    <option value="unico">Único</option>
                    <option value="mensal">Mensal</option>
                    <option value="anual">Anual</option>
                    <option value="a_cada_x_anos">A cada X anos</option>
                  </select>
                </div>

                {frequencia === "a_cada_x_anos" && (
                  <div className="col-span-1 md:col-span-2 border-t border-slate-100 pt-4 mt-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Intervalo (em anos)</label>
                    <input type="number" placeholder="Ex: 3" className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-300 transition-all shadow-sm" />
                  </div>
                )}

              </div>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 shrink-0">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2.5 rounded-lg text-slate-600 font-medium hover:bg-slate-200 transition-colors text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2.5 rounded-lg bg-brand-600 hover:bg-brand-900 text-white font-medium transition-colors text-sm shadow-sm"
              >
                Salvar Evento
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
