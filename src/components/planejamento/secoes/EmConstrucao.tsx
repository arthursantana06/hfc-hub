import { Hammer } from "lucide-react";

/** Marcador honesto das seções ainda não construídas na remodelação. */
export function EmConstrucao({ nome }: { nome: string }) {
  return (
    <div className="max-w-7xl mx-auto">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 flex flex-col items-center gap-3 text-center">
        <Hammer className="w-8 h-8 text-slate-300" />
        <p className="font-poppins font-medium text-lg text-brand-950">{nome}</p>
        <p className="font-inter text-sm text-slate-500">
          Esta seção está sendo remodelada e chega em breve.
        </p>
      </div>
    </div>
  );
}
