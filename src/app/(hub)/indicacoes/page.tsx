import type { Metadata } from "next";
import { Gift } from "lucide-react";
import { Page } from "@/components/layout/Page";
import { ComingSoon } from "@/components/ui/ComingSoon";

export const metadata: Metadata = {
  title: "Indicações & Recompensas — HFC Hub",
};

export default function IndicacoesPage() {
  return (
    <Page
      title="Indicações & Recompensas"
      subtitle="Programa de indicação e recompensas da consultoria."
    >
      <ComingSoon
        icon={Gift}
        title="Programa em construção"
        description="Em breve: indicações recebidas, pontos distribuídos por cliente e o catálogo de recompensas."
      />
    </Page>
  );
}
