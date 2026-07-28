import type { Metadata } from "next";
import { Page } from "@/components/layout/Page";
import { FiltroAgenda } from "@/components/agenda/FiltroAgenda";
import { CalendarioAgenda } from "@/components/agenda/CalendarioAgenda";
import { listMeetings } from "@/lib/agenda-dal";
import { listClients } from "@/lib/planning-dal";
import { getCurrentUser, listOrgUsers } from "@/lib/dal";

export const metadata: Metadata = {
  title: "Agenda — HFC Hub",
};

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ planejador?: string; cliente?: string }>;
}) {
  const [{ planejador, cliente }, reunioes, clientes, planejadores, usuario] =
    await Promise.all([
      searchParams,
      listMeetings(),
      listClients(),
      listOrgUsers(),
      getCurrentUser(),
    ]);

  const filtradas = reunioes.filter(
    (r) =>
      (!planejador || r.plannerId === planejador) &&
      (!cliente || r.clienteId === cliente),
  );

  const opcoesClientes = clientes.map((c) => ({ id: c.id, nome: c.nome }));
  const opcoesPlanejadores = planejadores.map((p) => ({
    id: p.id,
    nome: p.nome ?? p.email ?? "Sem nome",
  }));

  return (
    <Page
      title="Agenda"
      subtitle="Reuniões da consultoria, em um só lugar."
      actions={
        <FiltroAgenda planejadores={opcoesPlanejadores} clientes={opcoesClientes} />
      }
    >
      <CalendarioAgenda
        reunioes={filtradas}
        clientes={opcoesClientes}
        planejadores={opcoesPlanejadores}
        usuarioAtualId={usuario?.id ?? ""}
      />
    </Page>
  );
}
