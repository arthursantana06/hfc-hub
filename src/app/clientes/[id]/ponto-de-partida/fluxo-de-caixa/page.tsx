"use client";

import { useState } from "react";
import { Plus, X, Wallet, ShoppingCart, CreditCard, PiggyBank } from "lucide-react";

export default function FluxoDeCaixa() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tipoRecorrencia, setTipoRecorrencia] = useState("");

  return (
    <>
      <div className="flex justify-end mb-6">
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-brand-600 hover:bg-brand-900 text-white px-4 py-2.5 rounded-lg transition-colors font-medium text-sm shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Novo Registro
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 max-w-7xl mx-auto">

        {/* Cartão: Receitas */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                <Wallet className="w-5 h-5" />
              </div>
              <h2 className="font-poppins text-lg text-brand-950 font-medium">Receitas</h2>
            </div>
            <div className="font-poppins text-xl font-semibold text-emerald-600">
              R$ 15.000,00
            </div>
          </div>
          <div className="border-b border-slate-100 w-full mb-4"></div>

          <div className="flex flex-col">
            <div className="flex justify-between items-center py-3 border-b border-slate-50 last:border-none">
              <div>
                <h4 className="font-inter font-medium text-sm text-slate-700">Salário CLT</h4>
                <p className="text-xs text-slate-500 mt-0.5">Renda Fixa • Fixo Mensal</p>
              </div>
              <span className="font-inter text-sm text-slate-600">15.000,00</span>
            </div>
          </div>
        </div>

        {/* Cartão: Custo de Vida */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-50 rounded-lg text-red-600">
                <ShoppingCart className="w-5 h-5" />
              </div>
              <h2 className="font-poppins text-lg text-brand-950 font-medium">Custo de Vida</h2>
            </div>
            <div className="font-poppins text-xl font-semibold text-red-600">
              R$ 8.000,00
            </div>
          </div>
          <div className="border-b border-slate-100 w-full mb-4"></div>

          <div className="flex flex-col">
            <div className="flex justify-between items-center py-3 border-b border-slate-50 last:border-none">
              <div>
                <h4 className="font-inter font-medium text-sm text-slate-700">Aluguel + Condomínio</h4>
                <p className="text-xs text-slate-500 mt-0.5">Moradia • Fixo Mensal</p>
              </div>
              <span className="font-inter text-sm text-slate-600">4.500,00</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-slate-50 last:border-none">
              <div>
                <h4 className="font-inter font-medium text-sm text-slate-700">Supermercado</h4>
                <p className="text-xs text-slate-500 mt-0.5">Alimentação • Variável Mensal</p>
              </div>
              <span className="font-inter text-sm text-slate-600">3.500,00</span>
            </div>
          </div>
        </div>

        {/* Cartão: Dívidas */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-50 rounded-lg text-orange-600">
                <CreditCard className="w-5 h-5" />
              </div>
              <h2 className="font-poppins text-lg text-brand-950 font-medium">Dívidas</h2>
            </div>
            <div className="font-poppins text-xl font-semibold text-orange-600">
              R$ 2.000,00
            </div>
          </div>
          <div className="border-b border-slate-100 w-full mb-4"></div>

          <div className="flex flex-col">
            <div className="flex justify-between items-center py-3 border-b border-slate-50 last:border-none">
              <div>
                <h4 className="font-inter font-medium text-sm text-slate-700">Financiamento Veículo</h4>
                <p className="text-xs text-slate-500 mt-0.5">Transporte • 12/36 Parcelas</p>
              </div>
              <span className="font-inter text-sm text-slate-600">2.000,00</span>
            </div>
          </div>
        </div>

        {/* Cartão: Investimentos */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg text-brand-600">
                <PiggyBank className="w-5 h-5" />
              </div>
              <h2 className="font-poppins text-lg text-brand-950 font-medium">Investimentos</h2>
            </div>
            <div className="font-poppins text-xl font-semibold text-brand-600">
              R$ 3.000,00
            </div>
          </div>
          <div className="border-b border-slate-100 w-full mb-4"></div>

          <div className="flex flex-col">
            <div className="flex justify-between items-center py-3 border-b border-slate-50 last:border-none">
              <div>
                <h4 className="font-inter font-medium text-sm text-slate-700">Aporte Previdência PGBL</h4>
                <p className="text-xs text-slate-500 mt-0.5">Aposentadoria • Fixo Mensal</p>
              </div>
              <span className="font-inter text-sm text-slate-600">3.000,00</span>
            </div>
          </div>
        </div>

      </div>

      {/* MODAL DE REGISTRO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-brand-950/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">

            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
              <h2 className="font-poppins font-semibold text-lg text-brand-950">Novo Lançamento no Fluxo de Caixa</h2>
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
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Tipo de Lançamento</label>
                  <select className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-300 transition-all bg-white shadow-sm">
                    <option value="receita">Receita</option>
                    <option value="custo">Custo de Vida</option>
                    <option value="divida">Dívida</option>
                    <option value="investimento">Investimento</option>
                  </select>
                </div>

                <div className="col-span-1">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Descrição</label>
                  <input type="text" placeholder="Ex: Conta de Luz" className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-300 transition-all shadow-sm" />
                </div>

                <div className="col-span-1">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Subcategoria</label>
                  <select className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-300 transition-all bg-white shadow-sm">
                    <option value="">Selecione...</option>
                    <option value="moradia">Moradia</option>
                    <option value="alimentacao">Alimentação</option>
                    <option value="transporte">Transporte</option>
                    <option value="lazer">Lazer</option>
                  </select>
                </div>

                <div className="col-span-1">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Valor (R$)</label>
                  <input type="number" placeholder="0.00" className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-300 transition-all font-poppins font-medium shadow-sm" />
                </div>

                <div className="col-span-1">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Recorrência</label>
                  <select
                    value={tipoRecorrencia}
                    onChange={(e) => setTipoRecorrencia(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-300 transition-all bg-white shadow-sm"
                  >
                    <option value="" disabled>Selecione...</option>
                    <option value="Fixo Mensal">Fixo Mensal</option>
                    <option value="Tempo Determinado">Tempo Determinado</option>
                    <option value="Periódico">Periódico</option>
                    <option value="Único">Único</option>
                  </select>
                </div>

                {/* Campos Condicionais */}
                {tipoRecorrencia === "Tempo Determinado" && (
                  <>
                    <div className="col-span-1 border-t border-slate-100 pt-5 mt-1">
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Mês/Ano Início</label>
                      <input type="month" className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-300 transition-all shadow-sm" />
                    </div>
                    <div className="col-span-1 border-t border-slate-100 pt-5 mt-1">
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Total de Parcelas</label>
                      <input type="number" placeholder="Ex: 36" className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-300 transition-all shadow-sm" />
                    </div>
                  </>
                )}

                {tipoRecorrencia === 'Periódico' && (
                  <div className="col-span-1 md:col-span-2 border-t border-slate-100 pt-4 mt-1">
                    <div className="flex flex-col gap-1 w-full max-w-sm">
                      <label className="font-inter text-sm text-slate-700">Frequência</label>
                      <select defaultValue="" className="border border-slate-200 rounded-lg py-2 px-3 font-inter text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-300 bg-white transition-shadow">
                        <option value="" disabled>Selecione o intervalo...</option>
                        <option value="bimestral">Bimestral (a cada 2 meses)</option>
                        <option value="trimestral">Trimestral (a cada 3 meses)</option>
                        <option value="semestral">Semestral (a cada 6 meses)</option>
                        <option value="anual">Anual (1x ao ano)</option>
                      </select>
                    </div>
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
                Salvar Registro
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
