import type { Metadata } from "next";
import { CalendarDays } from "lucide-react";
import { Page } from "@/components/layout/Page";
import { ComingSoon } from "@/components/ui/ComingSoon";

export const metadata: Metadata = {
  title: "Agenda — HFC Hub",
};

export default function AgendaPage() {
  return (
    <Page title="Agenda" subtitle="Reuniões da consultoria, em um só lugar.">
      <ComingSoon
        icon={CalendarDays}
        title="Agenda em construção"
        description="Em breve você vai ver aqui todas as reuniões da consultoria, com filtro por planejador e por cliente."
      />
    </Page>
  );
}
