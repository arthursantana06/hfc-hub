"use client";

import { useActionState } from "react";
import { Coins, Loader2, Scale } from "lucide-react";
import { Select } from "@/components/ui/Select";
import {
  salvarPlano,
  salvarAposentadoria,
  type Estado,
} from "@/lib/actions/planejamento";
import { dataParaMes, escreverMoeda } from "@/lib/forms/planejamento";

const base =
  "w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 " +
  "placeholder-slate-400 font-inter focus:outline-none focus:ring-2 focus:ring-brand-300 " +
  "focus:border-transparent transition-shadow";

export interface DadosPlano {
  id?: string;
  inicio?: string;
  modo_valor?: string;
  dia_referencia?: number;
  dia_pagamento?: number | null;
  dia_fatura?: number | null;
  juros_curto?: number;
  juros_longo?: number;
  inflacao?: number;
  juros_aposentadoria?: number;
  idade_limite?: number;
  meses_curto?: number;
}

/** 0.12 → "12" — a tela fala em porcentagem, o banco guarda a fração. */
const pct = (v: number | undefined, padrao: number) =>
  String(Number(((v ?? padrao) * 100).toFixed(4)));

export function FormularioPlano({
  clientId,
  plano,
}: {
  clientId: string;
  plano?: DadosPlano | null;
}) {
  const [estado, acao, pendente] = useActionState<Estado, FormData>(
    salvarPlano,
    undefined,
  );

  return (
    <form action={acao} className="flex flex-col gap-5">
      <input type="hidden" name="__clientId" value={clientId} />
      <input type="hidden" name="__id" value={plano?.id ?? ""} />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Campo
          label="Início do plano"
          ajuda="Primeiro mês projetado. Meses anteriores são realizado, não projeção."
        >
          <input
            name="inicio"
            type="month"
            required
            defaultValue={dataParaMes(plano?.inicio) || mesAtual()}
            className={base}
          />
        </Campo>

        <Campo
          label="Modo de valor"
          ajuda="Real: tudo em poder de compra de hoje. Nominal: valores correntes, corrigidos pela inflação."
        >
          <Select
            name="modo_valor"
            defaultValue={plano?.modo_valor ?? "nominal"}
            opcoes={[
              {
                valor: "nominal",
                rotulo: "Valor Nominal",
                descricao: "Valores correntes; receitas e despesas crescem com a inflação",
                icone: Coins,
              },
              {
                valor: "real",
                rotulo: "Valor Real",
                descricao: "Tudo em poder de compra de hoje; a inflação sai do retorno",
                icone: Scale,
              },
            ]}
          />
        </Campo>

        <Campo label="Juros — curto prazo (% a.a.)">
          <input
            name="juros_curto"
            inputMode="decimal"
            defaultValue={pct(plano?.juros_curto, 0.12)}
            className={`${base} text-right tabular-nums`}
          />
        </Campo>

        <Campo label="Juros — longo prazo (% a.a.)">
          <input
            name="juros_longo"
            inputMode="decimal"
            defaultValue={pct(plano?.juros_longo, 0.1)}
            className={`${base} text-right tabular-nums`}
          />
        </Campo>

        <Campo label="Inflação (% a.a.)">
          <input
            name="inflacao"
            inputMode="decimal"
            defaultValue={pct(plano?.inflacao, 0.05)}
            className={`${base} text-right tabular-nums`}
          />
        </Campo>

        <Campo label="Juros na aposentadoria (% a.a.)">
          <input
            name="juros_aposentadoria"
            inputMode="decimal"
            defaultValue={pct(plano?.juros_aposentadoria, 0.04)}
            className={`${base} text-right tabular-nums`}
          />
        </Campo>

        <Campo label="Meses da projeção curta">
          <input
            name="meses_curto"
            type="number"
            min={1}
            max={120}
            defaultValue={plano?.meses_curto ?? 36}
            className={base}
          />
        </Campo>

        <Campo label="Horizonte (idade limite)">
          <input
            name="idade_limite"
            type="number"
            min={60}
            max={120}
            defaultValue={plano?.idade_limite ?? 101}
            className={base}
          />
        </Campo>

        <Campo label="Dia de referência">
          <input
            name="dia_referencia"
            type="number"
            min={1}
            max={31}
            defaultValue={plano?.dia_referencia ?? 1}
            className={base}
          />
        </Campo>

        <Campo label="Dia de pagamento">
          <input
            name="dia_pagamento"
            type="number"
            min={1}
            max={31}
            defaultValue={plano?.dia_pagamento ?? ""}
            className={base}
          />
        </Campo>

        <Campo label="Dia da fatura do cartão">
          <input
            name="dia_fatura"
            type="number"
            min={1}
            max={31}
            defaultValue={plano?.dia_fatura ?? ""}
            className={base}
          />
        </Campo>
      </div>

      <Mensagens estado={estado} />

      <div className="self-start">
        <Botao pendente={pendente} rotulo={plano?.id ? "Salvar premissas" : "Criar plano"} />
      </div>
    </form>
  );
}

