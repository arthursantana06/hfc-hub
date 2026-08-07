"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/dal";
import { mensagem } from "./mensagens";
import { gravarLinha, type Estado } from "./planejamento";

/**
 * Grava a posição e o retrato do valor dela.
 *
 * Duas tabelas numa submissão só, porque para quem preenche é um só fato: "tenho
 * este CDB, e hoje ele vale isto". A posição vai pelo caminho genérico —
 * `gravarLinha` valida contra o mesmo esquema que a tela montou — e o valor,
 * que é campo `virtual`, vira uma linha de `position_snapshot` com a data ao lado.
 *
 * Guardar o valor na própria posição seria mais simples e destruiria o histórico
 * na primeira atualização: o retrato do mês passado é o que torna rentabilidade
 * calculável depois.
 */
export async function salvarPosicao(
  _estado: Estado,
  form: FormData,
): Promise<Estado> {
  const r = await gravarLinha(form);
  if ("erro" in r) return r;

  const valor = r.virtuais.valor_bruto;
  const data = r.virtuais.data_referencia;
  if (typeof valor !== "number" || typeof data !== "string") {
    return { erro: "Informe o valor e a data da posição." };
  }

  const user = await getCurrentUser();
  if (!user) return { erro: "Sessão expirada. Entre novamente." };

  const supabase = await createClient();

  // `upsert` e não `insert`: salvar duas vezes no mesmo dia corrige o valor
  // daquele dia em vez de recusar. Trocar a data, por outro lado, acrescenta um
  // retrato novo e preserva o anterior — é assim que a série se forma.
  const { error } = await supabase.from("position_snapshot").upsert(
    {
      org_id: user.org_id,
      position_id: r.id,
      data_referencia: data,
      valor_bruto: valor,
      // Nulo de propósito: sem lote de importação, este valor foi digitado.
      import_batch_id: null,
    },
    { onConflict: "position_id,data_referencia" },
  );

  if (error) return { erro: mensagem(error.message) };

  revalidatePath("/", "layout");
  return { ok: r.criado ? "Posição adicionada." : "Posição atualizada." };
}
