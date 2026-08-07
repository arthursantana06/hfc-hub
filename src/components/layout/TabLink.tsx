"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface TabLinkProps {
  /** Pode trazer query string — ela é ignorada na comparação de atividade. */
  href: string;
  label: string;
  /**
   * Ativo por prefixo de caminho em vez de igualdade exata.
   *
   * A aba de tipo (Pré-HFC / HFC / Real) continua ativa em qualquer seção
   * dentro dela; a aba de seção continua exata.
   */
  prefixo?: boolean;
}

export function TabLink({ href, label, prefixo }: TabLinkProps) {
  const pathname = usePathname();
  const caminho = href.split("?")[0];
  const isActive = prefixo ? pathname.startsWith(caminho) : pathname === caminho;

  return (
    <Link
      href={href}
      className={
        isActive
          ? "border-b-2 border-brand-600 text-brand-600 font-medium pb-3 transition-colors whitespace-nowrap"
          : "border-b-2 border-transparent text-slate-500 hover:text-brand-950 pb-3 transition-colors whitespace-nowrap"
      }
    >
      {label}
    </Link>
  );
}
