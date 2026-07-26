import type { Metadata } from "next";
import { LineChart } from "lucide-react";
import { Page } from "@/components/layout/Page";
import { ComingSoon } from "@/components/ui/ComingSoon";

export const metadata: Metadata = {
  title: "Investimentos — HFC Hub",
};

export default function InvestimentosPage() {
  return (
    <Page
      title="Investimentos"
      subtitle="Visão consolidada das carteiras de todos os clientes."
    >
      <ComingSoon
        icon={LineChart}
        title="Cockpit de investimentos em construção"
        description="Em breve: alocação agregada por classe, clientes que precisam de rebalanceamento e status de sincronização com a Renda Fixa."
      />
    </Page>
  );
}
