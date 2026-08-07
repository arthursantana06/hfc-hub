/**
 * Tradução dos erros do Postgres para o que o planejador precisa saber.
 *
 * Mora fora dos arquivos de Server Action porque num módulo `"use server"` toda
 * exportação tem de ser uma função assíncrona — uma função síncrona
 * compartilhada entre duas actions não pode viver lá.
 */
export function mensagem(raw: string): string {
  if (raw.includes("row-level security")) {
    return "Você não tem permissão para esta alteração.";
  }
  if (raw.includes("financial_plan_um_ativo_idx")) {
    return "Este cliente já tem um plano ativo. Arquive-o antes de criar outro.";
  }
  if (raw.includes("violates foreign key")) {
    return "Há um vínculo inválido no formulário. Recarregue a página.";
  }
  if (raw.includes("_fim_apos_inicio")) {
    return "A data final não pode ser anterior à inicial.";
  }
  if (raw.includes("vencimento_apos_aplicacao")) {
    return "O vencimento não pode ser anterior à data da aplicação.";
  }
  if (raw.includes("card_statement_record_id_cartao_categoria_key")) {
    return "Já existe uma linha para esse cartão nessa categoria. Edite a existente.";
  }
  if (raw.includes("monthly_record_client_id_ref_mes_key")) {
    return "Este mês já foi aberto.";
  }
  return "Não foi possível salvar. Tente de novo.";
}
