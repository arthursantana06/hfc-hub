"use client";

import { useState } from "react";

/**
 * Campo de dinheiro que separa milhar com ponto e insere a vírgula decimal
 * automaticamente enquanto digita, sem o usuário precisar digitar o ponto.
 *
 * A vírgula continua sendo digitada por quem usa — só o agrupamento de
 * milhar é automático. Isso casa com `lerMoeda`/`escreverMoeda`: vírgula é
 * sempre o separador decimal, ponto é sempre milhar, nunca o contrário.
 * Uma máscara "efeito calculadora" (tudo lido como centavos, da direita
 * para a esquerda) foi cogitada e descartada: colar "1234" (sem vírgula)
 * viraria R$ 12,34 em vez de R$ 1.234,00 — surpresa ruim para quem cola um
 * valor copiado de uma planilha.
 */
export function InputMoeda({
  name,
  id,
  required,
  defaultValue = "",
  placeholder = "0,00",
  className = "",
  "aria-describedby": ariaDescribedBy,
}: {
  name?: string;
  id?: string;
  required?: boolean;
  /** Já no formato que `escreverMoeda` produz, ex. "1.234,56". */
  defaultValue?: string;
  placeholder?: string;
  className?: string;
  "aria-describedby"?: string;
}) {
  const [texto, setTexto] = useState(defaultValue);

  function aoDigitar(bruto: string) {
    setTexto(formatarEnquantoDigita(bruto));
  }

  return (
    <input
      id={id}
      name={name}
      required={required}
      type="text"
      inputMode="decimal"
      value={texto}
      onChange={(e) => aoDigitar(e.target.value)}
      placeholder={placeholder}
      className={className}
      aria-describedby={ariaDescribedBy}
    />
  );
}

/** "1234567,8" digitado → "1.234.567,8" — milhar automático, vírgula do usuário. */
function formatarEnquantoDigita(bruto: string): string {
  const temVirgula = bruto.includes(",");
  const [parteInt, parteDecBruta = ""] = bruto.split(",");

  const digitosInt = parteInt.replace(/\D/g, "").replace(/^0+(?=\d)/, "");
  const comMilhar = digitosInt.replace(/\B(?=(\d{3})+(?!\d))/g, ".");

  if (!temVirgula) return comMilhar;

  const digitosDec = parteDecBruta.replace(/\D/g, "").slice(0, 2);
  return `${comMilhar},${digitosDec}`;
}
