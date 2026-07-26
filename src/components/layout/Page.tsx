import { Logo } from "./Logo";

/**
 * Casca padrão das telas do hub: cabeçalho fixo, corpo rolável e rodapé.
 *
 * Antes cada página resolvia isso do seu jeito — no Dashboard e em
 * Configurações o cabeçalho subia junto com o conteúdo, no Hub de Clientes
 * ficava parado. Aqui só o corpo rola, em todas.
 */
export function Page({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
      <header className="shrink-0 flex items-center justify-between gap-6 px-8 py-5 bg-white border-b border-slate-200">
        <div className="min-w-0">
          <h1 className="font-poppins font-medium text-2xl text-brand-950 truncate">
            {title}
          </h1>
          {subtitle && (
            <p className="font-inter text-sm text-slate-500 mt-0.5">{subtitle}</p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-4 shrink-0">{actions}</div>
        )}
      </header>

      <div className="flex-1 overflow-y-auto px-8 py-8">{children}</div>

      <footer className="shrink-0 flex items-center justify-between px-8 py-3 bg-white border-t border-slate-200">
        <div className="flex items-center gap-2">
          <Logo size="sm" className="h-7 w-7 opacity-60" />
          <span className="font-inter text-xs text-slate-400">
            HFC Hub · plataforma interna da consultoria
          </span>
        </div>
        <span className="font-inter text-xs text-slate-400">
          Fase 0 — em construção
        </span>
      </footer>
    </div>
  );
}
