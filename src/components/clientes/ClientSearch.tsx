"use client";

import { Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

/**
 * Busca de clientes. O termo vive na URL — assim um resultado é compartilhável
 * e o botão voltar faz o que se espera.
 *
 * O `debounce` existe porque cada mudança de URL revalida o componente servidor;
 * sem ele, digitar um nome de sete letras dispararia sete renders.
 */
export function ClientSearch() {
  const router = useRouter();
  const params = useSearchParams();
  const [termo, setTermo] = useState(params.get("q") ?? "");
  const [pendente, startTransition] = useTransition();

  useEffect(() => {
    const atual = params.get("q") ?? "";
    if (termo === atual) return;

    const t = setTimeout(() => {
      const próximos = new URLSearchParams(params);
      if (termo.trim()) próximos.set("q", termo.trim());
      else próximos.delete("q");
      startTransition(() => router.replace(`/clientes?${próximos}`));
    }, 250);

    return () => clearTimeout(t);
  }, [termo, params, router]);

  return (
    <div className="relative">
      <Search
        className={`w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${
          pendente ? "text-brand-600" : "text-slate-400"
        }`}
      />
      <input
        type="search"
        value={termo}
        onChange={(e) => setTermo(e.target.value)}
        placeholder="Buscar cliente..."
        aria-label="Buscar cliente"
        className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-transparent text-slate-800 placeholder-slate-400 w-64 shadow-sm font-inter"
      />
    </div>
  );
}
