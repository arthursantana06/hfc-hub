import Link from "next/link";
import { ArrowRight, CalendarPlus, FileText, Snowflake } from "lucide-react";
import {
  getMetas,
  getPlanInput,
  getPlanoAtivo,
  listRegistrosMensais,
} from "@/lib/planning-dal";
import { createClient } from "@/lib/supabase/server";
import { verifySession } from "@/lib/dal";
import { hashDoPlano } from "@/lib/planning/project";
import { anoDe, mesDe, nomeDoMes, toISO } from "@/lib/planning/period";
import { Card } from "@/components/planejamento/primitives";
import {
  BotaoCongelarMetas,
  FormularioAbrirMes,
} from "@/components/planejamento/AcoesMes";

export default async function Relatorios({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await verifySession();
  const supabase = await createClient();

  const [plano, plan, metas, registros, relatorios] = await Promise.all([
    getPlanoAtivo(id),
    getPlanInput(id),
    getMetas(id),
    listRegistrosMensais(id),
    supabase.from("report").select("*").eq("client_id", id).order("ref_mes", { ascending: false }),
  ]);

  const porMes = new Map(
    (relatorios.data ?? []).map((r) => [r.ref_mes ?? "", r]),
  );

  // O plano mudou desde que as metas foram congeladas?
  const desatualizado =
    metas && plan ? metas.hash !== null && metas.hash !== hashDoPlano(plan) : false;

  const sugestao = proximoMesAberto(plano?.inicio ?? null, registros.map((r) => r.ref_mes));

  return (
    <>
      <header className="p-8 pb-6 shrink-0 border-b border-slate-200/60 bg-white shadow-sm">
        <h1 className="font-poppins font-medium text-2xl text-brand-950">Relatórios</h1>
        <p className="font-inter text-sm text-slate-500 mt-1">
          O acompanhamento mês a mês, medido contra as metas do plano.
        </p>
      </header>

      <div className="flex-1 overflow-y-auto p-8">
        <div className="flex flex-col gap-6 max-w-4xl mx-auto">
          <Card titulo="Metas do plano" icone={Snowflake} tom="roxo">
            {!plano ? (
              <p className="font-inter text-sm text-slate-500">
                Este cliente ainda não tem um plano. Comece pelo Ponto de Partida.
              </p>
            ) : (
              <div className="flex flex-col gap-4">
                <p className="font-inter text-sm text-slate-600 max-w-2xl">
                  {metas
                    ? `Metas congeladas em ${new Date(metas.geradoEm).toLocaleDateString("pt-BR")}${
                        metas.rotulo ? ` — ${metas.rotulo}` : ""
                      }. É contra elas que cada mês é medido.`
                    : "Nenhuma meta congelada ainda. Sem elas o placar do mês não tem contra o que comparar — é o primeiro passo do acompanhamento."}
                </p>

                {desatualizado && (
                  <p className="font-inter text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 max-w-2xl">
                    O plano mudou desde que as metas foram congeladas. Isso é
                    legítimo — a meta é histórica de propósito — mas vale saber
                    que os meses novos serão medidos contra um alvo anterior às
                    mudanças.
                  </p>
                )}

                <BotaoCongelarMetas clientId={id} jaCongelado={metas !== null} />
              </div>
            )}
          </Card>

          <Card titulo="Abrir um mês" icone={CalendarPlus}>
            <FormularioAbrirMes
              clientId={id}
              planId={plano?.id ?? null}
              sugestao={sugestao}
            />
          </Card>

          <Card titulo="Meses acompanhados" icone={FileText} tom="brand">
            {registros.length === 0 ? (
              <p className="font-inter text-sm text-slate-500">
                Nenhum mês aberto ainda.
              </p>
            ) : (
              <div className="flex flex-col gap-1">
                {registros.map((r) => {
                  const rel = porMes.get(r.ref_mes);
                  const publicado = rel?.status === "publicado";
                  return (
                    <Link
                      key={r.id}
                      href={`/clientes/${id}/relatorios/${r.ref_mes.slice(0, 7)}`}
                      className="group flex items-center gap-4 px-3 py-3 rounded-lg border border-transparent hover:border-slate-200 hover:bg-slate-50 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-inter text-sm font-medium text-brand-950">
                          {rotulo(r.ref_mes)}
                        </p>
                        <p className="font-inter text-xs text-slate-500 mt-0.5">
                          {publicado
                            ? `Publicado${r.fechado_em ? ` em ${new Date(r.fechado_em).toLocaleDateString("pt-BR")}` : ""}`
                            : "Rascunho"}
                        </p>
                      </div>
                      <span
                        className={`font-inter text-xs px-2.5 py-1 rounded-full font-medium ${
                          publicado
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {publicado ? "Publicado" : "Rascunho"}
                      </span>
                      <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-brand-600 transition-colors shrink-0" />
                    </Link>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}

const rotulo = (iso: string) =>
  `${nomeDoMes(Number(iso.slice(0, 4)) * 12 + Number(iso.slice(5, 7)) - 1)} de ${iso.slice(0, 4)}`;

/**
 * Primeiro mês do plano que ainda não foi aberto.
 *
 * Evita que o planejador tenha de lembrar em que mês parou — e evita o erro
 * mais comum, que é abrir de novo um mês já fechado.
 */
function proximoMesAberto(inicioPlano: string | null, abertos: string[]): string {
  const usados = new Set(abertos.map((d) => d.slice(0, 7)));
  if (!inicioPlano) return "";

  let p = Number(inicioPlano.slice(0, 4)) * 12 + Number(inicioPlano.slice(5, 7)) - 1;
  for (let i = 0; i < 240; i++) {
    const chave = toISO(p).slice(0, 7);
    if (!usados.has(chave)) return chave;
    p++;
  }
  return `${anoDe(p)}-${String(mesDe(p)).padStart(2, "0")}`;
}
