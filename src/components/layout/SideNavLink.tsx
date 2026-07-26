"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";

interface SideNavLinkProps {
  href: string;
  icon: LucideIcon;
  label: string;
  exact?: boolean;
  /** Item previsto mas ainda não implementado: aparece apagado e não navega. */
  soon?: boolean;
}

const BASE = "flex items-center gap-3 px-4 py-3 rounded-lg border-l-4 transition-colors";

export function SideNavLink({
  href,
  icon: Icon,
  label,
  exact = false,
  soon = false,
}: SideNavLinkProps) {
  const pathname = usePathname();
  const isActive = exact ? pathname === href : pathname.startsWith(href);

  // Sem isso, "Investimentos" era um href="#" que parecia clicável e não ia a
  // lugar nenhum — o usuário clicava e concluía que estava quebrado.
  if (soon) {
    return (
      <span
        aria-disabled="true"
        className={`${BASE} border-transparent text-brand-300/40 cursor-not-allowed select-none`}
      >
        <Icon className="w-5 h-5" />
        <span className="font-inter text-sm">{label}</span>
        <span className="ml-auto font-inter text-[10px] uppercase tracking-wide text-brand-300/40">
          Em breve
        </span>
      </span>
    );
  }

  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      className={
        isActive
          ? `${BASE} bg-brand-600 text-white border-white`
          : `${BASE} border-transparent text-brand-300 hover:bg-brand-600/50 hover:text-white`
      }
    >
      <Icon className="w-5 h-5" />
      <span className={`font-inter text-sm ${isActive ? "font-medium" : ""}`}>
        {label}
      </span>
    </Link>
  );
}
