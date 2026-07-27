/**
 * Gera `docs/paridade-referencia.md` — o relatório de paridade contra a planilha.
 *
 * Rodar com `npm run paridade`. O relatório é artefato: fica versionado para
 * que qualquer divergência nova apareça no diff, e não seja descoberta meses
 * depois quando um número não fechar numa reunião.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { referencia } from "../src/lib/planning/__fixtures__/referencia";
import { summarizeBaseline } from "../src/lib/planning/baseline";
import { project } from "../src/lib/planning/project";
import { rotuloCurto, ym, anoDe } from "../src/lib/planning/period";

const brl = (n: number) =>
  n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** `PROJEÇÃO CURTA` linhas 13–24, o trecho inteiramente dirigido por fórmula. */
const PLANILHA: Record<number, { receitas: number; despesas: number; dividas: number; sobras: number; patrimonio: number }> = {
  [ym(2026, 8)]:  { receitas: 49015.14, despesas: -18018.07, dividas: -18363.60, sobras: 12633.47, patrimonio: 48717.55 },
  [ym(2026, 9)]:  { receitas: 56220.19, despesas: -18018.07, dividas: -16826.60, sobras: 21375.52, patrimonio: 70555.34 },
  [ym(2026, 10)]: { receitas: 49015.14, despesas: -17686.07, dividas: -16826.60, sobras: 14502.47, patrimonio: 85727.29 },
  [ym(2026, 11)]: { receitas: 49015.14, despesas: -17512.07, dividas: -16826.60, sobras: 14676.47, patrimonio: 226017.21 },
  [ym(2026, 12)]: { receitas: 79930.28, despesas: -14512.07, dividas: -23127.71, sobras: 42290.50, patrimonio: 69202.34 },
  [ym(2027, 1)]:  { receitas: 49015.14, despesas: -19006.27, dividas: -21559.04, sobras: 8449.83,  patrimonio: 78308.82 },
  [ym(2027, 2)]:  { receitas: 44215.14, despesas: -14512.07, dividas: -21559.04, sobras: 8144.03,  patrimonio: 87195.90 },
  [ym(2027, 3)]:  { receitas: 44215.14, despesas: -14512.07, dividas: -21559.04, sobras: 8144.03,  patrimonio: 96167.32 },
  [ym(2027, 4)]:  { receitas: 44215.14, despesas: -14512.07, dividas: -21559.04, sobras: 8144.03,  patrimonio: 105223.86 },
  [ym(2027, 5)]:  { receitas: 44215.14, despesas: -14512.07, dividas: -21559.04, sobras: 8144.03,  patrimonio: 114366.34 },
  [ym(2027, 6)]:  { receitas: 44215.14, despesas: -18012.07, dividas: -21559.04, sobras: 4644.03,  patrimonio: -29904.44 },
  [ym(2027, 7)]:  { receitas: 44215.14, despesas: -18012.07, dividas: -21559.04, sobras: 4644.03,  patrimonio: -25544.16 },
};

const r = project(referencia);
const base = summarizeBaseline(referencia);
const porMes = new Map(r.meses.map((m) => [m.periodo, m]));

const linhas: string[] = [];
let divergentes = 0;

for (const chave of Object.keys(PLANILHA).map(Number).sort((a, b) => a - b)) {
  const esperado = PLANILHA[chave];
  const obtido = porMes.get(chave)!;
  const celulas: string[] = [rotuloCurto(chave)];

  for (const col of ["receitas", "despesas", "dividas", "sobras"] as const) {
    const diff = obtido[col] - esperado[col];
    if (Math.abs(diff) < 0.005) {
      celulas.push("=");
    } else {
      divergentes++;
      celulas.push(`**${diff > 0 ? "+" : ""}${brl(diff)}**`);
    }
  }
  linhas.push(`| ${celulas.join(" | ")} |`);
}

const d = r.desfecho;
const ultimo = r.meses[r.meses.length - 1];

