"use client";

import { useId, useState } from "react";

const MESES = [
  { n: 1, curto: "Jan" },
  { n: 2, curto: "Fev" },
  { n: 3, curto: "Mar" },
  { n: 4, curto: "Abr" },
  { n: 5, curto: "Mai" },
  { n: 6, curto: "Jun" },
  { n: 7, curto: "Jul" },
  { n: 8, curto: "Ago" },
  { n: 9, curto: "Set" },
  { n: 10, curto: "Out" },
  { n: 11, curto: "Nov" },
  { n: 12, curto: "Dez" },
];

const LONGO = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

/**
 * Os quadradinhos dos meses.
 *
 * Doze alvos numa grade, e não um multi-select: o planejador está marcando um
 * padrão do calendário ("cai em janeiro, fevereiro e março"), e a grade mostra
 * o padrão como forma — dá para ver de relance que são três meses seguidos no
 * começo do ano, coisa que uma lista de rótulos não entrega.
 *
 * O valor viaja num input escondido como "1,2,3": é o que a Server Action lê e
 * o que a coluna `smallint[]` guarda, sem tradução no meio.
 */
export function SeletorMeses({
  name,
  defaultValue,
  required = false,
  id,
  onChange,
  ...aria
}: {
  name: string;
  /** Lista já marcada, como "1,2,3". */
  defaultValue?: string;
  required?: boolean;
  id?: string;
  /**
   * Avisa cada mudança, no mesmo formato "1,2,3" do input escondido.
   *
   * O formulário de diálogo não precisa (o valor viaja no FormData no envio),
   * mas o grid grava no blur — e sem o aviso ele não teria o que gravar.
   */
  onChange?: (valor: string) => void;
  "aria-label"?: string;
  "aria-describedby"?: string;
}) {
  const autoId = useId();
  const idGrupo = id ?? autoId;

  const [marcados, setMarcados] = useState<number[]>(() =>
    (defaultValue ?? "")
      .split(",")
      .map((p) => Number(p.trim()))
      .filter((n) => Number.isInteger(n) && n >= 1 && n <= 12),
  );

  function alternar(mes: number) {
    setMarcados((atuais) => {
      const novos = atuais.includes(mes)
        ? atuais.filter((m) => m !== mes)
        : [...atuais, mes].sort((a, b) => a - b);
      onChange?.(novos.join(","));
      return novos;
    });
  }

  return (
    <div>
      {/* `required` no escondido faria o navegador tentar focar um campo que
          não se vê. A obrigatoriedade é validada no servidor, que é onde ela
          precisa valer de qualquer forma. */}
      <input type="hidden" name={name} value={marcados.join(",")} />

      <div
        role="group"
        id={idGrupo}
        aria-label={aria["aria-label"] ?? "Meses"}
        aria-describedby={aria["aria-describedby"]}
        className="grid grid-cols-6 gap-1.5"
      >
        {MESES.map((m) => {
          const ativo = marcados.includes(m.n);
          return (
            <button
              key={m.n}
              type="button"
              aria-pressed={ativo}
              aria-label={LONGO[m.n - 1]}
              onClick={() => alternar(m.n)}
              className={`h-9 rounded-lg border font-inter text-xs transition-colors cursor-pointer ${
                ativo
                  ? "bg-brand-600 border-brand-600 text-white font-medium"
                  : "bg-white border-slate-200 text-slate-500 hover:border-brand-300 hover:text-brand-950"
              }`}
            >
              {m.curto}
            </button>
          );
        })}
      </div>

      <p className="font-inter text-xs text-slate-400 mt-1.5" aria-live="polite">
        {marcados.length === 0
          ? "Nenhum mês marcado."
          : `${marcados.length} ${marcados.length === 1 ? "mês" : "meses"} por ano${
              required && marcados.length === 0 ? " — escolha pelo menos um" : ""
            }`}
      </p>
    </div>
  );
}
