import type { Enums } from "@/lib/supabase/database.types";

/**
 * A herança híbrida: como um período do Planejamento Real nasce.
 *
 * A reunião de acompanhamento não começa numa tela em branco nem numa cópia
 * cega do mês passado. Ela começa no HFC — o plano combinado — com os ajustes
 * que o planejador marcou como permanentes já aplicados. É a diferença entre
 * "o cliente prometeu gastar 2.000 com mercado" (HFC, sempre a referência) e
 * "o aluguel subiu para 2.800 e vai ficar assim" (permanente, viaja adiante),
 * sem arrastar "neste mês teve o conserto do carro" (pontual, morre no mês).
 *
 * Função pura de propósito: é a regra mais delicada do produto — errar aqui
 * corrompe o histórico de um cliente em silêncio — e testá-la contra o banco
 * significaria montar três períodos a cada caso.
 */

type Persistencia = Enums<"row_persistence">;

/** O mínimo que a herança precisa saber de uma linha. O resto viaja junto. */
export interface LinhaHerdavel {
  id: string;
  base_id: string | null;
  persistencia: Persistencia;
  suprimido: boolean;
  [campo: string]: unknown;
}

/**
 * Monta as linhas de um período novo do Real.
 *
 * `hfc` são as linhas vivas do planejamento HFC (uma tabela por vez).
 * `anterior` são as do período imediatamente anterior — incluindo as
 * suprimidas, que é o que impede um tombstone permanente de ser esquecido.
 * `null` significa que este é o primeiro período.
 *
 * O que volta são linhas prontas para inserir, ainda com o `id` da origem: quem
 * chama descarta `id`/`created_at` e aponta o `plan_id` novo. Devolver o objeto
 * inteiro (e não só a linhagem) é o que mantém a função ignorante sobre quais
 * colunas cada tabela tem — receita, dívida e objetivo passam pela mesma regra.
 */
export function montarPeriodoReal(
  hfc: LinhaHerdavel[],
  anterior: LinhaHerdavel[] | null,
): LinhaHerdavel[] {
  const vivasDoHfc = hfc.filter((l) => !l.suprimido);

  // Primeiro período: o Real começa sendo o HFC, inteiro e intocado.
  if (anterior === null) {
    return vivasDoHfc.map((l) => herdarDe(l));
  }

  const porId = new Map(vivasDoHfc.map((l) => [l.id, l]));
  const novas: LinhaHerdavel[] = [];
  // Quais linhas do HFC já têm representante — o que a varredura final ignora.
  const representadas = new Set<string>();

  for (const linha of anterior) {
    if (linha.persistencia === "permanente") {
      // Viaja como está: o valor ajustado, e a supressão se houver. `base_id`
      // continua apontando para a linha do HFC (ou é nulo, se a linha nasceu
      // no Real) — a cadeia sempre resolve contra o HFC, nunca contra o mês
      // anterior, senão bastariam dois períodos para a origem se perder.
      novas.push({ ...linha });
      if (linha.base_id) representadas.add(linha.base_id);
      continue;
    }

    if (linha.persistencia === "herdado") {
      // Não foi tocada no mês passado: recopia FRESCA do HFC. É isto que faz
      // uma correção no HFC alcançar os períodos seguintes.
      const base = linha.base_id ? porId.get(linha.base_id) : undefined;
      if (!base) continue; // a base saiu do HFC — a linha vai junto
      novas.push(herdarDe(base));
      representadas.add(base.id);
      continue;
    }

    // `mes`: ajuste pontual. Não sobrevive à virada. Se tinha base no HFC, a
    // varredura abaixo a traz de volta como herdada — que é o comportamento
    // desejado: o mês excepcional acabou, volta a valer o combinado.
  }

  // Tudo do HFC que ainda não tem representante entra como herdado. Cobre a
  // linha criada no HFC depois que o Real começou e ressuscita o que foi
  // suprimido só naquele mês.
  for (const base of vivasDoHfc) {
    if (!representadas.has(base.id)) novas.push(herdarDe(base));
  }

  return novas;
}

/** Uma cópia limpa de uma linha do HFC, marcada como herdada. */
function herdarDe(base: LinhaHerdavel): LinhaHerdavel {
  return { ...base, base_id: base.id, persistencia: "herdado", suprimido: false };
}
