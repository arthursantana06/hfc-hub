"use client";

import { Printer } from "lucide-react";

/**
 * Dispara a impressão do documento.
 *
 * O PDF sai daqui: "Imprimir → Salvar como PDF". Montar o arquivo no servidor
 * exigiria um Chromium headless numa função serverless — dezenas de megabytes a
 * cada geração, para produzir o mesmo resultado que o navegador já produz.
 */
export function BotaoImprimir() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-900 text-white font-poppins font-medium text-sm rounded-lg transition-colors cursor-pointer"
    >
      <Printer className="w-4 h-4" />
      Imprimir ou salvar em PDF
    </button>
  );
}
