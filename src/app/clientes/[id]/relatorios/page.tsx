import { FileText } from "lucide-react";
import { ComingSoon } from "@/components/ui/ComingSoon";

export default function RelatoriosCliente() {
  return (
    <>
      <header className="p-8 pb-6 shrink-0 border-b border-slate-200/60 bg-white shadow-sm">
        <h1 className="font-poppins font-medium text-2xl text-brand-950">Relatórios</h1>
      </header>

      <div className="flex-1 overflow-y-auto p-8">
        <ComingSoon
          icon={FileText}
          title="Em construção"
          description="Em breve você vai poder gerar e consultar aqui o histórico de relatórios em PDF deste cliente."
        />
      </div>
    </>
  );
}
