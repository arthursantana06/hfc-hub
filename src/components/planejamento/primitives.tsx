import Link from "next/link";
import { FileQuestion, WalletMinimal, type LucideIcon } from "lucide-react";
import { formatCurrency } from "@/lib/types";

/** Cartão padrão das telas de planejamento. */
export function Card({
  titulo,
  icone: Icone,
  tom = "brand",
  total,
  acao,
  children,
}: {
  titulo: string;
  icone?: LucideIcon;
  tom?: "brand" | "verde" | "vermelho" | "ambar" | "roxo";
  total?: number;
  acao?: React.ReactNode;
  children: React.ReactNode;
}) {
  const tons = {
    brand: "bg-brand-300/20 text-brand-600",
    verde: "bg-emerald-50 text-emerald-600",
    vermelho: "bg-red-50 text-red-600",
    ambar: "bg-amber-50 text-amber-600",
    roxo: "bg-violet-50 text-violet-600",
  } as const;

  const totalCor = {
    brand: "text-brand-950",
    verde: "text-emerald-600",
    vermelho: "text-red-600",
    ambar: "text-amber-600",
    roxo: "text-violet-600",
  } as const;

  return (
    <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col">
      <div className="flex justify-between items-start gap-4 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          {Icone && (
            <div className={`p-2 rounded-lg shrink-0 ${tons[tom]}`}>
              <Icone className="w-5 h-5" />
            </div>
          )}
          <h2 className="font-poppins text-lg text-brand-950 font-medium truncate">
            {titulo}
          </h2>
        </div>
        {total !== undefined && (
          <div className={`font-poppins text-xl font-semibold shrink-0 ${totalCor[tom]}`}>
            {formatCurrency(total, 2)}
          </div>
        )}
        {acao}
      </div>
      <div className="border-b border-slate-100 w-full mb-4" />
      {children}
    </section>
  );
}

/** Linha nome / detalhe / valor — o átomo destas telas. */
export function Linha({
  nome,
  detalhe,
  valor,
  destaque = false,
}: {
  nome: string;
  detalhe?: string;
  valor: number | string;
  destaque?: boolean;
}) {
  return (
    <div className="flex justify-between items-baseline gap-4 py-2.5 border-b border-slate-50 last:border-none">
      <div className="min-w-0">
        <h4
          className={`font-inter text-sm truncate ${
            destaque ? "font-semibold text-brand-950" : "font-medium text-slate-700"
          }`}
        >
          {nome}
        </h4>
        {detalhe && <p className="text-xs text-slate-500 mt-0.5">{detalhe}</p>}
      </div>
      <span
        className={`font-inter text-sm shrink-0 tabular-nums ${
          destaque ? "font-semibold text-brand-950" : "text-slate-600"
        }`}
      >
        {typeof valor === "number" ? formatCurrency(valor, 2) : valor}
      </span>
    </div>
  );
}

/** Indicador grande. `hint` é para a leitura que o número sozinho não dá. */
export function Stat({
  rotulo,
  valor,
  hint,
  tom = "neutro",
}: {
  rotulo: string;
  valor: string;
  hint?: string;
  tom?: "neutro" | "bom" | "ruim" | "atencao";
}) {
  const cor = {
    neutro: "text-brand-950",
    bom: "text-emerald-600",
    ruim: "text-red-600",
    atencao: "text-amber-600",
  }[tom];

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between min-w-0">
      <h3 className="font-inter text-sm text-slate-500 mb-3">{rotulo}</h3>
      <div className={`font-poppins text-2xl font-bold truncate ${cor}`} title={valor}>
        {valor}
      </div>
      {hint && <p className="font-inter text-xs text-slate-400 mt-1.5">{hint}</p>}
    </div>
  );
}

/**
 * Estado para quando o cliente ainda não tem plano.
 *
 * Não é erro — todo cliente passa por aqui antes do primeiro raio-x. Mostrar
 * uma tabela vazia de zeros seria pior: parece dado, e não é.
 */
export function SemPlano({ clienteId }: { clienteId: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
        <FileQuestion className="w-7 h-7 text-slate-400" />
      </div>
      <p className="font-poppins text-lg text-brand-950">
        Este cliente ainda não tem um plano
      </p>
      <p className="font-inter text-sm text-slate-500 mt-1 max-w-md">
        O raio-x começa pela receita do planejamento HFC. A partir daí a
        projeção se monta sozinha.
      </p>
      <Link
        href={`/clientes/${clienteId}/planejamento/hfc/receita`}
        className="mt-6 bg-brand-600 hover:bg-brand-900 transition-colors text-white font-poppins font-medium px-4 py-2 rounded-lg text-sm"
      >
        Começar o raio-x
      </Link>
    </div>
  );
}

/**
 * Estado para quem não contratou o serviço de Investimento.
 *
 * Não é 404 nem erro de permissão: a página existe e a pessoa existe — o que não
 * existe é a contratação. Mandar para o cadastro é o que resolve, então é para lá
 * que o botão aponta.
 */
export function SemServicoInvestimento({ clienteId }: { clienteId: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
        <WalletMinimal className="w-7 h-7 text-slate-400" />
      </div>
      <p className="font-poppins text-lg text-brand-950">
        Este cliente não tem Investimento contratado
      </p>
      <p className="font-inter text-sm text-slate-500 mt-1 max-w-md">
        A carteira, os vencimentos e a alocação aparecem aqui depois que o serviço
        for marcado no cadastro.
      </p>
      <Link
        href={`/clientes/${clienteId}/cadastro`}
        className="mt-6 bg-brand-600 hover:bg-brand-900 transition-colors text-white font-poppins font-medium px-4 py-2 rounded-lg text-sm"
      >
        Abrir o cadastro
      </Link>
    </div>
  );
}

/** Barra de proporção usada nos baldes do orçamento. */
export function Barra({ fracao, tom }: { fracao: number; tom: string }) {
  return (
    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full ${tom}`}
        style={{ width: `${Math.min(100, Math.max(0, fracao * 100))}%` }}
      />
    </div>
  );
}

export const pct = (v: number) =>
  `${(v * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;
