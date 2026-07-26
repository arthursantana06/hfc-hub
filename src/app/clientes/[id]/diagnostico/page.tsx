"use client";

import { useState } from "react";
import {
  Target,
  CheckCircle2,
  LineChart,
  TrendingUp,
  Copy,
  Wallet,
  Landmark,
  CalendarClock,
  Sliders,
  X
} from "lucide-react";

export default function Diagnostico() {
  const [modalAtivo, setModalAtivo] = useState<string | null>(null);

  // Helper to render modal titles
  const getModalTitle = () => {
    switch (modalAtivo) {
      case 'fluxo': return "Atualizar Fluxo de Caixa - Mar/2026";
      case 'patrimonio': return "Atualizar Patrimônio - Mar/2026";
      case 'objetivos': return "Atualizar Objetivos - Mar/2026";
      case 'linhaTempo': return "Atualizar Linha do Tempo - Mar/2026";
      case 'metas': return "Ajustar Metas e Tetos - Mar/2026";
      default: return "";
    }
  };

  return (
    <>
      {/* Header */}
        <header className="p-8 pb-6 shrink-0 bg-white border-b border-slate-200 shadow-sm z-0 flex flex-col">
          <div className="flex justify-between items-center w-full">
            <h1 className="font-poppins font-medium text-2xl text-brand-950">Diagnóstico Mensal</h1>
            <select 
              defaultValue="marco_2026"
              className="border border-slate-300 rounded-lg py-2 px-4 outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-300 transition-all bg-white shadow-sm font-medium text-brand-950"
            >
              <option value="janeiro_2026">Janeiro / 2026</option>
              <option value="fevereiro_2026">Fevereiro / 2026</option>
              <option value="marco_2026">Março / 2026</option>
              <option value="abril_2026">Abril / 2026</option>
            </select>
          </div>
        </header>

        {/* Conteúdo Dinâmico */}
        <div className="flex-1 overflow-y-auto p-8 relative">
          <div className="max-w-7xl mx-auto flex flex-col">
            
            {/* CARDS DE AÇÃO (ATUALIZAÇÃO MENSAL) */}
            <h2 className="font-poppins text-lg text-brand-950 mb-4 font-medium">Atualização de Dados do Mês</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-8">
              <div 
                onClick={() => setModalAtivo('fluxo')}
                className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center gap-2 hover:border-brand-600 hover:shadow-md transition-all cursor-pointer text-center group"
              >
                <div className="p-2 bg-slate-50 group-hover:bg-brand-300/10 rounded-full text-slate-500 group-hover:text-brand-600 transition-colors">
                  <Wallet className="w-5 h-5" />
                </div>
                <span className="font-inter text-sm font-medium text-brand-950">Fluxo de Caixa</span>
              </div>
              
              <div 
                onClick={() => setModalAtivo('patrimonio')}
                className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center gap-2 hover:border-brand-600 hover:shadow-md transition-all cursor-pointer text-center group"
              >
                <div className="p-2 bg-slate-50 group-hover:bg-brand-300/10 rounded-full text-slate-500 group-hover:text-brand-600 transition-colors">
                  <Landmark className="w-5 h-5" />
                </div>
                <span className="font-inter text-sm font-medium text-brand-950">Patrimônio</span>
              </div>
              
              <div 
                onClick={() => setModalAtivo('objetivos')}
                className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center gap-2 hover:border-brand-600 hover:shadow-md transition-all cursor-pointer text-center group"
              >
                <div className="p-2 bg-slate-50 group-hover:bg-brand-300/10 rounded-full text-slate-500 group-hover:text-brand-600 transition-colors">
                  <Target className="w-5 h-5" />
                </div>
                <span className="font-inter text-sm font-medium text-brand-950">Objetivos</span>
              </div>
              
              <div 
                onClick={() => setModalAtivo('linhaTempo')}
                className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center gap-2 hover:border-brand-600 hover:shadow-md transition-all cursor-pointer text-center group"
              >
                <div className="p-2 bg-slate-50 group-hover:bg-brand-300/10 rounded-full text-slate-500 group-hover:text-brand-600 transition-colors">
                  <CalendarClock className="w-5 h-5" />
                </div>
                <span className="font-inter text-sm font-medium text-brand-950">Linha do Tempo</span>
              </div>
              
              <div 
                onClick={() => setModalAtivo('metas')}
                className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center gap-2 hover:border-brand-600 hover:shadow-md transition-all cursor-pointer text-center group col-span-2 lg:col-span-4 xl:col-span-1"
              >
                <div className="p-2 bg-slate-50 group-hover:bg-brand-300/10 rounded-full text-slate-500 group-hover:text-brand-600 transition-colors">
                  <Sliders className="w-5 h-5" />
                </div>
                <span className="font-inter text-sm font-medium text-brand-950">Ajustar Metas</span>
              </div>
            </div>

            {/* DASHBOARD DE RESULTADOS (SOMENTE LEITURA) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Card 1: Receitas */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-poppins text-lg text-brand-950 font-medium flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-emerald-600" /> Receitas
                  </h3>
                  <span className="bg-emerald-100 text-emerald-700 text-xs px-2 py-1 rounded-full font-medium">
                    Batida
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-4 mt-auto bg-slate-50 rounded-lg p-4">
                  <div>
                    <span className="block text-xs text-slate-500 mb-1">Ponto de Partida</span>
                    <span className="block font-inter font-medium text-slate-700">R$ 40.000</span>
                  </div>
                  <div className="border-l border-slate-200 pl-4">
                    <span className="block text-xs text-slate-500 mb-1">Meta do Mês</span>
                    <span className="block font-inter font-medium text-slate-700">R$ 49.000</span>
                  </div>
                  <div className="border-l border-slate-200 pl-4">
                    <span className="block text-xs font-semibold text-brand-950 mb-1">Mês Atual</span>
                    <span className="block font-poppins text-xl font-bold text-emerald-600">R$ 49.300</span>
                  </div>
                </div>
              </div>

              {/* Card 2: Custo de Vida */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-poppins text-lg text-brand-950 font-medium flex items-center gap-2">
                    <Target className="w-5 h-5 text-brand-600" /> Custo de Vida
                  </h3>
                  <span className="bg-emerald-100 text-emerald-700 text-xs px-2 py-1 rounded-full font-medium">
                    Dentro do Teto
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-4 mt-auto bg-slate-50 rounded-lg p-4">
                  <div>
                    <span className="block text-xs text-slate-500 mb-1">Ponto de Partida</span>
                    <span className="block font-inter font-medium text-slate-700">R$ 45.000</span>
                  </div>
                  <div className="border-l border-slate-200 pl-4">
                    <span className="block text-xs text-slate-500 mb-1">Meta (Teto)</span>
                    <span className="block font-inter font-medium text-slate-700">R$ 46.000</span>
                  </div>
                  <div className="border-l border-slate-200 pl-4">
                    <span className="block text-xs font-semibold text-brand-950 mb-1">Mês Atual</span>
                    <span className="block font-poppins text-xl font-bold text-emerald-600">R$ 42.024</span>
                  </div>
                </div>
              </div>

              {/* Card 3: Dívidas */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-poppins text-lg text-brand-950 font-medium flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" /> Dívidas
                  </h3>
                  <span className="bg-emerald-100 text-emerald-700 text-xs px-2 py-1 rounded-full font-medium">
                    Quitado
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-4 mt-auto bg-slate-50 rounded-lg p-4">
                  <div>
                    <span className="block text-xs text-slate-500 mb-1">Ponto de Partida</span>
                    <span className="block font-inter font-medium text-slate-700">R$ 5.000</span>
                  </div>
                  <div className="border-l border-slate-200 pl-4">
                    <span className="block text-xs text-slate-500 mb-1">Meta</span>
                    <span className="block font-inter font-medium text-slate-700">R$ 0</span>
                  </div>
                  <div className="border-l border-slate-200 pl-4">
                    <span className="block text-xs font-semibold text-brand-950 mb-1">Mês Atual</span>
                    <span className="block font-poppins text-xl font-bold text-emerald-600">R$ 0</span>
                  </div>
                </div>
              </div>

              {/* Card 4: Investimentos */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-poppins text-lg text-brand-950 font-medium flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-amber-500" /> Investimentos
                  </h3>
                  <span className="bg-amber-100 text-amber-700 text-xs px-2 py-1 rounded-full font-medium">
                    Abaixo da Meta
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-4 mt-auto bg-slate-50 rounded-lg p-4">
                  <div>
                    <span className="block text-xs text-slate-500 mb-1">Ponto de Partida</span>
                    <span className="block font-inter font-medium text-slate-700">R$ 0</span>
                  </div>
                  <div className="border-l border-slate-200 pl-4">
                    <span className="block text-xs text-slate-500 mb-1">Meta</span>
                    <span className="block font-inter font-medium text-slate-700">R$ 26.600</span>
                  </div>
                  <div className="border-l border-slate-200 pl-4">
                    <span className="block text-xs font-semibold text-brand-950 mb-1">Mês Atual</span>
                    <span className="block font-poppins text-xl font-bold text-amber-500">R$ 24.000</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Gráficos (Mocks Visuais) */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-6">
              {/* Evolução das Sobras Mensais */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col">
                <h3 className="font-poppins font-medium text-lg text-brand-950 mb-4">Evolução das Sobras Mensais</h3>
                <div className="h-64 bg-slate-50 rounded-lg flex items-center justify-center border border-dashed border-slate-200">
                  <LineChart className="w-16 h-16 text-slate-300" strokeWidth={1} />
                </div>
              </div>

              {/* Crescimento dos Investimentos */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col">
                <h3 className="font-poppins font-medium text-lg text-brand-950 mb-4">Crescimento dos Investimentos</h3>
                <div className="h-64 bg-slate-50 rounded-lg flex items-center justify-center border border-dashed border-slate-200">
                  <TrendingUp className="w-16 h-16 text-slate-300" strokeWidth={1} />
                </div>
              </div>
            </div>

            {/* Direcionamentos e Próximos Passos */}
            <div className="mt-6 bg-brand-950 text-white rounded-xl p-8 shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
                <Target className="w-48 h-48" />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                {/* Observações do Mês */}
                <div>
                  <h3 className="font-poppins text-xl font-medium mb-4 flex items-center gap-2">
                    <span className="w-2 h-6 bg-brand-300 rounded-full inline-block"></span>
                    Observações do Mês
                  </h3>
                  <p className="font-inter text-sm text-slate-200 leading-relaxed">
                    Neste mês de Março, notamos uma excelente contenção nos custos de vida, operando 9% abaixo do teto estabelecido. Isso permitiu que as sobras disparassem muito além da meta de R$ 2.400, alcançando mais de R$ 7.200. Os aportes de investimentos chegaram próximos à meta, mostrando forte disciplina. Manter o nível de aportes consistente é o que garantirá o poder dos juros compostos para a aposentadoria.
                  </p>
                </div>

                {/* Plano de Ação */}
                <div>
                  <h3 className="font-poppins text-xl font-medium mb-4 flex items-center gap-2">
                    <span className="w-2 h-6 bg-emerald-400 rounded-full inline-block"></span>
                    Direcionamentos (Curto Prazo)
                  </h3>
                  <ul className="flex flex-col gap-3 font-inter text-sm text-slate-200">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                      <span>Construir reserva de R$ 20.000,00 em fundo de liquidez.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                      <span>Criar conta em corretora.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                      <span>Montar carteira de investimentos alinhada aos objetivos.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

          </div>
        </div>

      {/* MODAL DINÂMICO DE EDIÇÃO */}
      {modalAtivo && (
        <div className="fixed inset-0 z-50 bg-brand-950/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl flex flex-col max-h-[85vh] overflow-hidden">
            
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
              <h2 className="font-poppins font-semibold text-lg text-brand-950">
                {getModalTitle()}
              </h2>
              <button 
                onClick={() => setModalAtivo(null)}
                className="text-slate-400 hover:text-brand-950 transition-colors p-2 rounded-full hover:bg-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 flex-1 overflow-y-auto bg-white font-inter">
              
              <button className="text-sm flex items-center gap-2 text-brand-600 hover:underline mb-6 font-medium">
                <Copy className="w-4 h-4"/> 
                Preencher com dados do Mês Anterior
              </button>

              {/* Renderização condicional do conteúdo do modal */}
              {modalAtivo === 'fluxo' && (
                <div className="flex flex-col gap-8">
                  
                  {/* Seção Custo de Vida */}
                  <div>
                    <h3 className="font-poppins font-medium text-brand-950 text-sm uppercase tracking-wider mb-3 border-b border-slate-100 pb-2">Custo de Vida</h3>
                    <div className="grid grid-cols-12 gap-4 text-xs font-medium text-slate-400 mb-2 px-2">
                      <div className="col-span-5">Descrição</div>
                      <div className="col-span-3 text-right">Valor Mês Anterior</div>
                      <div className="col-span-4 text-right">Valor Realizado (Mar/2026)</div>
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      <div className="grid grid-cols-12 gap-4 items-center p-2 rounded-lg hover:bg-slate-50 transition-colors">
                        <div className="col-span-5 font-medium text-slate-700 text-sm">Moradia</div>
                        <div className="col-span-3 text-right text-slate-500 text-sm">R$ 4.500,00</div>
                        <div className="col-span-4 text-right">
                          <div className="relative inline-block w-full max-w-[140px]">
                            <span className="absolute left-3 top-2 text-slate-400 text-sm">R$</span>
                            <input type="number" defaultValue={4500} className="w-full text-right border border-slate-200 rounded p-2 pl-8 text-sm focus:ring-2 focus:ring-brand-300 focus:border-brand-300 outline-none transition-all shadow-sm" />
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-12 gap-4 items-center p-2 rounded-lg hover:bg-slate-50 transition-colors">
                        <div className="col-span-5 font-medium text-slate-700 text-sm">Alimentação</div>
                        <div className="col-span-3 text-right text-slate-500 text-sm">R$ 2.100,00</div>
                        <div className="col-span-4 text-right">
                          <div className="relative inline-block w-full max-w-[140px]">
                            <span className="absolute left-3 top-2 text-slate-400 text-sm">R$</span>
                            <input type="number" defaultValue={2200} className="w-full text-right border border-slate-200 rounded p-2 pl-8 text-sm focus:ring-2 focus:ring-brand-300 focus:border-brand-300 outline-none transition-all shadow-sm" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Seção Dívidas */}
                  <div>
                    <h3 className="font-poppins font-medium text-brand-950 text-sm uppercase tracking-wider mb-3 border-b border-slate-100 pb-2">Dívidas</h3>
                    <div className="grid grid-cols-12 gap-4 text-xs font-medium text-slate-400 mb-2 px-2">
                      <div className="col-span-5">Descrição</div>
                      <div className="col-span-3 text-right">Valor Mês Anterior</div>
                      <div className="col-span-4 text-right">Valor Realizado (Mar/2026)</div>
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      <div className="grid grid-cols-12 gap-4 items-center p-2 rounded-lg hover:bg-slate-50 transition-colors">
                        <div className="col-span-5 font-medium text-slate-700 text-sm">Financiamento Veículo</div>
                        <div className="col-span-3 text-right text-slate-500 text-sm">R$ 1.500,00</div>
                        <div className="col-span-4 text-right">
                          <div className="relative inline-block w-full max-w-[140px]">
                            <span className="absolute left-3 top-2 text-slate-400 text-sm">R$</span>
                            <input type="number" defaultValue={1500} className="w-full text-right border border-slate-200 rounded p-2 pl-8 text-sm focus:ring-2 focus:ring-brand-300 focus:border-brand-300 outline-none transition-all shadow-sm" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Seção Investimentos */}
                  <div>
                    <h3 className="font-poppins font-medium text-brand-950 text-sm uppercase tracking-wider mb-3 border-b border-slate-100 pb-2">Investimentos (Aportes)</h3>
                    <div className="grid grid-cols-12 gap-4 text-xs font-medium text-slate-400 mb-2 px-2">
                      <div className="col-span-5">Descrição</div>
                      <div className="col-span-3 text-right">Valor Mês Anterior</div>
                      <div className="col-span-4 text-right">Valor Realizado (Mar/2026)</div>
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      <div className="grid grid-cols-12 gap-4 items-center p-2 rounded-lg hover:bg-slate-50 transition-colors">
                        <div className="col-span-5 font-medium text-slate-700 text-sm">Reserva de Emergência</div>
                        <div className="col-span-3 text-right text-slate-500 text-sm">R$ 1.000,00</div>
                        <div className="col-span-4 text-right">
                          <div className="relative inline-block w-full max-w-[140px]">
                            <span className="absolute left-3 top-2 text-slate-400 text-sm">R$</span>
                            <input type="number" defaultValue={1000} className="w-full text-right border border-slate-200 rounded p-2 pl-8 text-sm focus:ring-2 focus:ring-brand-300 focus:border-brand-300 outline-none transition-all shadow-sm" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                </div>
              )}

              {/* Seção Patrimônio */}
              {modalAtivo === 'patrimonio' && (
                <div className="flex flex-col gap-6">
                  <div>
                    <h3 className="font-poppins font-medium text-brand-950 text-sm uppercase tracking-wider mb-3 border-b border-slate-100 pb-2">Patrimônio</h3>
                    <div className="grid grid-cols-12 gap-4 text-xs font-medium text-slate-400 mb-2 px-2">
                      <div className="col-span-5">Ativo/Investimento</div>
                      <div className="col-span-3 text-right">Saldo Mês Anterior</div>
                      <div className="col-span-4 text-right">Saldo Atual (Mar/2026)</div>
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      <div className="grid grid-cols-12 gap-4 items-center p-2 rounded-lg hover:bg-slate-50 transition-colors">
                        <div className="col-span-5 font-medium text-slate-700 text-sm">CDB Banco Inter</div>
                        <div className="col-span-3 text-right text-slate-500 text-sm">R$ 22.500,00</div>
                        <div className="col-span-4 text-right">
                          <div className="relative inline-block w-full max-w-[140px]">
                            <span className="absolute left-3 top-2.5 text-slate-400 text-sm">R$</span>
                            <input type="number" defaultValue={24000} className="w-full text-right border border-slate-200 rounded-lg p-2 pl-8 text-sm focus:ring-2 focus:ring-brand-300 focus:border-brand-300 outline-none transition-all shadow-sm" />
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-12 gap-4 items-center p-2 rounded-lg hover:bg-slate-50 transition-colors">
                        <div className="col-span-5 font-medium text-slate-700 text-sm">Reserva de Emergência</div>
                        <div className="col-span-3 text-right text-slate-500 text-sm">R$ 15.000,00</div>
                        <div className="col-span-4 text-right">
                          <div className="relative inline-block w-full max-w-[140px]">
                            <span className="absolute left-3 top-2.5 text-slate-400 text-sm">R$</span>
                            <input type="number" defaultValue={15500} className="w-full text-right border border-slate-200 rounded-lg p-2 pl-8 text-sm focus:ring-2 focus:ring-brand-300 focus:border-brand-300 outline-none transition-all shadow-sm" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Seção Objetivos */}
              {modalAtivo === 'objetivos' && (
                <div className="flex flex-col gap-6">
                  <div>
                    <h3 className="font-poppins font-medium text-brand-950 text-sm uppercase tracking-wider mb-3 border-b border-slate-100 pb-2">Objetivos em Andamento</h3>
                    <div className="grid grid-cols-12 gap-4 text-xs font-medium text-slate-400 mb-2 px-2">
                      <div className="col-span-4">Objetivo</div>
                      <div className="col-span-2 text-center">Meta Total</div>
                      <div className="col-span-3 text-right">Acumulado Anterior</div>
                      <div className="col-span-3 text-right">Acumulado Atual</div>
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      <div className="grid grid-cols-12 gap-4 items-center p-2 rounded-lg hover:bg-slate-50 transition-colors">
                        <div className="col-span-4 font-medium text-slate-700 text-sm">Viagem Europa</div>
                        <div className="col-span-2 text-center text-slate-500 text-sm">R$ 45.000,00</div>
                        <div className="col-span-3 text-right text-slate-500 text-sm">R$ 12.000,00</div>
                        <div className="col-span-3 text-right">
                          <div className="relative inline-block w-full max-w-[130px]">
                            <span className="absolute left-3 top-2.5 text-slate-400 text-sm">R$</span>
                            <input type="number" defaultValue={13500} className="w-full text-right border border-slate-200 rounded-lg p-2 pl-8 text-sm focus:ring-2 focus:ring-brand-300 focus:border-brand-300 outline-none transition-all shadow-sm" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Seção Linha do Tempo */}
              {modalAtivo === 'linhaTempo' && (
                <div className="flex flex-col gap-6">
                  <div>
                    <h3 className="font-poppins font-medium text-brand-950 text-sm uppercase tracking-wider mb-3 border-b border-slate-100 pb-2">Eventos da Linha do Tempo</h3>
                    <p className="text-sm text-slate-500 mb-4 px-2">Confirme os eventos previstos para o mês selecionado.</p>
                    
                    <div className="flex flex-col gap-2">
                      <div className="grid grid-cols-12 gap-4 items-center p-3 rounded-lg border border-slate-100 bg-slate-50">
                        <div className="col-span-6 flex flex-col gap-1">
                          <span className="font-medium text-slate-700 text-sm">Troca de Smartphone</span>
                          <span className="text-xs text-amber-600 font-medium bg-amber-100 px-2 py-0.5 rounded-full w-fit">Vencimento neste mês</span>
                        </div>
                        <div className="col-span-2 text-center text-brand-950 font-medium text-sm">
                          R$ 5.000,00
                        </div>
                        <div className="col-span-4 text-right">
                          <select className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-brand-300 focus:border-brand-300 outline-none transition-all shadow-sm bg-white text-slate-700">
                            <option>Confirmar Gasto</option>
                            <option>Adiar para próximo mês</option>
                            <option>Cancelar</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Seção Ajustar Metas */}
              {modalAtivo === 'metas' && (
                <div className="flex flex-col gap-6">
                  <div>
                    <h3 className="font-poppins font-medium text-brand-950 text-sm uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Ajustar Tetos e Metas</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-2">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-slate-700">Meta de Receitas</label>
                        <div className="relative">
                          <span className="absolute left-3 top-2 text-slate-400 text-sm">R$</span>
                          <input type="number" defaultValue={49000} className="w-full border border-slate-200 rounded-lg p-2.5 pl-9 text-sm focus:ring-2 focus:ring-brand-300 focus:border-brand-300 outline-none transition-all shadow-sm bg-slate-50 focus:bg-white" />
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-slate-700">Teto de Custo de Vida</label>
                        <div className="relative">
                          <span className="absolute left-3 top-2 text-slate-400 text-sm">R$</span>
                          <input type="number" defaultValue={46000} className="w-full border border-slate-200 rounded-lg p-2.5 pl-9 text-sm focus:ring-2 focus:ring-brand-300 focus:border-brand-300 outline-none transition-all shadow-sm bg-slate-50 focus:bg-white" />
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-1.5 md:col-span-2">
                        <label className="text-sm font-medium text-slate-700">Meta de Investimentos</label>
                        <div className="relative">
                          <span className="absolute left-3 top-2 text-slate-400 text-sm">R$</span>
                          <input type="number" defaultValue={26600} className="w-full border border-slate-200 rounded-lg p-2.5 pl-9 text-sm focus:ring-2 focus:ring-brand-300 focus:border-brand-300 outline-none transition-all shadow-sm bg-slate-50 focus:bg-white" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 shrink-0">
              <button 
                onClick={() => setModalAtivo(null)}
                className="px-5 py-2.5 rounded-lg text-slate-600 font-medium hover:bg-slate-200 transition-colors text-sm"
              >
                Cancelar
              </button>
              <button 
                onClick={() => setModalAtivo(null)}
                className="px-5 py-2.5 rounded-lg bg-brand-600 hover:bg-brand-900 text-white font-medium transition-colors text-sm shadow-sm"
              >
                Salvar e Recalcular
              </button>
            </div>
            
          </div>
        </div>
      )}
    </>
  );
}