export function FormularioAposentadoria({
  clientId,
  planId,
  dados,
}: {
  clientId: string;
  planId: string;
  dados?: {
    idade_alvo?: number | null;
    renda_inss?: number | null;
    renda_desejada?: number | null;
  } | null;
}) {
  const [estado, acao, pendente] = useActionState<Estado, FormData>(
    salvarAposentadoria,
    undefined,
  );

  return (
    <form action={acao} className="flex flex-col gap-5">
      <input type="hidden" name="__clientId" value={clientId} />
      <input type="hidden" name="__planId" value={planId} />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Campo label="Idade de aposentadoria">
          <input
            name="idade_alvo"
            type="number"
            min={40}
            max={100}
            defaultValue={dados?.idade_alvo ?? 65}
            className={base}
          />
        </Campo>

        <Campo label="Renda do INSS (mensal)">
          <input
            name="renda_inss"
            inputMode="decimal"
            defaultValue={escreverMoeda(dados?.renda_inss ?? 0)}
            className={`${base} text-right tabular-nums`}
          />
        </Campo>

        <Campo label="Renda desejada (mensal)">
          <input
            name="renda_desejada"
            inputMode="decimal"
            defaultValue={escreverMoeda(dados?.renda_desejada ?? 0)}
            className={`${base} text-right tabular-nums`}
          />
        </Campo>
      </div>

      <Mensagens estado={estado} />

      <div className="self-start">
        <Botao pendente={pendente} rotulo="Salvar aposentadoria" />
      </div>
    </form>
  );
}

function Campo({
  label,
  ajuda,
  children,
}: {
  label: string;
  ajuda?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block font-inter text-xs font-medium text-slate-600 mb-1.5">
        {label}
      </label>
      {children}
      {ajuda && <p className="font-inter text-xs text-slate-400 mt-1">{ajuda}</p>}
    </div>
  );
}

function Mensagens({ estado }: { estado: Estado }) {
  if (estado?.erro) {
    return (
      <p className="font-inter text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
        {estado.erro}
      </p>
    );
  }
  if (estado?.ok) {
    return (
      <p className="font-inter text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
        {estado.ok}
      </p>
    );
  }
  return null;
}

function Botao({ pendente, rotulo }: { pendente: boolean; rotulo: string }) {
  return (
    <button
      type="submit"
      disabled={pendente}
      className="px-4 py-2 bg-brand-600 hover:bg-brand-900 text-white font-poppins font-medium text-sm rounded-lg transition-colors cursor-pointer disabled:opacity-60 flex items-center gap-2"
    >
      {pendente && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
      {pendente ? "Salvando…" : rotulo}
    </button>
  );
}

/**
 * Mês corrente como padrão de um plano novo.
 *
 * `new Date()` aqui é legítimo: é sugestão inicial de formulário, não entrada
 * do motor — o motor recebe a data que ficou gravada.
 */
function mesAtual() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
