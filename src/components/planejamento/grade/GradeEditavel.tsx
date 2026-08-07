"use client";

import { useEffect, useRef, useState } from "react";
import { Trash2 } from "lucide-react";
import {
  alternarPersistencia,
  criarLinhaDoGrid,
  removerLinhaDoGrid,
  salvarLinhaDoGrid,
} from "@/lib/actions/grade";
import {
  ENTIDADES,
  camposPendentes,
  escreverMoeda,
  lerMoeda,
  type Campo,
  type ChaveEntidade,
} from "@/lib/forms/planejamento";
import type { Enums } from "@/lib/supabase/database.types";
import { CelulaEditavel } from "./CelulaEditavel";
import { IndicadorSalvo } from "./IndicadorSalvo";
import { PinPermanente } from "./PinPermanente";
import { useAutosave } from "./useAutosave";

export interface LinhaGrid {
  id: string;
  /** Valores no formato de tela, prontos para as células. */
  valores: Record<string, string>;
  persistencia?: Enums<"row_persistence">;
}

/**
 * A tabela editável tipo planilha do Planejamento.
 *
 * O grid é DONO do estado depois da hidratação: as actions dele não revalidam
 * a rota (revalidar re-renderizaria o Server Component no meio da digitação),
 * então o que o servidor mandou no primeiro render é semente, não fonte viva.
 * Consequência assumida: totais fora do grid só atualizam ao navegar — o
 * subtotal que precisa ser vivo é o do rodapé daqui.
 *
 * Fluxo de escrita: cada confirmação de célula atualiza o estado local na hora
 * (otimista) e enfileira uma gravação da LINHA INTEIRA. Erro reverte a linha
 * para o último estado salvo e acende o indicador. A linha fantasma do rodapé
 * cria o registro na primeira célula confirmada e troca o id provisório pelo
 * real quando o servidor responde — a fila por linha garante que edições
 * feitas nesse meio-tempo esperem a criação.
 */
