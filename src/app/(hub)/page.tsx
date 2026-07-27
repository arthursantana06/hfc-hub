import Link from "next/link";
import { ArrowRight, CalendarDays, Plus, Users, Wallet } from "lucide-react";
import { Page } from "@/components/layout/Page";
import { Avatar } from "@/components/ui/Avatar";
import { Card, Stat } from "@/components/planejamento/primitives";
import { listClients } from "@/lib/planning-dal";
import { createClient } from "@/lib/supabase/server";
import { verifySession } from "@/lib/dal";
import { formatCurrency, PLAN_STATUS_LABEL } from "@/lib/types";

export default async function Dashboard() {
  await verifySession();
  const supabase = await createClient();

  const [clientes, reunioes] = await Promise.all([
    listClients(),
    supabase
      .from("meeting")
      .select("id, quando, notas, client(id, nome)")
      .gte("quando", new Date().toISOString())
      .order("quando")
      .limit(5),
  ]);

  const patrimonioTotal = clientes.reduce((a, c) => a + c.patrimonio, 0);
  const comPlano = clientes.filter((c) => c.planoStatus === "ativo").length;

  return (
    <Page
      title="Visão Geral"
      subtitle="O retrato da consultoria hoje."
      actions={
        <Link
          href="/clientes/novo"
          className="bg-brand-600 hover:bg-brand-900 transition-colors text-white font-poppins font-medium px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Novo Cliente
        </Link>
      }
    >
      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Stat
            rotulo="Patrimônio sob acompanhamento"
            valor={formatCurrency(patrimonioTotal)}
            hint="soma dos ativos menos passivos da carteira"
          />
          <Stat
            rotulo="Clientes"
            valor={String(clientes.length)}
            hint={`${comPlano} com plano ativo`}
          />
          <Stat
            rotulo="Reuniões agendadas"
            valor={String((reunioes.data ?? []).length)}
            hint="nos próximos dias"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card titulo="Carteira" icone={Users}>
              {clientes.length === 0 ? (
                <div className="flex flex-col gap-2">
                  <p className="font-inter text-sm text-slate-500">
                    Nenhum cliente cadastrado.
                  </p>
                  <Link
                    href="/clientes/novo"
                    className="inline-flex items-center gap-1.5 font-inter text-sm text-brand-600 hover:text-brand-900 transition-colors"
                  >
                    Cadastrar o primeiro
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col gap-1">
                  {clientes.map((c) => (
                    <Link
                      key={c.id}
                      href={`/clientes/${c.id}`}
                      className="group flex items-center gap-4 px-3 py-3 rounded-lg border border-transparent hover:border-slate-200 hover:bg-slate-50 transition-colors"
                    >
                      <Avatar src={c.avatarUrl} nome={c.nome} size={36} />
                      <div className="min-w-0 flex-1">
                        <p className="font-inter text-sm font-medium text-brand-950 truncate">
                          {c.nome}
                        </p>
                        <p className="font-inter text-xs text-slate-500 mt-0.5">
                          {PLAN_STATUS_LABEL[c.planoStatus]}
                          {c.profissao ? ` · ${c.profissao}` : ""}
                        </p>
                      </div>
                      <span className="font-inter text-sm text-slate-600 tabular-nums shrink-0 flex items-center gap-1.5">
                        <Wallet className="w-3.5 h-3.5 text-slate-300" />
                        {formatCurrency(c.patrimonio)}
                      </span>
                      <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-brand-600 transition-colors shrink-0" />
                    </Link>
                  ))}
                </div>
              )}
            </Card>
          </div>

          <Card titulo="Próximas reuniões" icone={CalendarDays}>
            {(reunioes.data ?? []).length === 0 ? (
              <div className="flex flex-col gap-2">
                <p className="font-inter text-sm text-slate-500">
                  Nenhuma reunião agendada.
                </p>
                <Link
                  href="/agenda"
                  className="inline-flex items-center gap-1.5 font-inter text-sm text-brand-600 hover:text-brand-900 transition-colors"
                >
                  Ir para a agenda
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {(reunioes.data ?? []).map((r) => {
                  const quando = new Date(r.quando);
                  const cliente = r.client as unknown as { id: string; nome: string } | null;
                  return (
                    <div key={r.id} className="flex items-start gap-4">
                      <div className="flex flex-col items-center justify-center bg-slate-50 rounded-lg p-2 min-w-[4rem] border border-slate-100">
                        <span className="font-inter text-xs text-slate-500">
                          {quando.toLocaleDateString("pt-BR", {
                            day: "2-digit",
                            month: "short",
                          })}
                        </span>
                        <span className="font-poppins font-medium text-brand-950 text-sm">
                          {quando.toLocaleTimeString("pt-BR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <div className="min-w-0 pt-1">
                        <h3 className="font-poppins font-medium text-brand-950 text-sm truncate">
                          {cliente?.nome ?? "—"}
                        </h3>
                        {r.notas && (
                          <p className="font-inter text-sm text-slate-500 truncate">
                            {r.notas}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      </div>
    </Page>
  );
}
