"use client";

import { useState } from "react";
import {
  Search,
  Bell,
  TrendingUp,
  Target,
  CheckCircle,
  FileText,
  Edit,
  Users,
  X,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  ArrowLeft
} from "lucide-react";

export default function Dashboard() {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<number | null>(null);
  const [currentMonth, setCurrentMonth] = useState("Julho 2026");

  return (
    <>
      {/* Área Principal */}
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="flex justify-between items-center mb-8">
          <h1 className="font-poppins font-medium text-3xl text-brand-950">Visão Geral</h1>
          <div className="flex items-center gap-6">
            <div className="relative">
              <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input type="text" placeholder="Buscar cliente..." className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-transparent text-slate-800 placeholder-slate-400 w-64 shadow-sm font-inter" />
            </div>
            <button className="relative p-2 text-slate-400 hover:text-brand-950 transition-colors">
              <Bell className="w-6 h-6" />
              <span className="absolute top-1 right-1.5 w-2 h-2 bg-brand-600 rounded-full"></span>
            </button>
          </div>
        </header>

        {/* ESTRUTURA DO GRID */}
        <div className="flex flex-col gap-6">
          {/* LINHA 1: KPIs */}
          <div className="grid grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col justify-between h-36 min-w-0">
              <div>
                <h2 className="font-inter text-sm text-slate-500 mb-1">Patrimônio Gerenciado</h2>
                <div className="font-poppins text-2xl text-brand-950 font-semibold truncate" title="R$ 18.500.000">R$ 18.500.000</div>
              </div>
              <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md text-xs font-medium mt-auto self-start">
                <TrendingUp className="w-3 h-3" />
                <span>+5.2% no mês</span>
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col justify-between h-36 min-w-0">
              <div>
                <h2 className="font-inter text-sm text-slate-500 mb-1">Total de Clientes</h2>
                <div className="font-poppins text-2xl text-brand-950 font-semibold truncate" title="42">42</div>
              </div>
              <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md text-xs font-medium mt-auto self-start">
                <TrendingUp className="w-3 h-3" />
                <span>+3 ativos</span>
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col justify-between h-36 min-w-0">
              <div>
                <h2 className="font-inter text-sm text-slate-500 mb-1">Novos Clientes em Julho</h2>
                <div className="font-poppins text-2xl text-brand-950 font-semibold truncate" title="4">4</div>
              </div>
              <div className="flex items-center gap-1 text-slate-600 bg-slate-100 px-2 py-1 rounded-md text-xs font-medium mt-auto self-start">
                <Target className="w-3 h-3" />
                <span>Meta: 5</span>
              </div>
            </div>
          </div>

          {/* LINHA 2: Listas de Acompanhamento */}
          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col min-h-[360px]">
              <h2 className="font-poppins font-medium text-lg text-brand-950 mb-6">Últimas Atualizações</h2>
              <div className="flex flex-col flex-1 gap-2">
                {[
                  { icon: <CheckCircle className="w-4 h-4 text-brand-600" />, text: "Rebalanceamento da carteira de Carlos E. Silva concluído", time: "Há 2 horas" },
                  { icon: <FileText className="w-4 h-4 text-brand-600" />, text: "Novo relatório de performance gerado para Mariana Souza", time: "Há 5 horas" },
                  { icon: <Edit className="w-4 h-4 text-brand-600" />, text: "Perfil de risco de Roberto Almeida atualizado para Moderado", time: "Ontem" },
                  { icon: <Users className="w-4 h-4 text-brand-600" />, text: "Onboarding finalizado para a nova cliente Ana Beatriz", time: "Ontem" },
                  { icon: <TrendingUp className="w-4 h-4 text-brand-600" />, text: "Aporte financeiro recebido na conta de João Pedro", time: "Há 2 dias" },
                ].map((activity, i) => (
                  <div key={i} className="flex items-center justify-between py-3 px-3 hover:bg-slate-50 transition-colors rounded-lg group border border-transparent hover:border-slate-100">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-brand-300/10 rounded-full group-hover:bg-brand-300/20 transition-colors">{activity.icon}</div>
                      <span className="font-inter text-sm text-slate-700">{activity.text}</span>
                    </div>
                    <span className="font-inter text-xs text-slate-400 shrink-0">{activity.time}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="col-span-1 bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col min-h-[360px]">
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-poppins font-medium text-lg text-brand-950">Próximas Reuniões</h2>
                <div className="group relative cursor-pointer" onClick={() => setIsCalendarOpen(true)}>
                  <CalendarDays className="w-5 h-5 text-slate-400 group-hover:text-brand-950 transition-colors" />
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-brand-950 text-white text-xs rounded px-2 py-1.5 absolute top-full right-0 mt-2 whitespace-nowrap pointer-events-none z-10 shadow-lg">Acessar agenda</div>
                </div>
              </div>
              <div className="flex flex-col gap-5 flex-1">
                {[
                  { name: "Carlos E. Silva", time: "10:00", date: "Hoje" },
                  { name: "Mariana Souza", time: "14:30", date: "Hoje" },
                  { name: "Roberto Almeida", time: "09:00", date: "Amanhã" },
                ].map((meeting, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="flex flex-col items-center justify-center bg-slate-50 rounded-lg p-2 min-w-[4rem] border border-slate-100">
                      <span className="font-inter text-xs text-slate-500">{meeting.date}</span>
                      <span className="font-poppins font-medium text-brand-950 text-sm">{meeting.time}</span>
                    </div>
                    <div className="pt-1">
                      <h3 className="font-poppins font-medium text-brand-950 text-sm">{meeting.name}</h3>
                      <p className="font-inter text-sm text-slate-500">Revisão de Portfólio</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* MODAL DO CALENDÁRIO */}
      {isCalendarOpen && (
        <div className="fixed inset-0 z-50 bg-brand-950/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-5xl flex flex-col max-h-[90vh] overflow-hidden">

            <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-white shrink-0">
              <h2 className="font-poppins font-semibold text-xl text-brand-950">Agenda Completa</h2>
              <button onClick={() => setIsCalendarOpen(false)} className="p-2 text-slate-400 hover:text-brand-950 hover:bg-slate-50 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col md:flex-row">

              {/* Coluna Esquerda: O Calendário */}
              <div className="w-full md:w-2/3 p-6">
                <div className="flex items-center justify-between mb-4 px-2">
                  <button className="p-2 hover:bg-slate-100 rounded-full"><ChevronLeft className="w-5 h-5 text-slate-600" /></button>
                  <h3 className="font-poppins font-medium text-lg text-brand-950">{currentMonth}</h3>
                  <button className="p-2 hover:bg-slate-100 rounded-full"><ChevronRight className="w-5 h-5 text-slate-600" /></button>
                </div>

                <div className="grid grid-cols-7 gap-1 mb-2">
                  {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                    <div key={day} className="font-inter text-xs font-semibold text-slate-400 uppercase text-center py-1">{day}</div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-1">
                  <div className="min-h-[4.5rem]"></div>
                  <div className="min-h-[4.5rem]"></div>
                  <div className="min-h-[4.5rem]"></div>

                  {Array.from({ length: 31 }, (_, i) => i + 1).map(day => {
                    const isToday = day === 10;
                    const isSelected = day === selectedDate;

                    let events = [];
                    if (day === 3) events.push({ time: "09:00", name: "Ana Beatriz" });
                    if (day === 10) {
                      events.push({ time: "10:00", name: "Carlos" });
                      events.push({ time: "14:30", name: "Mariana" });
                    }
                    if (day === 15) events.push({ time: "11:00", name: "João" });
                    if (day === 22) events.push({ time: "16:00", name: "Roberto" });

                    return (
                      <button
                        key={day}
                        onClick={() => setSelectedDate(day)}
                        className={`min-h-[4.5rem] rounded-xl flex flex-col p-1.5 font-inter transition-all border ${isSelected ? 'border-2 border-brand-950 bg-slate-50 shadow-sm'
                          : isToday ? 'border-brand-600 bg-brand-600/5'
                            : 'border-slate-100 hover:border-brand-300 hover:bg-slate-50'
                          }`}
                      >
                        <span className={`w-6 h-6 flex items-center justify-center rounded-full mb-1 text-xs transition-colors ${isToday && !isSelected ? 'bg-brand-600 text-white font-medium shadow-sm'
                          : isSelected ? 'bg-brand-950 text-white font-medium'
                            : 'text-slate-700'
                          }`}>
                          {day}
                        </span>

                        <div className="flex flex-col gap-1 w-full overflow-hidden">
                          {events.map((ev, idx) => (
                            <div key={idx} className={`text-[9px] rounded px-1 py-0.5 truncate w-full text-left font-medium transition-colors ${isSelected ? 'bg-brand-950/10 text-brand-950' : 'bg-brand-300/20 text-brand-600'
                              }`}>
                              {ev.time} - {ev.name}
                            </div>
                          ))}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Coluna Direita: Sidebar da Agenda */}
              <div className="w-full md:w-1/3 flex flex-col h-full bg-slate-50 border-l border-slate-200 overflow-hidden shrink-0">

                <div className="p-6 border-b border-slate-200 bg-white shrink-0">
                  {selectedDate !== null ? (
                    <div className="mb-3">
                      <h3 className="font-poppins font-medium text-brand-950 text-lg mb-1">Agenda do dia {selectedDate}</h3>
                      <button onClick={() => setSelectedDate(null)} className="text-xs text-slate-500 hover:text-brand-600 underline flex items-center gap-1 transition-colors">
                        <ArrowLeft className="w-3 h-3" /> Voltar para visão geral
                      </button>
                    </div>
                  ) : (
                    <h3 className="font-poppins font-medium text-brand-950 text-lg mb-3">Próximos Eventos</h3>
                  )}
                  <button className="w-full bg-brand-600 text-white rounded-lg py-2 font-medium text-sm hover:bg-brand-900 transition-colors shadow-sm mt-1">
                    + Novo Evento
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                  {selectedDate === 10 ? (
                    <div className="flex flex-col gap-4">
                      {[
                        { name: "Carlos E. Silva", time: "10:00", type: "Revisão de Portfólio", active: true },
                        { name: "Mariana Souza", time: "14:30", type: "Apresentação de Relatório", active: false },
                      ].map((meeting, i) => (
                        <div key={i} className={`flex gap-4 p-4 rounded-xl border transition-all ${meeting.active ? 'bg-white shadow-sm border-slate-200' : 'bg-transparent border-transparent hover:bg-white hover:border-slate-200'}`}>
                          <div className="flex flex-col items-center">
                            <span className="font-poppins font-semibold text-brand-950">{meeting.time}</span>
                            <div className={`w-2 h-2 rounded-full mt-2 ${meeting.active ? 'bg-brand-600' : 'bg-slate-300'}`}></div>
                          </div>
                          <div>
                            <h4 className="font-poppins font-medium text-brand-950 text-sm">{meeting.name}</h4>
                            <p className="font-inter text-xs text-slate-500 mt-1">{meeting.type}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : selectedDate === null ? (
                    <div className="flex flex-col gap-6">
                      <h4 className="font-inter text-sm text-slate-500 font-medium border-b border-slate-200 pb-2">Próximos eventos em Julho</h4>

                      {/* Dia 10 */}
                      <div className="flex flex-col gap-4">
                        <div className="font-inter text-xs font-semibold text-brand-600 uppercase">10 de Julho</div>
                        {[
                          { name: "Carlos E. Silva", time: "10:00", type: "Revisão de Portfólio", active: false },
                          { name: "Mariana Souza", time: "14:30", type: "Apresentação de Relatório", active: false },
                        ].map((meeting, i) => (
                          <div key={i} className={`flex gap-4 p-3 rounded-xl border transition-all bg-transparent border-transparent hover:bg-white hover:border-slate-200 cursor-pointer`} onClick={() => setSelectedDate(10)}>
                            <div className="flex flex-col items-center">
                              <span className="font-poppins font-medium text-brand-950 text-sm">{meeting.time}</span>
                            </div>
                            <div>
                              <h4 className="font-poppins font-medium text-brand-950 text-sm">{meeting.name}</h4>
                              <p className="font-inter text-[11px] text-slate-500 mt-0.5">{meeting.type}</p>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Dia 15 */}
                      <div className="flex flex-col gap-3">
                        <div className="font-inter text-xs font-semibold text-brand-600 uppercase">15 de Julho</div>
                        <div className={`flex gap-4 p-3 rounded-xl border transition-all bg-transparent border-transparent hover:bg-white hover:border-slate-200 cursor-pointer`} onClick={() => setSelectedDate(15)}>
                          <div className="flex flex-col items-center">
                            <span className="font-poppins font-medium text-brand-950 text-sm">11:00</span>
                          </div>
                          <div>
                            <h4 className="font-poppins font-medium text-brand-950 text-sm">João Pedro</h4>
                            <p className="font-inter text-[11px] text-slate-500 mt-0.5">Alinhamento Mensal</p>
                          </div>
                        </div>
                      </div>

                    </div>
                  ) : (
                    <div className="text-slate-500 text-sm text-center mt-10">
                      Nenhum evento agendado para este dia
                    </div>
                  )}
                </div>

                {/* Footer Sidebar Agenda: Botão Google */}
                <div className="mt-auto p-6 border-t border-slate-200 bg-white shrink-0">
                  <button
                    onClick={() => {
                      // TODO: Implementar OAuth2 e Google Calendar API futuramente
                      console.log("Integração com Google Agenda acionada.");
                    }}
                    className="w-full flex items-center justify-center gap-3 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 rounded-lg transition-colors font-inter text-sm font-medium text-slate-700 shadow-sm"
                  >
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M22.56 12.25C22.56 11.47 22.49 10.72 22.36 10H12V14.26H17.92C17.67 15.63 16.89 16.8 15.72 17.58V20.34H19.29C21.37 18.42 22.56 15.6 22.56 12.25Z" fill="#4285F4" />
                      <path d="M12 23C14.97 23 17.46 22.02 19.29 20.34L15.72 17.58C14.73 18.25 13.48 18.64 12 18.64C9.13999 18.64 6.70999 16.71 5.83999 14.11H2.15997V16.96C3.96997 20.56 7.69 23 12 23Z" fill="#34A853" />
                      <path d="M5.84 14.11C5.61 13.44 5.49 12.73 5.49 12C5.49 11.27 5.61 10.56 5.84 9.89V7.04H2.16C1.42 8.52 1 10.2 1 12C1 13.8 1.42 15.48 2.16 16.96L5.84 14.11Z" fill="#FBBC05" />
                      <path d="M12 5.36C13.62 5.36 15.06 5.92 16.2 7.01L19.36 3.85C17.46 2.08 14.97 1 12 1C7.69 1 3.97 3.44 2.16 7.04L5.84 9.89C6.71 7.29 9.14 5.36 12 5.36Z" fill="#EA4335" />
                    </svg>
                    Sincronizar com Google
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </>
  );
}
