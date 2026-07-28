import type { Metadata } from "next";
import { Page } from "@/components/layout/Page";
import { FiltroAgenda } from "@/components/agenda/FiltroAgenda";
import { CalendarioAgenda } from "@/components/agenda/CalendarioAgenda";
import { listMeetings, listPessoasSelecionaveis } from "@/lib/agenda-dal";
import { listClients } from "@/lib/planning-dal";
import { getCurrentUser } from "@/lib/dal";

export const metadata: Metadata = {
  title: "Agenda — HFC Hub",
};

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ colaborador?: string; cliente?: string }>;
}) {
  const [{ colaborador, cliente }, reunioes, clientes, pessoas, usuario] =
    await Promise.all([
      searchParams,
      listMeetings(),
      listClients(),
      listPessoasSelecionaveis(),
      getCurrentUser(),
    ]);

  const filtradas = reunioes.filter(
    (r) =>
      (!colaborador || r.participantes.some((p) => p.id === colaborador)) &&
      (!cliente || r.clienteId === cliente),
  );

  const opcoesClientes = clientes.map((c) => ({ id: c.id, nome: c.nome }));

  return (
    <Page
      title="Agenda"
      subtitle="Reuniões da consultoria, em um só lugar."
      actions={<FiltroAgenda pessoas={pessoas} clientes={opcoesClientes} />}
    >
      <CalendarioAgenda
        reunioes={filtradas}
        clientes={opcoesClientes}
        pessoas={pessoas}
        usuarioAtualId={usuario?.id ?? ""}
      />
    </Page>
  );
}
