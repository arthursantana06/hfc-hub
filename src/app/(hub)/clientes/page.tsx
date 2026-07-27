import Link from "next/link";
import type { Metadata } from "next";
import { Plus, Users } from "lucide-react";
import { listClients } from "@/lib/planning-dal";
import { Page } from "@/components/layout/Page";
import { Avatar } from "@/components/ui/Avatar";
import { ClientSearch } from "@/components/clientes/ClientSearch";
import { formatCurrency, RISK_LABEL, RISK_STYLE } from "@/lib/types";

export const metadata: Metadata = {
  title: "Clientes — HFC Hub",
};

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const [{ q }, todos] = await Promise.all([searchParams, listClients()]);

  // Busca no servidor, sobre a lista já filtrada pela RLS. Com a carteira em
  // dezenas de clientes isso é mais rápido que ir ao banco de novo a cada tecla.
  const busca = (q ?? "").trim().toLowerCase();
  const clientes = busca
    ? todos.filter(
        (c) =>
          c.nome.toLowerCase().includes(busca) ||
          (c.email ?? "").toLowerCase().includes(busca),
      )
    : todos;

  const legenda = busca
    ? `${clientes.length} de ${todos.length} ${todos.length === 1 ? "cliente" : "clientes"}`
    : `${todos.length} ${todos.length === 1 ? "cliente" : "clientes"} na carteira`;

  return (
    <Page
      title="Clientes"
      subtitle={legenda}
      actions={
        <>
          <ClientSearch />
          <Link
            href="/clientes/novo"
            className="bg-brand-600 hover:bg-brand-900 transition-colors text-white font-poppins font-medium px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Novo Cliente
          </Link>
        </>
      }
    >
      {clientes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
            <Users className="w-7 h-7 text-slate-400" />
          </div>
          <p className="font-poppins text-lg text-brand-950">
            {busca ? "Nenhum cliente encontrado" : "Nenhum cliente ainda"}
          </p>
          <p className="font-inter text-sm text-slate-500 mt-1 max-w-sm">
            {busca
              ? `Nada corresponde a “${q}”.`
              : "Cadastre o primeiro cliente para começar o raio-x financeiro."}
          </p>
          {!busca && (
            <Link
              href="/clientes/novo"
              className="mt-6 bg-brand-600 hover:bg-brand-900 transition-colors text-white font-poppins font-medium px-4 py-2 rounded-lg text-sm"
            >
              Cadastrar cliente
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clientes.map((client) => (
            <div
              key={client.id}
              className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 flex flex-col h-full hover:border-brand-300 transition-colors"
            >
              <div className="flex items-center gap-4 mb-6">
                <Avatar src={client.avatarUrl} nome={client.nome} size={48} />
                <div className="min-w-0 flex-1">
                  <h2 className="font-poppins font-medium text-lg text-brand-950 truncate">
                    {client.nome}
                  </h2>
                  <p className="font-inter text-sm text-slate-500 truncate">
                    {client.email ?? client.profissao ?? "—"}
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-4 flex-1">
                <div className="flex flex-col items-start gap-1">
                  <span className="font-inter text-xs text-slate-500">
                    Perfil de Risco
                  </span>
                  {client.risco ? (
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-medium ${RISK_STYLE[client.risco]}`}
                    >
                      {RISK_LABEL[client.risco]}
                    </span>
                  ) : (
                    <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-slate-100 text-slate-500">
                      Não definido
                    </span>
                  )}
                </div>

                <div className="flex flex-col items-start gap-1 mt-2">
                  <span className="font-inter text-xs text-slate-500">
                    Patrimônio
                  </span>
                  <span className="font-poppins text-xl font-bold text-brand-950">
                    {formatCurrency(client.patrimonio)}
                  </span>
                </div>
              </div>

              <Link
                href={`/clientes/${client.id}`}
                className="block w-full text-center mt-6 bg-slate-50 hover:bg-brand-300/20 text-brand-600 border border-slate-200 rounded-lg py-2.5 font-medium transition-colors font-inter text-sm"
              >
                Acessar Painel
              </Link>
            </div>
          ))}
        </div>
      )}
    </Page>
  );
}
