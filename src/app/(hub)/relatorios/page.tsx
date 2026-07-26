import type { Metadata } from "next";
import { FileText } from "lucide-react";
import { Page } from "@/components/layout/Page";
import { ComingSoon } from "@/components/ui/ComingSoon";

export const metadata: Metadata = {
  title: "Relatórios — HFC Hub",
};

export default function RelatoriosPage() {
  return (
    <Page title="Relatórios" subtitle="Todos os relatórios gerados para os clientes.">
      <ComingSoon
        icon={FileText}
        title="Relatórios em construção"
        description="Em breve você vai ver aqui o histórico de relatórios de todos os clientes, filtrando por rascunho ou publicado."
      />
    </Page>
  );
}
