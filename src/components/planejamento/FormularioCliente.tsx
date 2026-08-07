"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { DatePicker } from "@/components/ui/DatePicker";
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
  adesao?: string | null;
  notas?: string | null;
  temPlanejamento?: boolean;
  temInvestimento?: boolean;
}

export function FormularioCliente({ cliente }: { cliente?: DadosCliente }) {
  const [estado, acao, pendente] = useActionState<Estado, FormData>(
    salvarCliente,
    undefined,
  );

  // Nenhuma das duas datas está no futuro. `max` só alimenta o calendário —
  // não vai para o HTML —, então a data do servidor não desencontra a do
  // cliente na hidratação.
  const hoje = new Date().toISOString().slice(0, 10);

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
          <DatePicker
            name="nascimento"
            defaultValue={cliente?.nascimento ?? ""}
            min="1900-01-01"
            max={hoje}
          />
        </Campo>

        <Campo label="Profissão">
          <input
            name="profissao"
            defaultValue={cliente?.profissao ?? ""}
            className={base}
          />
        </Campo>

        {/* O perfil de investidor saiu daqui: ele é resultado de um
            questionário, não de um palpite do planejador digitado num select.
            Volta como variável quando o Portal do Cliente existir. */}

        <Campo
          label="Data de adesão"
          ajuda="Quando o cliente entrou na consultoria — não se confunde com o início do plano."
        >
          <DatePicker
            name="adesao"
            defaultValue={cliente?.adesao ?? ""}
            min="2000-01-01"
            max={hoje}
          />
        </Campo>

        {/* O status do plano também saiu: era um rótulo digitado à mão que
            envelhecia sozinho. Quem tem período aberto, o banco responde. */}

        {/* Governa a navegação do painel: sem investimento contratado, a aba
            Investimentos não existe para este cliente. É por isso que mora no
            cadastro e não numa tela de configuração — é um fato comercial sobre
            a pessoa, da mesma natureza que a data de adesão. */}
        <Campo
          label="Serviços contratados"
          span2
          ajuda="Define quais áreas do painel deste cliente existem."
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:gap-6 pt-1">
            <Marcador
              name="tem_planejamento"
              label="Planejamento"
              defaultChecked={cliente?.temPlanejamento ?? true}
            />
            <Marcador
              name="tem_investimento"
              label="Investimento"
              defaultChecked={cliente?.temInvestimento ?? false}
            />
          </div>
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

/**
 * Caixa de marcação.
 *
 * Desmarcada, a caixa não vai no FormData — e é justamente por isso que a Server
 * Action lê ausência como `false` em vez de exigir um valor.
 */
function Marcador({
  name,
  label,
  defaultChecked,
}: {
  name: string;
  label: string;
  defaultChecked: boolean;
}) {
  return (
    <label className="flex items-center gap-2 cursor-pointer group">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="w-4 h-4 rounded border-slate-300 text-brand-600 focus:ring-2 focus:ring-brand-300 cursor-pointer accent-brand-600"
      />
      <span className="font-inter text-sm text-slate-700 group-hover:text-brand-900 transition-colors">
        {label}
      </span>
    </label>
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