const md = `# Paridade — cliente de referência

Gerado por \`npm run paridade\` a partir de
a planilha de acompanhamento em \`past/\`.
Não editar à mão.

Cada célula compara o motor contra a planilha. \`=\` significa idêntico a menos
de um centavo. Um valor significa divergência — e **toda divergência precisa de
causa nomeada** na seção seguinte. Divergência sem causa é bug.

## Janela auditada

Ago/2026 → jul/2027, doze meses. É o trecho que a planilha calcula inteiramente
por fórmula: mar/26 a jul/26 têm valores digitados à mão (são realizado, não
projeção) e a partir de ago/2027 a correção de inflação entra, por desenho.

| mês | receitas | despesas | dívidas | sobras |
|---|---|---|---|---|
${linhas.join("\n")}

**${divergentes} divergência(s)** em ${Object.keys(PLANILHA).length * 4} células.

## Divergências intencionais

### 1. \`Revisão\` anual — jan/2027, −R$ 2.000,00
\`PLANILHA MENSAL!F37\` marca a revisão do carro como **Anual**, mas \`G37\` — o
mês de ocorrência — está em branco. O \`SUMIF\` que reconstitui os custos anuais
nunca a encontra, então ela é subtraída do "mês comum" e **nunca volta**:
R$ 2.000/ano somem do modelo. Aqui ela cai em janeiro.

### 2. Bloco ORÇAMENTO — +R$ ${brl((4494.2 + 2000) / 12)}/mês nos custos fixos
O bloco monta os baldes por \`VLOOKUP\` nos marcadores da coluna C, e **nenhum
custo anual tem marcador**. IPVA e Revisão ficam fora do orçamento inteiro, e o
cliente é medido contra uma meta que ignora esse custo real. Aqui os anuais
entram rateados por 12.

### 3. Projeção longa — crescente, a partir de ago/2027
A planilha usa \`=$F$8 + Δ\` para a despesa de **todo** ano da projeção longa —
referência absoluta ao total de 2028. No modo Nominal, que é o deste plano, o
patrimônio compõe nominalmente contra uma despesa congelada. O motor recompõe a
despesa ano a ano e aplica inflação de ${(referencia.assumptions.inflacao * 100).toFixed(0)}% a.a. no modo Nominal.

### 4. Dívidas com fim próprio — sem efeito na janela auditada
Na planilha o fim de uma parcela é uma linha de mudança que soma o valor de
volta. Aqui a dívida carrega \`inicio\`/\`fim\` e o motor deriva o delta. Os
números batem; o que muda é que esquecer a linha de mudança deixou de fazer uma
dívida correr para sempre.

### 5. \`PROJEÇÃO CURTA!K11\` — remendo manual, fora da janela
A fórmula de jun/2026 termina em \`− 2000\` digitado à mão dentro da expressão
de capitalização. Fora da janela auditada; registrado porque explica por que a
planilha não é confiável célula a célula.

## Linha de base

| item | planilha | motor |
|---|---|---|
| Receita do mês comum (E17) | 49.015,14 | ${brl(base.receitaMensal)} |
| Receita mensalizada (E15) | 51.416,82 | ${brl(base.receitaTotalMensalizada)} |
| Custo do mês comum (E63) | 17.512,07 | ${brl(base.despesaMensal)} |
| Custo mensalizado (E61) | 18.053,25 | ${brl(base.despesaTotalMensalizada)} |
| Parcelas (I17) | 15.357,71 | ${brl(base.parcelasMensais)} (inclui o IR, que lá era mudança) |

## Aposentadoria

| item | valor |
|---|---|
| Ano de aposentadoria | ${d.anoAposentadoria} (aos ${d.idadeAlvo}) |
| Patrimônio na aposentadoria | R$ ${brl(d.patrimonioNaAposentadoria)} |
| Renda INSS | R$ ${brl(d.rendaInss)} |
| Renda privada (rendimento real de um mês) | R$ ${brl(d.rendaPrivada)} |
| **Renda total** | **R$ ${brl(d.rendaTotal)}** |
| Renda desejada | R$ ${brl(d.rendaDesejada)} |
| Ano em que o dinheiro acaba | ${d.anoDeRuina ?? "não acaba"}${d.idadeDeRuina ? ` (aos ${d.idadeDeRuina})` : ""} |

Horizonte projetado: ${r.meses.length} meses, até ${rotuloCurto(ultimo.periodo)} (${anoDe(ultimo.periodo)}).
`;

mkdirSync("docs", { recursive: true });
writeFileSync("docs/paridade-referencia.md", md, "utf8");
console.log(`docs/paridade-referencia.md — ${divergentes} divergência(s) na janela auditada`);
