import Link from "next/link";
import { Search, Plus } from "lucide-react";
import { clients, riskProfileStyles, formatCurrency } from "@/lib/mock-clients";
import { Page } from "@/components/layout/Page";

export default function ClientHub() {
  return (
    <Page
      title="Clientes"
      subtitle={`${clients.length} clientes na carteira`}
      actions={
        <>
          <div className="relative">
            <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar cliente..."
              className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-transparent text-slate-800 placeholder-slate-400 w-64 shadow-sm font-inter"
            />
          </div>

          <button
            className="bg-brand-600 hover:bg-brand-900 transition-colors text-white font-poppins font-medium px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Novo Cliente
          </button>
        </>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clients.map((client) => (
            <div key={client.id} className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 flex flex-col h-full hover:border-brand-300 transition-colors">

              {/* Topo do Card */}
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-slate-100 text-brand-950 flex items-center justify-center font-poppins font-semibold text-lg shrink-0">
                  {client.initials}
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="font-poppins font-medium text-lg text-brand-950 truncate">{client.name}</h2>
                  <p className="font-inter text-sm text-slate-500 truncate">{client.email}</p>
                </div>
              </div>

              {/* Meio do Card (Info) */}
              <div className="flex flex-col gap-4 flex-1">
                <div className="flex flex-col items-start gap-1">
                  <span className="font-inter text-xs text-slate-500">Perfil de Risco</span>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${riskProfileStyles[client.riskProfile]}`}>
                    {client.riskProfile}
                  </span>
                </div>

                <div className="flex flex-col items-start gap-1 mt-2">
                  <span className="font-inter text-xs text-slate-500">Patrimônio</span>
                  <span className="font-poppins text-xl font-bold text-brand-950">
                    {formatCurrency(client.netWorth)}
                  </span>
                </div>
              </div>

              {/* Rodapé do Card */}
              <Link
                href={`/clientes/${client.id}`}
                className="block w-full text-center mt-6 bg-slate-50 hover:bg-brand-300/20 text-brand-600 border border-slate-200 rounded-lg py-2.5 font-medium transition-colors font-inter text-sm"
              >
                Acessar Painel
              </Link>

            </div>
          ))}
      </div>
    </Page>
  );
}
