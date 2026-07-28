"use client";

import { useActionState } from "react";
import { Loader2, ShieldQuestion, TrendingUp, Waves, Wind } from "lucide-react";
import { Select } from "@/components/ui/Select";
import { salvarCliente, type Estado } from "@/lib/actions/planejamento";

const base =
  "w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 " +
  "placeholder-slate-400 font-inter focus:outline-none focus:ring-2 focus:ring-brand-300 " +
  "focus:border-transparent transition-shadow";

export interface DadosCliente {
  id?: string;
  nome?: string;
  email?: string | null;
  nascimento?: string | null;
  profissao?: string | null;
  risco?: string | null;
  plano_status?: string;
  adesao?: string | null;
  notas?: string | null;
}

export function FormularioCliente({ cliente }: { cliente?: DadosCliente }) {
  const [estado, acao, pendente] = useActionState<Estado, FormData>(
    salvarCliente,
    undefined,
  );

  return (
    <form action={acao} className="flex flex-col gap-4">
      <input type="hidden" name="__id" value={cliente?.id ?? ""} />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Campo label="Nome" span2>
          <input
            name="nome"
            required
            defaultValue={cliente?.nome ?? ""}
            placeholder="Nome completo"
            className={base}
          />
        </Campo>

        <Campo label="E-mail">
          <input
            name="email"
            type="email"
            defaultValue={cliente?.email ?? ""}
            className={base}
          />
        </Campo>

        <Campo
          label="Data de nascimento"
          ajuda="Define a idade e o ano de aposentadoria. Sem ela não há projeção."
        >
          <input
            name="nascimento"
            type="date"
            defaultValue={cliente?.nascimento ?? ""}
            className={base}
          />
        </Campo>

        <Campo label="Profissão">
          <input
            name="profissao"
            defaultValue={cliente?.profissao ?? ""}
            className={base}
          />
        </Campo>

        <Campo label="Perfil de investidor">
          <Select
            name="risco"
            defaultValue={cliente?.risco ?? ""}
            placeholder="Não definido"
            opcoes={[
              { valor: "", rotulo: "Não definido", icone: ShieldQuestion },
              {
                valor: "conservador",
                rotulo: "Conservador",
                descricao: "Preserva o capital; aceita retorno menor",
                icone: Waves,
              },
              {
                valor: "moderado",
                rotulo: "Moderado",
                descricao: "Equilibra risco e retorno",
                icone: Wind,
              },
              {
                valor: "arrojado",
                rotulo: "Arrojado",
                descricao: "Aceita oscilação por retorno maior",
                icone: TrendingUp,
              },
            ]}
          />
        </Campo>

        <Campo
          label="Data de adesão"
          ajuda="Quando o cliente entrou na consultoria — não se confunde com o início do plano."
        >
          <input
            name="adesao"
            type="date"
            defaultValue={cliente?.adesao ?? ""}
            className={base}
          />
        </Campo>

        <Campo label="Status do plano">
          <Select
            name="plano_status"
            defaultValue={cliente?.plano_status ?? "diagnostico"}
            opcoes={[
              {
                valor: "diagnostico",
                rotulo: "Em diagnóstico",
                descricao: "Levantando os dados; o plano ainda não fechou",
              },
              {
                valor: "ativo",
                rotulo: "Plano ativo",
                descricao: "Plano fechado e em acompanhamento mensal",
              },
              {
                valor: "pendente",
                rotulo: "Pendente",
                descricao: "Acompanhamento parado, à espera do cliente",
              },
            ]}
          />
        </Campo>

        <Campo
          label="Observações"
          span2
          ajuda="Contexto que não cabe em campo estruturado: história, objetivos de vida, restrições."
        >
          <textarea
            name="notas"
            rows={4}
            defaultValue={cliente?.notas ?? ""}
            placeholder="O que é importante lembrar sobre este cliente…"
            className={`${base} resize-y`}
          />
        </Campo>
      </div>

      {estado?.erro && (
        <p className="font-inter text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {estado.erro}
        </p>
      )}
      {estado?.ok && (
        <p className="font-inter text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
          {estado.ok}
        </p>
      )}

      <div className="self-start">
        <button
          type="submit"
          disabled={pendente}
          className="px-4 py-2 bg-brand-600 hover:bg-brand-900 text-white font-poppins font-medium text-sm rounded-lg transition-colors cursor-pointer disabled:opacity-60 flex items-center gap-2"
        >
          {pendente && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          {pendente ? "Salvando…" : cliente?.id ? "Salvar cadastro" : "Cadastrar cliente"}
        </button>
      </div>
    </form>
  );
}

function Campo({
  label,
  ajuda,
  span2,
  children,
}: {
  label: string;
  ajuda?: string;
  span2?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={span2 ? "sm:col-span-2" : ""}>
      <label className="block font-inter text-xs font-medium text-slate-600 mb-1.5">
        {label}
      </label>
      {children}
      {ajuda && <p className="font-inter text-xs text-slate-400 mt-1">{ajuda}</p>}
    </div>
  );
}
