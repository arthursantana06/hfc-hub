"use client";

import { useState } from "react";
import { Plus, X, Plane, Shield } from "lucide-react";
import { ProgressBar } from "@/components/ui/ProgressBar";

export default function Objetivos() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div className="flex justify-end mb-6">
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-brand-600 hover:bg-brand-900 text-white px-4 py-2.5 rounded-lg transition-colors font-medium text-sm shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Novo Objetivo
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 max-w-7xl mx-auto">

        {/* Cartão 1: Estilo de Vida & Aquisições */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
              <Plane className="w-5 h-5" />
            </div>
            <h2 className="font-poppins text-lg text-brand-950 font-medium">Estilo de Vida & Aquisições</h2>
          </div>

          <div className="flex flex-col gap-6">
            {/* Viagem Europa */}
            <div>
              <div className="flex justify-between items-end mb-2">
                <h4 className="font-inter font-medium text-sm text-slate-700">Viagem Europa</h4>
                <span className="text-xs text-slate-400 font-medium">Dez/2026</span>
              </div>
              <div className="mb-2"><ProgressBar value={45} /></div>
              <div className="flex justify-start">
                <span className="font-inter text-xs text-slate-500 font-medium">R$ 45.000 de R$ 100.000</span>
              </div>
            </div>

            {/* Troca de Carro */}
            <div>
              <div className="flex justify-between items-end mb-2">
                <h4 className="font-inter font-medium text-sm text-slate-700">Troca de Carro</h4>
                <span className="text-xs text-slate-400 font-medium">Mar/2027</span>
              </div>
              <div className="mb-2"><ProgressBar value={20} /></div>
              <div className="flex justify-start">
                <span className="font-inter text-xs text-slate-500 font-medium">R$ 24.000 de R$ 120.000</span>
              </div>
            </div>

            {/* Casamento */}
            <div>
              <div className="flex justify-between items-end mb-2">
                <h4 className="font-inter font-medium text-sm text-slate-700">Casamento</h4>
                <span className="text-xs text-slate-400 font-medium">Nov/2028</span>
              </div>
              <div className="mb-2"><ProgressBar value={70} /></div>
              <div className="flex justify-start">
                <span className="font-inter text-xs text-slate-500 font-medium">R$ 70.000 de R$ 100.000</span>
              </div>
            </div>
          </div>
        </div>

        {/* Cartão 2: Segurança & Liberdade */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
              <Shield className="w-5 h-5" />
            </div>
            <h2 className="font-poppins text-lg text-brand-950 font-medium">Segurança & Liberdade</h2>
          </div>

          <div className="flex flex-col gap-6">
            {/* Reserva de Emergência */}
            <div>
              <div className="flex justify-between items-end mb-2">
                <h4 className="font-inter font-medium text-sm text-slate-700">Reserva de Emergência</h4>
                <span className="text-xs text-slate-400 font-medium">Fev/2027</span>
              </div>
              <div className="mb-2"><ProgressBar value={80} /></div>
              <div className="flex justify-start">
                <span className="font-inter text-xs text-slate-500 font-medium">R$ 48.000 de R$ 60.000</span>
              </div>
            </div>

            {/* Aposentadoria / Independência */}
            <div>
              <div className="flex justify-between items-end mb-2">
                <h4 className="font-inter font-medium text-sm text-slate-700">Aposentadoria / Independência</h4>
                <span className="text-xs text-slate-400 font-medium">Jan/2050</span>
              </div>
              <div className="mb-2"><ProgressBar value={15} /></div>
              <div className="flex justify-start">
                <span className="font-inter text-xs text-slate-500 font-medium">R$ 300.000 de R$ 2.000.000</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* MODAL DE REGISTRO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-brand-950/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">

            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
              <h2 className="font-poppins font-semibold text-lg text-brand-950">Novo Objetivo Financeiro</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-brand-950 transition-colors p-2 rounded-full hover:bg-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 font-inter">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Categoria</label>
                  <select
                    defaultValue=""
                    className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-300 transition-all bg-white shadow-sm"
                  >
                    <option value="" disabled>Selecione...</option>
                    <option value="estilo_vida">Estilo de Vida (Viagem, Casamento, etc)</option>
                    <option value="aquisicao">Aquisição (Imóvel, Veículo)</option>
                    <option value="seguranca">Segurança (Reserva)</option>
                    <option value="independencia">Independência Financeira (Aposentadoria)</option>
                  </select>
                </div>

                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Nome do Objetivo</label>
                  <input type="text" placeholder="Ex: Viagem para Itália" className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-300 transition-all shadow-sm" />
                </div>

                <div className="col-span-1">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Valor Alvo (R$)</label>
                  <input type="number" placeholder="0.00" className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-300 transition-all font-poppins font-medium shadow-sm" />
                </div>

                <div className="col-span-1">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Valor Já Acumulado (R$)</label>
                  <input type="number" placeholder="0.00" className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-300 transition-all font-poppins font-medium shadow-sm" />
                </div>

                <div className="col-span-1">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Prazo / Data Alvo</label>
                  <input type="month" className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-300 transition-all shadow-sm" />
                </div>

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
                Salvar Objetivo
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