export function GradeEditavel({
  entidade,
  colunas,
  linhas: linhasIniciais,
  planId,
  clientId,
  categoriaPlanId,
  vazio = "Nenhuma linha ainda — comece a digitar abaixo.",
  colunaTotal,
  titulo,
  comPin = false,
  aoMudarLinhas,
}: {
  entidade: ChaveEntidade;
  /** Quais campos do esquema viram colunas, na ordem. */
  colunas: string[];
  linhas: LinhaGrid[];
  planId: string;
  clientId: string;
  /** Só para `despesa`: o bloco a que as linhas novas pertencem. */
  categoriaPlanId?: string;
  vazio?: string;
  /** Campo de moeda somado no rodapé, vivo, calculado no cliente. */
  colunaTotal?: string;
  /** Rótulo acessível da tabela. */
  titulo: string;
  /**
   * Mostra a coluna do pin pontual/permanente.
   *
   * Só faz sentido no Planejamento Real: em Pré-HFC e HFC não existe "próximo
   * período" para um ajuste viajar.
   */
  comPin?: boolean;
  /**
   * Avisa o pai a cada mudança de linhas (edição, criação, remoção).
   *
   * Existe para telas que derivam algo vivo do grid — a fatura projetada do
   * Cartão — sem tirar do grid a posse do estado.
   */
  aoMudarLinhas?: (linhas: LinhaGrid[]) => void;
}) {
  const esquema = ENTIDADES[entidade];
  const campos = colunas
    .map((k) => esquema.campos.find((c) => c.key === k))
    .filter((c): c is Campo => c !== undefined);

  const [linhas, setLinhas] = useState<LinhaGrid[]>(linhasIniciais);
  // Fonte da verdade para os handlers e para as tarefas assíncronas da fila:
  // o estado do React fica sempre um render atrás do que uma tarefa em voo
  // precisa ler. Toda mutação passa por `atualizarLinhas`, que muda a ref e o
  // estado juntos — fora do render, então a regra de refs do React vale.
  const linhasRef = useRef<LinhaGrid[]>(linhasIniciais);

  function atualizarLinhas(f: (ls: LinhaGrid[]) => LinhaGrid[]) {
    linhasRef.current = f(linhasRef.current);
    setLinhas(linhasRef.current);
    aoMudarLinhas?.(linhasRef.current);
  }

  // Último estado que o banco confirmou, por linha — o alvo do revert em erro.
  const salvos = useRef(new Map(linhasIniciais.map((l) => [l.id, { ...l.valores }])));
  // id provisório ("nova:1") → id real, preenchido quando a criação responde.
  const idReal = useRef(new Map<string, string>());
  const seq = useRef(0);

  const refs = useRef(new Map<string, HTMLInputElement>());
  const focoPendente = useRef<string | null>(null);
  const [removendo, setRemovendo] = useState<string | null>(null);

  const { estado, enfileirar, reportarErro, reportarPendencia, limparErro } =
    useAutosave();

  useEffect(() => {
    if (!focoPendente.current) return;
    refs.current.get(focoPendente.current)?.focus();
    focoPendente.current = null;
  }, [linhas]);

  // ── valores default da linha fantasma ─────────────────────────
  function valoresNovos(): Record<string, string> {
    const v: Record<string, string> = {};
    for (const c of esquema.campos) v[c.key] = c.padrao ?? "";
    return v;
  }
  const [nova, setNova] = useState<Record<string, string>>(valoresNovos);
  // Muda a cada promoção e serve de `key` da linha fantasma: remontar os
  // inputs é o único jeito seguro de limpá-los — o input que acabou de ser
  // confirmado ainda tem foco e texto locais, e um blur tardio dele criaria a
  // MESMA linha de novo.
  const [geracaoNova, setGeracaoNova] = useState(0);

  // ── escrita ───────────────────────────────────────────────────
  function montarForm(linha: LinhaGrid, idGravacao: string | null): FormData {
    const form = new FormData();
    form.set("__entidade", entidade);
    if (idGravacao) form.set("__id", idGravacao);
    form.set("__planId", planId);
    form.set("__clientId", clientId);
    if (categoriaPlanId) form.set("__categoriaPlanId", categoriaPlanId);
    for (const c of esquema.campos) form.set(c.key, linha.valores[c.key] ?? "");
    return form;
  }

  function gravar(linhaId: string) {
    enfileirar(linhaId, async () => {
      const linha = linhasRef.current.find((l) => l.id === linhaId);
      if (!linha) return;

      const real = idReal.current.get(linhaId) ?? (ehProvisorio(linhaId) ? null : linhaId);
      const enviado = { ...linha.valores };
      const r = real
        ? await salvarLinhaDoGrid(montarForm(linha, real))
        : await criarLinhaDoGrid(montarForm(linha, null));

      if (r.erro) {
        const ultimo = salvos.current.get(linhaId);
        // Linha nova que nunca gravou fica como está — reverter apagaria o que
        // o planejador digitou, e o erro pode ser só um campo faltando.
        if (ultimo) {
          atualizarLinhas((ls) =>
            ls.map((l) => (l.id === linhaId ? { ...l, valores: { ...ultimo } } : l)),
          );
        }
        reportarErro(r.erro);
        return;
      }

      if (!real && r.id) idReal.current.set(linhaId, r.id);
      salvos.current.set(linhaId, enviado);
      if (r.persistencia) {
        atualizarLinhas((ls) =>
          ls.map((l) => (l.id === linhaId ? { ...l, persistencia: r.persistencia } : l)),
        );
      }
      limparErro();
    });
  }

  /**
   * A linha só vai para o servidor quando está inteira.
   *
   * Escolher "anual" ou "meses escolhidos" na frequência torna obrigatório um
   * campo que ainda está vazio. Gravar nesse instante tomaria erro e reverteria
   * a linha — desfazendo a escolha recém-feita e escondendo de novo o campo que
   * falta preencher. Então a mudança fica na tela, o campo dependente aparece,
   * e a gravação acontece quando ele for preenchido.
   */
  function gravarSeCompleta(linhaId: string) {
    const linha = linhasRef.current.find((l) => l.id === linhaId);
    if (!linha) return;

    const faltando = camposPendentes(esquema, linha.valores);
    if (faltando.length > 0) {
      reportarPendencia(`Falta preencher: ${faltando.map((c) => c.label).join(", ")}`);
      return;
    }
    gravar(linhaId);
  }

  function confirmarCelula(linhaId: string, key: string, valor: string) {
    atualizarLinhas((ls) =>
      ls.map((l) =>
        l.id === linhaId ? { ...l, valores: { ...l.valores, [key]: valor } } : l,
      ),
    );
    gravarSeCompleta(linhaId);
  }

  function confirmarNova(key: string, valor: string) {
    if (valor.trim() === "") {
      setNova((v) => ({ ...v, [key]: valor }));
      return;
    }

    const tempId = `nova:${seq.current++}`;
    const valores = { ...nova, [key]: valor };
    atualizarLinhas((ls) => [...ls, { id: tempId, valores }]);
    setNova(valoresNovos());
    setGeracaoNova((g) => g + 1);

    // O foco segue para a célula seguinte da linha recém-promovida, para a
    // digitação contínua não tropeçar na promoção.
    const proxima = campos[campos.findIndex((c) => c.key === key) + 1];
    if (proxima) focoPendente.current = `${tempId}:${proxima.key}`;

    // Mesma regra da edição: a linha nova espera estar completa para nascer no
    // banco. Até lá ela existe só na tela, e o indicador diz o que falta.
    gravarSeCompleta(tempId);
  }

  /**
   * Fixa ou solta o ajuste da linha.
   *
   * Otimista como as células: o pin muda na hora e volta se o servidor negar —
   * é um clique de conferência visual, e esperar o round-trip faria o
   * planejador clicar duas vezes.
   */
  function alternarPin(linhaId: string) {
    const anterior = linhasRef.current.find((l) => l.id === linhaId)?.persistencia;
    const alvo = anterior === "permanente" ? "mes" : "permanente";
    atualizarLinhas((ls) =>
      ls.map((l) => (l.id === linhaId ? { ...l, persistencia: alvo } : l)),
    );

    enfileirar(linhaId, async () => {
      const real = idReal.current.get(linhaId) ?? (ehProvisorio(linhaId) ? null : linhaId);
      if (!real) return;

      const form = new FormData();
      form.set("__entidade", entidade);
      form.set("__id", real);
      form.set("__planId", planId);
      const r = await alternarPersistencia(form);

      if (r.erro) {
        atualizarLinhas((ls) =>
          ls.map((l) => (l.id === linhaId ? { ...l, persistencia: anterior } : l)),
        );
        reportarErro(r.erro);
        return;
      }
      if (r.persistencia) {
        atualizarLinhas((ls) =>
          ls.map((l) => (l.id === linhaId ? { ...l, persistencia: r.persistencia } : l)),
        );
      }
      limparErro();
    });
  }

  function remover(linhaId: string) {
    setRemovendo(null);
    const indice = linhasRef.current.findIndex((l) => l.id === linhaId);
    const linha = linhasRef.current[indice];
    if (!linha) return;

    atualizarLinhas((ls) => ls.filter((l) => l.id !== linhaId));

    enfileirar(linhaId, async () => {
      const real = idReal.current.get(linhaId) ?? (ehProvisorio(linhaId) ? null : linhaId);
      // Linha provisória cuja criação falhou: não existe no banco, nada a fazer.
      if (!real) return;

      const form = new FormData();
      form.set("__entidade", entidade);
      form.set("__id", real);
      form.set("__planId", planId);
      const r = await removerLinhaDoGrid(form);

      if (r.erro) {
        atualizarLinhas((ls) => {
          const copia = [...ls];
          copia.splice(Math.min(indice, copia.length), 0, linha);
          return copia;
        });
        reportarErro(r.erro);
        return;
      }
      salvos.current.delete(linhaId);
      limparErro();
    });
  }

  // ── navegação ─────────────────────────────────────────────────
  function descer(linhaId: string, key: string) {
    const idx = linhas.findIndex((l) => l.id === linhaId);
    const abaixo = linhas[idx + 1];
    const alvo = abaixo ? `${abaixo.id}:${key}` : `nova:${key}`;
    refs.current.get(alvo)?.focus();
  }

  const total =
    colunaTotal !== undefined
      ? linhas.reduce((a, l) => a + (lerMoeda(l.valores[colunaTotal] ?? "") ?? 0), 0)
      : null;

  const visivel = (c: Campo, valores: Record<string, string>) =>
    !c.visivelSe || (valores[c.visivelSe.campo] ?? "") === c.visivelSe.valor;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-end min-h-5">
        <IndicadorSalvo estado={estado} />
      </div>

      <div className="overflow-x-auto -mx-2">
        <table className="w-full min-w-[640px] border-separate border-spacing-0">
          <caption className="sr-only">{titulo}</caption>
          <thead>
            <tr>
              {campos.map((c) => (
                <th
                  key={c.key}
                  scope="col"
                  className={`px-2 pb-2 font-inter text-xs font-medium text-slate-400 text-left ${largura(c)}`}
                >
                  {c.label}
                </th>
              ))}
              {comPin && (
                <th scope="col" className="w-10">
                  <span className="sr-only">Fixar ajuste</span>
                </th>
              )}
              <th scope="col" className="w-10">
                <span className="sr-only">Ações</span>
              </th>
            </tr>
          </thead>

          <tbody>
            {linhas.length === 0 && (
              <tr>
                <td
                  colSpan={campos.length + (comPin ? 2 : 1)}
                  className="px-2 py-4 font-inter text-sm text-slate-400"
                >
                  {vazio}
                </td>
              </tr>
            )}

            {linhas.map((l) => (
              <tr key={l.id} className="group">
                {campos.map((c) => (
                  <td key={c.key} className="px-0.5 py-0.5 border-t border-slate-50 align-middle">
                    <CelulaEditavel
                      campo={c}
                      valor={l.valores[c.key] ?? ""}
                      desabilitada={!visivel(c, l.valores)}
                      aoConfirmar={(v) => confirmarCelula(l.id, c.key, v)}
                      aoEnter={() => descer(l.id, c.key)}
                      registrarRef={(el) => {
                        const chave = `${l.id}:${c.key}`;
                        if (el) refs.current.set(chave, el as HTMLInputElement);
                        else refs.current.delete(chave);
                      }}
                    />
                  </td>
                ))}
                {comPin && (
                  <td className="px-1 py-0.5 border-t border-slate-50 text-right">
                    <PinPermanente
                      persistencia={l.persistencia ?? "herdado"}
                      aoAlternar={() => alternarPin(l.id)}
                    />
                  </td>
                )}
                <td className="px-1 py-0.5 border-t border-slate-50 text-right">
                  {removendo === l.id ? (
                    <button
                      type="button"
                      onClick={() => remover(l.id)}
                      onBlur={() => setRemovendo(null)}
                      className="font-inter text-xs text-red-700 bg-red-50 border border-red-100 rounded-md px-2 py-1 cursor-pointer whitespace-nowrap"
                    >
                      Remover?
                    </button>
                  ) : (
                    <button
                      type="button"
                      aria-label={`Remover ${esquema.singular.toLowerCase()}`}
                      onClick={() => setRemovendo(l.id)}
                      className="p-1.5 text-slate-300 hover:text-red-600 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </td>
              </tr>
            ))}

            {/* A linha fantasma: digitar aqui cria o registro. */}
            <tr key={`nova-${geracaoNova}`}>
              {campos.map((c) => (
                <td key={c.key} className="px-0.5 py-0.5 border-t border-slate-100 align-middle">
                  <CelulaEditavel
                    campo={c}
                    valor={nova[c.key] ?? ""}
                    desabilitada={!visivel(c, nova)}
                    aoConfirmar={(v) => confirmarNova(c.key, v)}
                    registrarRef={(el) => {
                      const chave = `nova:${c.key}`;
                      if (el) refs.current.set(chave, el as HTMLInputElement);
                      else refs.current.delete(chave);
                    }}
                  />
                </td>
              ))}
              {comPin && <td className="border-t border-slate-100" />}
              <td className="border-t border-slate-100" />
            </tr>
          </tbody>

          {total !== null && (
            <tfoot>
              <tr>
                {campos.map((c, i) => (
                  <td
                    key={c.key}
                    className="px-2 pt-2 border-t border-slate-200 font-inter text-sm"
                  >
                    {i === 0 && <span className="font-medium text-slate-500">Total</span>}
                    {c.key === colunaTotal && (
                      <span className="block text-right tabular-nums font-medium text-brand-950">
                        R$ {escreverMoeda(total)}
                      </span>
                    )}
                  </td>
                ))}
                {comPin && <td className="border-t border-slate-200" />}
                <td className="border-t border-slate-200" />
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}

const ehProvisorio = (id: string) => id.startsWith("nova:");

/** Largura da coluna pelo tipo do campo — texto estica, número não. */
function largura(c: Campo): string {
  switch (c.tipo) {
    case "moeda":
    case "decimal":
      return "w-32";
    case "inteiro":
      return "w-24";
    case "select":
      return "w-40";
    case "mes":
      return "w-36";
    case "meses":
      return "w-44";
    case "bool":
      return "w-16";
    default:
      return "";
  }
}
