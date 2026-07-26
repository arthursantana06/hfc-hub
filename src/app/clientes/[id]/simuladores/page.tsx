import { Calculator } from "lucide-react";
import { ComingSoon } from "@/components/ui/ComingSoon";

export default function SimuladoresCliente() {
  return (
    <>
      <header className="p-8 pb-6 shrink-0 border-b border-slate-200/60 bg-white shadow-sm">
        <h1 className="font-poppins font-medium text-2xl text-brand-950">Simuladores</h1>
      </header>

      <div className="flex-1 overflow-y-auto p-8">
        <ComingSoon
          icon={Calculator}
          title="Em construção"
          description="Em breve você vai poder simular aposentadoria, aportes e cenários de projeção patrimonial para este cliente."
        />
      </div>
    </>
  );
}
