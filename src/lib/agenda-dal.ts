import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { verifySession } from "@/lib/dal";

/** Uma pessoa selecionável para uma reunião — staff (com papel) ou cliente. */
export interface Pessoa {
  id: string;
  nome: string;
  tipo: "staff" | "cliente";
  /** Só para `tipo: "staff"`. */
  role?: "admin" | "planner";
}

export interface Meeting {
  id: string;
  quando: string;
  notas: string | null;
  clienteId: string | null;
  clienteNome: string | null;
  participantes: Pessoa[];
}

type ParticipanteRow = {
  app_user_id: string | null;
  client_id: string | null;
  app_user: { nome: string | null; role: string } | null;
  client: { nome: string } | null;
};

type MeetingRow = {
  id: string;
  quando: string;
  notas: string | null;
  client_id: string | null;
  client: { nome: string } | null;
  meeting_participante: ParticipanteRow[];
};

function paraPessoa(p: ParticipanteRow): Pessoa | null {
  if (p.app_user_id && p.app_user) {
    return {
      id: p.app_user_id,
      nome: p.app_user.nome ?? "—",
      tipo: "staff",
      role: p.app_user.role === "admin" ? "admin" : "planner",
    };
  }
  if (p.client_id && p.client) {
    return { id: p.client_id, nome: p.client.nome, tipo: "cliente" };
  }
  return null;
}

export const listMeetings = cache(async (): Promise<Meeting[]> => {
  await verifySession();
  const supabase = await createClient();

  const { data } = await supabase
    .from("meeting")
    .select(
      "id, quando, notas, client_id, client(nome), " +
        "meeting_participante(app_user_id, client_id, app_user(nome, role), client(nome))",
    )
    .order("quando")
    .returns<MeetingRow[]>();

  return (data ?? []).map((m) => ({
    id: m.id,
    quando: m.quando,
    notas: m.notas,
    clienteId: m.client_id,
    clienteNome: m.client?.nome ?? null,
    participantes: (m.meeting_participante ?? [])
      .map(paraPessoa)
      .filter((p): p is Pessoa => p !== null),
  }));
});

/** Quem pode ser convidado para uma reunião: staff (admin/planejador) e clientes. */
export const listPessoasSelecionaveis = cache(async (): Promise<Pessoa[]> => {
  await verifySession();
  const supabase = await createClient();

  const [{ data: staff }, { data: clientes }] = await Promise.all([
    supabase
      .from("app_user")
      .select("id, nome, role")
      .in("role", ["admin", "planner"])
      .order("nome"),
    supabase.from("client").select("id, nome").order("nome"),
  ]);

  const pessoasStaff: Pessoa[] = (staff ?? []).map((u) => ({
    id: u.id,
    nome: u.nome ?? "—",
    tipo: "staff",
    role: u.role === "admin" ? "admin" : "planner",
  }));
  const pessoasClientes: Pessoa[] = (clientes ?? []).map((c) => ({
    id: c.id,
    nome: c.nome,
    tipo: "cliente",
  }));

  return [...pessoasStaff, ...pessoasClientes];
});
