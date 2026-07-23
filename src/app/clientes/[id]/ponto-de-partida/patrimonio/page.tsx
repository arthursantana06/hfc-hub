"use client";

import { useState } from "react";
import { Plus, X, Home, TrendingUp, Wallet } from "lucide-react";

export default function Patrimonio() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [categoriaPatrimonio, setCategoriaPatrimonio] = useState("");

  return (
    <>
      <div className="flex justify-end mb-6">
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-brand-600 hover:bg-brand-900 text-white px-4 py-2.5 rounded-lg transition-colors font-medium text-sm shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Novo Patrimônio
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 max-w-7xl mx-auto">

        {/* Cartão 1: Bens Imobilizados */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-100 rounded-lg text-slate-600">
                <Home className="w-5 h-5" />
              </div>
              <h2 className="font-poppins text-lg text-brand-950 font-medium">Bens Imobilizados</h2>
            </div>
            <div className="font-poppins text-xl font-semibold text-brand-950">
              R$ 850.000,00
            </div>
          </div>
          <div className="border-b border-slate-100 w-full mb-4"></div>

          <div className="flex flex-col">
            <div className="flex justify-between items-center py-3 border-b border-slate-50 last:border-none">
              <div>
                <h4 className="font-inter font-medium text-sm text-slate-700">Apartamento (Residência)</h4>
                <p className="text-xs text-slate-500 mt-0.5">Imóvel Próprio</p>
              </div>
              <span className="font-inter text-sm text-slate-600">750.000,00</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-slate-50 last:border-none">
              <div>
                <h4 className="font-inter font-medium text-sm text-slate-700">Carro SUV</h4>
                <p className="text-xs text-slate-500 mt-0.5">Veículo</p>
              </div>
              <span className="font-inter text-sm text-slate-600">100.000,00</span>
            </div>
          </div>
        </div>

        {/* Cartão 2: Investimentos */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg text-brand-600">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h2 className="font-poppins text-lg text-brand-950 font-medium">Investimentos</h2>
            </div>
            <div className="font-poppins text-xl font-semibold text-brand-600">
              R$ 320.000,00
            </div>
          </div>
          <div className="border-b border-slate-100 w-full mb-4"></div>

          <div className="flex flex-col">
            <div className="flex justify-between items-center py-3 border-b border-slate-50 last:border-none">
              <div>
                <h4 className="font-inter font-medium text-sm text-slate-700">CDB Banco Inter</h4>
                <p className="text-xs text-slate-500 mt-0.5">Renda Fixa • Vencimento: 2028</p>
              </div>
              <span className="font-inter text-sm text-slate-600">120.000,00</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-slate-50 last:border-none">
              <div>
                <h4 className="font-inter font-medium text-sm text-slate-700">Carteira de Ações</h4>
                <p className="text-xs text-slate-500 mt-0.5">Renda Variável • Liquidez: D+2</p>
              </div>
              <span className="font-inter text-sm text-slate-600">200.000,00</span>
            </div>
          </div>
        </div>

        {/* Cartão 3: Saldos Bancários */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                <Wallet className="w-5 h-5" />
              </div>
              <h2 className="font-poppins text-lg text-brand-950 font-medium">Saldos Bancários</h2>
            </div>
            <div className="font-poppins text-xl font-semibold text-emerald-600">
              R$ 25.000,00
            </div>
          </div>
          <div className="border-b border-slate-100 w-full mb-4"></div>

          <div className="flex flex-col">
            <div className="flex justify-between items-center py-3 border-b border-slate-50 last:border-none">
              <div>
                <h4 className="font-inter font-medium text-sm text-slate-700">Conta Corrente</h4>
                <p className="text-xs text-slate-500 mt-0.5">Saldo Disponível</p>
              </div>
              <span className="font-inter text-sm text-slate-600">5.000,00</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-slate-50 last:border-none">
              <div>
                <h4 className="font-inter font-medium text-sm text-slate-700">Reserva de Emergência (Poupança)</h4>
                <p className="text-xs text-slate-500 mt-0.5">Liquidez: Imediata</p>
              </div>
              <span className="font-inter text-sm text-slate-600">20.000,00</span>
            </div>
          </div>
        </div>

      </div>

      {/* MODAL DE REGISTRO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-brand-950/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">

            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
              <h2 className="font-poppins font-semibold text-lg text-brand-950">Novo Patrimônio</h2>
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
                    value={categoriaPatrimonio}
                    onChange={(e) => setCategoriaPatrimonio(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-300 transition-all bg-white shadow-sm"
                  >
                    <option value="" disabled>Selecione...</option>
                    <option value="Bem Imobilizado">Bem Imobilizado</option>
                    <option value="Investimento">Investimento</option>
                    <option value="Saldo Bancário">Saldo Bancário</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>

                <div className="col-span-1">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Descrição</label>
                  <input type="text" placeholder="Ex: Tesouro Selic, Casa na Praia" className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-300 transition-all shadow-sm" />
                </div>

                <div className="col-span-1">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Valor Atual (R$)</label>
                  <input type="number" placeholder="0.00" className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-300 transition-all font-poppins font-medium shadow-sm" />
                </div>

                {/* Campos Condicionais (Investimento) */}
                {categoriaPatrimonio === "Investimento" && (
                  <>
                    <div className="col-span-1 border-t border-slate-100 pt-5 mt-1">
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Tipo de Investimento</label>
                      <select defaultValue="" className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-300 transition-all shadow-sm bg-white">
                        <option value="" disabled>Selecione...</option>
                        <option value="Renda Fixa">Renda Fixa</option>
                        <option value="Renda Variável">Renda Variável</option>
                        <option value="Fundos Imobiliários">Fundos Imobiliários</option>
                        <option value="Previdência">Previdência</option>
                        <option value="Criptomoedas">Criptomoedas</option>
                      </select>
                    </div>
                    <div className="col-span-1 border-t border-slate-100 pt-5 mt-1">
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Grau de Liquidez</label>
                      <select defaultValue="" className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-300 transition-all shadow-sm bg-white">
                        <option value="" disabled>Selecione...</option>
                        <option value="Imediata (D+0)">Imediata (D+0)</option>
                        <option value="Curto Prazo (D+1 a D+30)">Curto Prazo (D+1 a D+30)</option>
                        <option value="Médio/Longo Prazo">Médio/Longo Prazo</option>
                        <option value="Apenas no Vencimento">Apenas no Vencimento</option>
                      </select>
                    </div>
                  </>
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
                Salvar Patrimônio
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
