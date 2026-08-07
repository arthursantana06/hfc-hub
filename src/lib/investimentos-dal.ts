import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { verifySession } from "@/lib/dal";
import { listClients } from "@/lib/planning-dal";
import type { Tables } from "@/lib/supabase/database.types";

/**
 * Leitura da área de Investimentos.
 *
 * Como em `planning-dal.ts`, nenhuma consulta aqui passa `org_id`: quem autoriza
 * a leitura é a política de RLS, e repetir o filtro no `where` daria a impressão
 * de que é o `where` que protege.
 *
 * O valor de uma posição nunca vem de `investment_position` — vem de
 * `position_latest`, a visão que devolve o retrato mais recente de cada uma. É
 * por isso que toda carteira daqui sai com uma `dataReferencia` ao lado do
 * total: um total sem data é um número que envelhece em silêncio.
 */

export type ContaRow = Tables<"investment_account">;
export type PosicaoRow = Tables<"investment_position">;

export interface Posicao extends PosicaoRow {
  /** Último valor conhecido. Zero quando a posição ainda não tem retrato. */
  valorAtual: number;
  /** Data do retrato usado acima. */
  dataReferencia: string | null;
}

export interface ContaComPosicoes {
  conta: ContaRow;
  posicoes: Posicao[];
  total: number;
}

export interface Carteira {
  contas: ContaComPosicoes[];
  /** Todas as posições do cliente, sem separar por conta. */
  posicoes: Posicao[];
  total: number;
  /** O retrato mais recente da carteira inteira. */
  dataReferencia: string | null;
  /** O mais ANTIGO dos retratos — é ele que denuncia dado velho. */
  dataMaisAntiga: string | null;
  porClasse: { classe: string; valor: number }[];
}

