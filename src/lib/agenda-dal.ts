import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { verifySession } from "@/lib/dal";

export interface Meeting {
  id: string;
  quando: string;
  notas: string | null;
  clienteId: string | null;
  clienteNome: string | null;
  plannerId: string | null;
  plannerNome: string | null;
}

type MeetingRow = {
  id: string;
  quando: string;
  notas: string | null;
  client_id: string | null;
  planner_id: string | null;
  client: { nome: string } | null;
  app_user: { nome: string | null } | null;
};

export const listMeetings = cache(async (): Promise<Meeting[]> => {
  await verifySession();
  const supabase = await createClient();

  const { data } = await supabase
    .from("meeting")
    .select("id, quando, notas, client_id, planner_id, client(nome), app_user(nome)")
    .order("quando")
    .returns<MeetingRow[]>();

  return (data ?? []).map((m) => ({
    id: m.id,
    quando: m.quando,
    notas: m.notas,
    clienteId: m.client_id,
    clienteNome: m.client?.nome ?? null,
    plannerId: m.planner_id,
    plannerNome: m.app_user?.nome ?? null,
  }));
});
