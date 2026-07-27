import { Gift } from "lucide-react";
import { ComingSoon } from "@/components/ui/ComingSoon";

export default function IndicacoesCliente() {
  return (
    <>
      <header className="p-8 pb-6 shrink-0 border-b border-slate-200/60 bg-white shadow-sm">
        <h1 className="font-poppins font-medium text-2xl text-brand-950">
          Rewards
        </h1>
      </header>

      <div className="flex-1 overflow-y-auto p-8">
        <ComingSoon
          icon={Gift}
          title="Em construção"
          description="Em breve você vai ver aqui os pontos, o tier e o histórico de indicações e resgates deste cliente."
        />
      </div>
    </>
  );
}