/** Hoje em São Paulo, no formato das colunas `date`. */
export function hojeISO(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function formatarData(iso: string | null): string {
  if (!iso) return "—";
  const [ano, mes, dia] = iso.split("-");
  return `${dia}/${mes}/${ano}`;
}

/** Dias inteiros entre duas datas ISO. Negativo = a segunda já passou. */
export function diasEntre(deISO: string, ateISO: string): number {
  const um = Date.parse(`${deISO}T00:00:00Z`);
  const outro = Date.parse(`${ateISO}T00:00:00Z`);
  return Math.round((outro - um) / 86_400_000);
}

/** Soma os retratos mais recentes num mapa `position_id → {valor, data}`. */
async function retratosPorPosicao(
  clientId?: string,
): Promise<Map<string, { valor: number; data: string }>> {
  const supabase = await createClient();
  let q = supabase
    .from("position_latest")
    .select("position_id, data_referencia, valor_bruto");
  if (clientId) q = q.eq("client_id", clientId);

  const { data } = await q;
  const saida = new Map<string, { valor: number; data: string }>();
  for (const r of data ?? []) {
    if (!r.position_id || !r.data_referencia) continue;
    saida.set(r.position_id, {
      valor: Number(r.valor_bruto ?? 0),
      data: r.data_referencia,
    });
  }
  return saida;
}

function comRetrato(
  linhas: PosicaoRow[],
  retratos: Map<string, { valor: number; data: string }>,
): Posicao[] {
  return linhas.map((p) => {
    const r = retratos.get(p.id);
    return { ...p, valorAtual: r?.valor ?? 0, dataReferencia: r?.data ?? null };
  });
}

export const carteiraDoCliente = cache(
  async (clientId: string): Promise<Carteira> => {
    await verifySession();
    const supabase = await createClient();

    const [contas, posicoesBrutas, retratos] = await Promise.all([
      supabase
        .from("investment_account")
        .select("*")
        .eq("client_id", clientId)
        .order("ordem")
        .order("apelido"),
      supabase
        .from("investment_position")
        .select("*")
        .eq("client_id", clientId)
        .order("ordem"),
      retratosPorPosicao(clientId),
    ]);

    const posicoes = comRetrato(posicoesBrutas.data ?? [], retratos);

    const porConta = new Map<string, Posicao[]>();
    for (const p of posicoes) {
      const lista = porConta.get(p.account_id) ?? [];
      lista.push(p);
      porConta.set(p.account_id, lista);
    }

    const agrupadas: ContaComPosicoes[] = (contas.data ?? []).map((conta) => {
      const suas = porConta.get(conta.id) ?? [];
      return { conta, posicoes: suas, total: soma(suas) };
    });

    const datas = posicoes
      .map((p) => p.dataReferencia)
      .filter((d): d is string => Boolean(d))
      .sort();

    const porClasse = new Map<string, number>();
    for (const p of posicoes) {
      porClasse.set(p.classe, (porClasse.get(p.classe) ?? 0) + p.valorAtual);
    }

    return {
      contas: agrupadas,
      posicoes,
      total: soma(posicoes),
      dataReferencia: datas.at(-1) ?? null,
      dataMaisAntiga: datas[0] ?? null,
      porClasse: [...porClasse]
        .map(([classe, valor]) => ({ classe, valor }))
        .sort((a, b) => b.valor - a.valor),
    };
  },
);

export interface CarteiraDoCockpit {
  clientId: string;
  nome: string;
  avatarUrl: string | null;
  total: number;
  posicoes: number;
  dataReferencia: string | null;
}

export interface Cockpit {
  carteiras: CarteiraDoCockpit[];
  /** Clientes com o serviço contratado, mesmo sem nenhuma posição lançada. */
  clientesComServico: number;
  total: number;
  porClasse: { classe: string; valor: number }[];
  porEmissor: { emissor: string; valor: number; posicoes: number }[];
}

/**
 * A visão agregada da área.
 *
 * Reusa `listClients()` em vez de reconsultar `client`: a lista já vem filtrada
 * pela RLS, já é memoizada no mesmo render e já traz o nome e a foto assinada.
 */
export const cockpitDeInvestimentos = cache(async (): Promise<Cockpit> => {
  await verifySession();
  const supabase = await createClient();

  const [clientes, posicoesBrutas, retratos] = await Promise.all([
    listClients(),
    supabase.from("investment_position").select("*"),
    retratosPorPosicao(),
  ]);

  const posicoes = comRetrato(posicoesBrutas.data ?? [], retratos);
  const comServico = clientes.filter((c) => c.temInvestimento);

  const porCliente = new Map<string, Posicao[]>();
  for (const p of posicoes) {
    const lista = porCliente.get(p.client_id) ?? [];
    lista.push(p);
    porCliente.set(p.client_id, lista);
  }

  const carteiras: CarteiraDoCockpit[] = comServico.map((c) => {
    const suas = porCliente.get(c.id) ?? [];
    const datas = suas
      .map((p) => p.dataReferencia)
      .filter((d): d is string => Boolean(d))
      .sort();
    return {
      clientId: c.id,
      nome: c.nome,
      avatarUrl: c.avatarUrl,
      total: soma(suas),
      posicoes: suas.length,
      // A MAIS ANTIGA, não a mais recente: o cockpit existe para mostrar onde o
      // dado está velho, e a data mais nova esconderia exatamente isso.
      dataReferencia: datas[0] ?? null,
    };
  });

  const porClasse = new Map<string, number>();
  const porEmissor = new Map<string, { valor: number; posicoes: number }>();
  for (const p of posicoes) {
    porClasse.set(p.classe, (porClasse.get(p.classe) ?? 0) + p.valorAtual);

    const nome = (p.emissor_nome ?? "").trim() || "Sem emissor informado";
    const atual = porEmissor.get(nome) ?? { valor: 0, posicoes: 0 };
    porEmissor.set(nome, {
      valor: atual.valor + p.valorAtual,
      posicoes: atual.posicoes + 1,
    });
  }

  return {
    carteiras: carteiras.sort((a, b) => b.total - a.total),
    clientesComServico: comServico.length,
    total: soma(posicoes),
    porClasse: [...porClasse]
      .map(([classe, valor]) => ({ classe, valor }))
      .sort((a, b) => b.valor - a.valor),
    porEmissor: [...porEmissor]
      .map(([emissor, v]) => ({ emissor, ...v }))
      .sort((a, b) => b.valor - a.valor),
  };
});

export interface Vencimento {
  posicao: Posicao;
  clientId: string;
  dias: number;
}

/**
 * O que vence numa janela de dias, do mais próximo ao mais distante.
 *
 * Sem `clientId`, atravessa a carteira toda — é o calendário do cockpit. O que
 * já venceu entra também, com `dias` negativo: um vencimento de ontem que ninguém
 * reinvestiu é justamente o que precisa aparecer.
 */
export const vencimentosProximos = cache(
  async (dias: number, clientId?: string): Promise<Vencimento[]> => {
    await verifySession();
    const supabase = await createClient();

    const hoje = hojeISO();
    const limite = new Date(Date.parse(`${hoje}T00:00:00Z`) + dias * 86_400_000)
      .toISOString()
      .slice(0, 10);

    // Trinta dias de tolerância para trás: vencido e não reinvestido é problema,
    // não história.
    const desde = new Date(Date.parse(`${hoje}T00:00:00Z`) - 30 * 86_400_000)
      .toISOString()
      .slice(0, 10);

    let q = supabase
      .from("investment_position")
      .select("*")
      .not("vencimento", "is", null)
      .gte("vencimento", desde)
      .lte("vencimento", limite)
      .order("vencimento");
    if (clientId) q = q.eq("client_id", clientId);

    const { data } = await q;
    const retratos = await retratosPorPosicao(clientId);

    return comRetrato(data ?? [], retratos).map((posicao) => ({
      posicao,
      clientId: posicao.client_id,
      dias: diasEntre(hoje, posicao.vencimento!),
    }));
  },
);

const soma = (linhas: { valorAtual: number }[]) =>
  linhas.reduce((a, x) => a + x.valorAtual, 0);
