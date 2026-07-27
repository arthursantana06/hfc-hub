# Guia do Planejador

Manual de uso do módulo de planejamento familiar do HFC Hub.
Escrito a partir do código em `src/lib/planning/`, `src/lib/planning-dal.ts`,
`src/lib/actions/planejamento.ts` e das telas em `src/app/clientes/[id]/`.

---

## 1. O modelo mental

O sistema tem **três camadas** e elas não se misturam:

| Camada | O que é | Onde vive |
|---|---|---|
| **Ponto de Partida** | O retrato financeiro do cliente: quem ele é, quanto entra, quanto sai, o que ele tem, o que quer, o que vai mudar. | `Ponto de Partida` (5 abas) |
| **Diagnóstico** | A projeção calculada a partir do retrato. Não se edita — é consequência. | `Diagnóstico & Metas` |
| **Acompanhamento** | O mês a mês: metas congeladas, lançamentos do realizado, placar, relatório. | `Relatórios` |

A regra que governa tudo: **você só edita a primeira camada.** A segunda é
recalculada a cada carregamento de página, do zero, em menos de um milissegundo.
Não existe botão "recalcular" porque não existe cache — o que você vê é sempre o
resultado do que está gravado agora.

---

## 2. A ordem obrigatória

Os passos abaixo têm dependência real. Pular um deixa a tela seguinte vazia ou
com um botão desabilitado.

```
1. Criar o cliente            → nome + DATA DE NASCIMENTO
2. Criar o plano              → mês de início, modo de valor, 4 taxas
3. Preencher a aposentadoria  → idade-alvo, INSS, renda desejada
4. Lançar o fluxo de caixa    → receitas, custos, dívidas
5. Lançar o patrimônio        → investimentos (obrigatório), ativos/passivos
6. Lançar objetivos e mudanças
7. Ler o Diagnóstico
8. Congelar as metas          → em Relatórios
9. Abrir o primeiro mês       → em Relatórios
10. Lançar o realizado, escrever direcionamentos, publicar
```

### ⚠ Armadilha nº 1 — a data de nascimento

**Sem data de nascimento a projeção inteira não existe**, mesmo com o plano
criado e tudo preenchido. O formulário de cliente não a exige, mas o motor
precisa dela para saber a idade, o ano da aposentadoria e o fim do horizonte.

Sintoma: o *Diagnóstico* e o *Dashboard Resumo* mostram "este cliente ainda não
tem um plano" — mensagem enganosa, porque o plano existe. O que falta é o
nascimento.

Correção: `Ponto de Partida → Cadastro → Dados do cliente → Data de nascimento`.

---

## 3. Passo 1 — Cadastro do cliente

`Clientes → Novo cliente`, ou `Ponto de Partida → Cadastro` para editar.

| Campo | Obrigatório para o motor? | Observação |
|---|---|---|
| Nome | sim (mín. 2 caracteres) | |
| **Data de nascimento** | **sim** | sem ela nada é projetado |
| E-mail, profissão, perfil de risco, adesão, notas | não | metadados de relacionamento |
| Status do plano | não | rótulo (`ativo`/`diagnóstico`/`pendente`), não muda cálculo |

Ao salvar um cliente novo você é levado direto para as premissas do plano.

---

## 4. Passo 2 — Premissas do plano

`Ponto de Partida → Cadastro → Premissas do plano`

Sem plano, **receitas, custos, mudanças, previdência e seguros não têm onde ser
gravados** — o botão "Adicionar" fica cinza com a dica "Crie o plano antes".

### Os campos

**Início do plano** — primeiro mês projetado. Tudo antes disso é passado e o
sistema ignora. Também é a âncora do calendário: a projeção anda mês a mês a
partir daqui, e é este mês que a tela de Relatórios sugere como primeiro mês a
abrir.

**Modo de valor** — a decisão mais consequente do formulário.

- **Nominal** (padrão): receitas e despesas são corrigidas pela inflação a cada
  ano projetado, e o patrimônio rende a taxa cheia. Os números do ano 20 estão
  em reais de 2046 — grandes, mas não comparáveis com hoje.
- **Real**: nada é corrigido; em troca, o retorno é descontado da inflação
  (`(1+juros)/(1+inflação)−1`). Todos os números ficam em poder de compra de
  hoje. É o modo mais honesto para conversar com o cliente.

Trocar o modo depois de congelar as metas invalida a comparação. Decida antes.

**As quatro taxas** (digite em porcentagem: `12`, não `0,12`)

| Taxa | Quando vale | Padrão |
|---|---|---|
| Juros — curto prazo | os primeiros N meses (ver abaixo) | 12% a.a. |
| Juros — longo prazo | do fim do curto até a aposentadoria | 10% a.a. |
| Juros na aposentadoria | da aposentadoria em diante | 4% a.a. |
| Inflação | sempre | 5% a.a. |

Aceita valores entre −100% e 100%. A conversão de porcentagem para fração é
feita ao salvar — você nunca digita `0,12`.

**Meses da projeção curta** (padrão 36) — ⚠ **este campo faz duas coisas**:

1. Define o tamanho da tabela e do gráfico de curto prazo no Diagnóstico.
2. Define **por quanto tempo vale a taxa de juros de curto prazo**.

Aumentar de 36 para 60 meses não só mostra mais linhas: aplica 12% a.a. por
cinco anos em vez de três, e o patrimônio projetado sobe. Não use este campo
para "ver mais meses" sem entender que a projeção muda.

Ele também limita o acompanhamento: **só é possível publicar relatório de meses
dentro desta janela.** Com 36 meses, o acompanhamento para depois de três anos.

**Horizonte (idade limite)** — padrão 101 anos. Até onde a projeção anda.

**Dia de referência / pagamento / fatura** — informativos. Não entram no cálculo.

---

## 5. Passo 3 — Aposentadoria

`Ponto de Partida → Cadastro → Aposentadoria`

| Campo | O que faz no motor |
|---|---|
| Idade de aposentadoria | mês em que o cliente para de trabalhar e a taxa de juros cai para a de aposentadoria |
| Renda do INSS | **substitui integralmente todas as receitas** a partir daquele mês |
| Renda desejada | só comparação; não afeta a projeção, só o diagnóstico |

### ⚠ Armadilha nº 2 — toda receita morre na aposentadoria

A partir da idade-alvo, a receita projetada passa a ser **exclusivamente o valor
do INSS**. Aluguéis, participações societárias, pensões e qualquer receita
recorrente que você tenha cadastrado desaparecem do fluxo.

Se o cliente tem renda que sobrevive à aposentadoria, **some-a ao campo "Renda do
INSS"** — ele é, na prática, "renda mensal na aposentadoria", não apenas o
benefício previdenciário. Registre a composição real no campo de notas do
cliente para não perder a informação.

---

## 6. Passo 4 — Fluxo de caixa

`Ponto de Partida → Fluxo de Caixa`

Quatro blocos: **Receitas**, **Custo de vida**, **Parcelas e dívidas** e
**Orçamento por controlabilidade** (este último é derivado, não editável).

### Receitas

| Campo | Regra |
|---|---|
| Fonte | texto livre |
| Valor | **sempre o valor cheio** — uma receita anual de R$ 12.000 se digita como 12.000, nunca 1.000 |
| Frequência | Mensal ou Anual |
| Mês de ocorrência | só aparece se Anual; é o mês em que o valor cheio entra |
| Tipo | 13º / Férias / Comum — rótulo, não muda cálculo |

A lista mostra as anuais **rateadas por 12** para somarem na mesma coluna que as
mensais. O valor gravado continua cheio. Na projeção, uma receita anual de
R$ 12.000 com ocorrência em dezembro entra como R$ 12.000 **em dezembro** e
R$ 0 nos outros onze meses — não como R$ 1.000/mês.

É por isso que existem dois conceitos de "receita" nas telas:
- **Receita mensalizada** — média, para dimensionar o orçamento;
- **Receita do mês comum** — o que entra num mês sem nenhum evento anual.

### Custo de vida

| Campo | Regra |
|---|---|
| Categoria | obrigatória; vem do catálogo da organização |
| Descrição | opcional; se preenchida, é o que aparece na lista |
| Valor | cheio, mesma regra dos anuais |
| **Controlabilidade** | **Fixo** = não dá para cortar neste mês; **Extra** = dá |
| Frequência / Mês de ocorrência | idem receitas |

A controlabilidade não muda o total — muda o bloco **Orçamento**, que mostra o
custo de vida repartido em *Custos Fixos*, *Gastos extras*, *Parcelas* e
*Adicionais do mês*. É a leitura que responde "quanto deste orçamento é
negociável?". Os *Adicionais* ficam sempre zerados aqui por definição: eles são
o extraordinário de um mês específico e vivem em Mudanças.

### Parcelas e dívidas

| Campo | Regra |
|---|---|
| Descrição, Credor | texto |
| Parcela mensal | valor que sai do caixa por mês |
| Primeira parcela | mês de início; em branco = já está correndo |
| **Última parcela** | ⚠ **em branco = dívida perpétua** |

Deixar "Última parcela" vazio faz a projeção descontar aquela parcela **até os
101 anos do cliente**. A lista marca essas linhas com um aviso âmbar. É o erro
mais fácil de cometer e o mais caro: destrói o patrimônio projetado inteiro.

Preenchendo a data de fim, a quitação vira automática — a parcela some do fluxo
no mês seguinte e aparece na aba *Mudanças* como "Quitações previstas". **Você
não precisa (nem deve) criar uma mudança manual para o fim de uma dívida.**

### ⚠ Armadilha nº 3 — os quatro cartões do topo não fecham

Na tela de Fluxo de Caixa:

```
Receita mensalizada − Custo mensalizado − Parcelas  ≠  Sobras mensais
```

A diferença é **previdência + seguros**, que são debitados nas Sobras mas
cadastrados em outra tela (`Cadastro`) e não aparecem em nenhum dos três
primeiros cartões. Se a conta não bate, é isso.

---

## 7. Passo 5 — Patrimônio

`Ponto de Partida → Patrimônio`

Quatro blocos. **Só um deles alimenta a projeção.**

| Bloco | Entra no motor? | Para que serve |
|---|---|---|
| **Carteira de investimentos** | ✅ **sim** | é o patrimônio do mês zero; é o que rende |
| Ativos | não | patrimônio líquido nas telas de resumo |
| Passivos | não | idem |
| Dívidas a liquidar | sim, via parcelas | mesma tabela do Fluxo de Caixa |

### ⚠ Armadilha nº 4 — imóvel não é patrimônio para o motor

Cadastrar a casa de R$ 800.000 em *Ativos* muda o "Patrimônio líquido" exibido,
mas **não muda um centavo da projeção**. O motor parte da soma dos
**investimentos** — e apenas dela.

Isso é deliberado: um imóvel de moradia não rende 12% a.a. nem se converte em
renda de aposentadoria. Se o cliente pretende vender o imóvel em algum momento,
modele isso como um **objetivo de curto prazo com valor negativo** (entrada de
caixa) na data prevista.

O bloco de dívidas aqui mostra **saldo devedor estimado** (parcela × meses
restantes), enquanto o Fluxo de Caixa mostra a **parcela**. Mesma tabela, duas
leituras.

---

## 8. Passo 6 — Objetivos

`Ponto de Partida → Objetivos`

Dois tipos, com regras bem diferentes:

### Curto prazo — data marcada

| Campo | Regra |
|---|---|
| Prazo | "Curto — data marcada" |
| Valor | **positivo = saída de caixa** (compra); **negativo = entrada** (venda, herança, resgate) |
| Quando | mês em que o valor sai/entra do patrimônio |
| Prioridade, Já concluído | organização; `concluído` **remove o objetivo da projeção** |

O objetivo é debitado do **patrimônio**, não das sobras. Ele aparece na coluna
*Objetivos* da tabela de projeção e como marco no gráfico.

### Recorrente — se repete

| Campo | Regra |
|---|---|
| Prazo | "Recorrente — se repete" |
| Valor | custo de **uma** ocorrência |
| A cada quantos anos | periodicidade |

A compra recorrente **sempre cai em dezembro**, e a primeira ocorrência é em
dezembro do ano seguinte ao início do plano. Um carro de R$ 60.000 a cada 5
anos, num plano iniciado em 2026, sai em dez/2027, dez/2032, dez/2037…

O total exibido na lista é o custo vitalício: `valor × (100 − idade) ÷
periodicidade`. É soma nominal, sem trazer a valor presente — leitura de
magnitude, não de valuation.

### ⚠ Armadilha nº 5 — o sinal se inverte entre telas

| Tela | Positivo significa |
|---|---|
| **Objetivos** | saída de caixa (custa dinheiro) |
| **Mudanças** | melhora do fluxo (entra dinheiro) |

São convenções opostas em duas abas vizinhas. Confira sempre o sinal ao salvar.

---

## 9. Passo 7 — Mudanças (linha do tempo)

`Ponto de Partida → Mudanças`

É aqui que se modela tudo que **altera o fluxo a partir de uma data** e não é
consequência automática de outra coisa.

| Campo | Regra |
|---|---|
| O que muda | texto ("Deixar de pagar aluguel", "Redução de carga horária") |
| **Efeito no caixa** | **positivo melhora, negativo piora** — em qualquer categoria |
| Categoria | Receita / Despesa / Dívida — define em qual linha da projeção o efeito aparece |
| A partir de | primeiro mês em que vale |
| Até | ⚠ **em branco = vale para sempre** |
| Observação | vira **marco** no gráfico e na tabela do Diagnóstico |

Exemplos:

- Cliente sai do aluguel de R$ 3.000 em mar/2027 → categoria *Despesa*,
  valor **+3.000**, a partir de 03/2027, sem fim.
- Cliente reduz plantões e perde R$ 4.000/mês por seis meses → categoria
  *Receita*, valor **−4.000**, de 01/2028 a 06/2028.
- Reforma de R$ 15.000 num único mês → categoria *Despesa*, valor **−15.000**,
  a partir de 05/2027, até 05/2027.

Sem nenhuma mudança cadastrada, a projeção repete o mês típico até os 101 anos.
Uma carreira real quase nunca é assim.

**Não cadastre aqui**: o fim de uma dívida (já é automático pela data de última
parcela) nem compras pontuais com data (use Objetivos de curto prazo — a
diferença é que Objetivos debitam o patrimônio, Mudanças alteram o fluxo).

---

## 10. Passo 8 — Ler o Diagnóstico

`Diagnóstico & Metas`

Nada se edita aqui. Quatro leituras, em ordem de importância:

**1. "O dinheiro acaba"** — o ano em que o patrimônio fica negativo. É o achado
mais acionável do modelo inteiro. Quando existe, aparece em vermelho no topo e
também no Dashboard Resumo, com as três alavancas: adiar a aposentadoria, cortar
o custo projetado, elevar o aporte.

**2. Renda na aposentadoria vs. renda desejada** — a cobertura em porcentagem.

**3. Composição da renda na aposentadoria** — INSS + renda privada. A *renda
privada* é o rendimento de um mês do patrimônio acumulado **sem consumir o
principal**. Cuidado: a projeção não saca esse valor — ela saca o **déficit
inteiro**. É por isso que o patrimônio pode cair mesmo com "renda privada"
positiva. O número serve para dizer ao cliente "seu patrimônio rende X por mês",
não para descrever o que o modelo faz.

**4. Fluxo projetado e tabela mês a mês** — colunas *Receitas, Despesas,
Dívidas, Sobras, Objetivos, Patrimônio*. Despesas, dívidas e previdência
aparecem **negativas**; sobras é a soma algébrica das quatro primeiras.
Patrimônio é estoque: no agregado anual vale o do último mês do ano, não a soma.

### Como o patrimônio evolve

A cada mês:

```
patrimônio = patrimônio × (1 + taxa)^(1/12) + sobras + objetivos
```

A taxa é a de curto prazo enquanto o mês está dentro da janela curta, a de longo
prazo até a aposentadoria, e a de aposentadoria depois disso. No modo Real, cada
uma é descontada da inflação.

---

## 11. Passo 9 — Congelar as metas

`Relatórios → Metas do plano → Congelar metas do plano`

> **Nota de navegação:** o item *Relatórios* na barra lateral está marcado "Em
> breve", mas a tela funciona integralmente. O selo é resíduo de nav; clique
> normalmente.

Congelar tira uma **foto da projeção atual** (a janela curta e a longa) e a grava
como as metas do plano. É contra essa foto — e nunca contra a projeção corrente
— que cada mês é medido depois.

Por que congelar: se o alvo fosse recalculado a cada mês, ele se moveria junto
com o cliente e o acompanhamento não significaria nada.

**Recongelar** substitui a foto. A tela pede confirmação porque os meses já
publicados passam a ser lidos contra um alvo diferente do que valia quando
saíram. Os relatórios já publicados, no entanto, guardam o próprio placar
gravado e não mudam.

Se você editar o plano depois de congelar, a tela de Relatórios mostra um aviso
âmbar: *"o plano mudou desde que as metas foram congeladas"*. Isso é legítimo —
a meta é histórica de propósito — mas serve para você não comparar coisas
diferentes sem perceber.

**Sem metas congeladas não é possível publicar nenhum relatório.**

---

## 12. Passo 10 — O ciclo mensal

### Abrir o mês

`Relatórios → Abrir um mês`. O campo já vem preenchido com o **primeiro mês do
plano ainda não aberto** — você não precisa lembrar onde parou, e não consegue
reabrir um mês já existente (o banco recusa com "Este mês já foi aberto").

Abrir cria de uma vez o registro do realizado **e** o relatório em rascunho.

### Lançar o realizado

`Relatórios → [mês]`. Três listas:

| Lista | Campos |
|---|---|
| **Receitas realizadas** | fonte, valor recebido |
| **Gastos realizados** | categoria, descrição, valor, balde (fixo/extra/parcela/adicional) |
| **Faturas de cartão** | cartão, categoria da fatura, valor |

A **categoria da fatura** usa a taxonomia do extrato bancário (alimentação,
transporte, compras…), diferente da taxonomia do plano. É proposital: uma é o
que o banco devolve, a outra é como você orçou. Não tente conciliá-las.

Um mesmo cartão não pode ter duas linhas na mesma categoria — edite a existente.

### Observações e direcionamentos

- **Observações do mês** — texto livre: o que os números não contam.
- **Direcionamentos do próximo mês** — lista numerada que vai para a última
  página do relatório. É a orientação prática ("juntar R$ 1.000 ao longo do
  mês").

### Publicar

`Relatórios → [mês] → Publicação → Publicar relatório`.

Publicar **congela o placar** no documento e tranca toda a edição do mês
(lançamentos, observação e direcionamentos ficam somente leitura). O relatório
entregue continua dizendo o que dizia quando saiu, mesmo que o plano seja refeito
depois.

Para corrigir algo: **Reabrir para correção**, ajustar, publicar de novo.

Falhas possíveis ao publicar:
- *"Congele as metas do plano antes"* — passo 9 pendente.
- *"Este mês está fora da janela projetada pelo plano"* — o mês está além dos
  `meses_curto` configurados. Ver armadilha nº 7.

### Gerar o PDF

`Ver o documento` → **Imprimir** → *Salvar como PDF*. Cinco páginas:

1. **Como foi o mês** — placar em estrelas + orçamento
2. **Fluxo projetado** — entradas e saídas dos próximos doze meses, com marcos
3. **Patrimônio** — curva curta e curva longa até a aposentadoria
4. **O que aconteceu no mês** — receitas, gastos, faturas, observações
5. **O próximo mês** — metas do mês seguinte, direcionamentos, objetivos

---

## 13. O placar — como a nota é calculada

Quatro métricas: **Receitas, Despesas, Sobras, Investimentos** (patrimônio).

A régua mede **desvio absoluto da meta**, não percentual atingido:

| Desvio da meta | Estrelas |
|---|---|
| até 5% | ★★★★★ |
| até 10% | ★★★★☆ |
| até 20% | ★★★☆☆ |
| até 35% | ★★☆☆☆ |
| acima de 35% | ★☆☆☆☆ |

Duas exceções, ambas deliberadas:

- Em **Sobras** e **Investimentos**, superar a meta vale nota máxima. Sobrar
  mais que o planejado é boa notícia.
- Em **Despesas**, estourar o orçamento nunca vira nota alta — a régua de desvio
  vale integralmente.

Uma receita 40% *acima* do previsto também tira estrelas. Isso é intencional:
ou o plano estava errado, ou entrou dinheiro que ninguém decidiu onde alocar.
Nos dois casos, é conversa.

Quando a meta é zero, não há denominador: a linha mostra "Sem meta definida para
o mês" e zero estrelas.

### ⚠ Armadilha nº 6 — o placar não lê os seus lançamentos

**O placar compara projeção corrente contra projeção congelada — não o realizado
contra a meta.** Os valores que você digita em "Receitas realizadas" e "Gastos
realizados" alimentam os três cartões do topo da tela do mês e as páginas 1 e 4
do relatório, mas **não mudam nenhuma estrela**.

Consequência prática: se o cliente estourou o orçamento em 40% e você lançou
isso corretamente, o placar seguirá cinco estrelas — porque o *plano* não mudou.
As estrelas só se movem quando você **edita o plano** (receitas, custos, dívidas,
mudanças) e o afasta da foto congelada.

Isso está assumido no código como estado transitório. Até que mude, trate o
placar como **"o quanto o plano se afastou do plano original"**, e leia o
realizado nos cartões de topo e na página 4 do documento.

---

## 14. Armadilhas restantes

### ⚠ Nº 7 — o acompanhamento tem prazo de validade

As metas congeladas cobrem apenas a janela curta (padrão: 36 meses a partir do
início do plano). Depois disso, publicar falha. Ao chegar perto do limite: ou
aumente `meses_curto` e recongele (ciente de que a taxa de juros de curto prazo
passa a valer por mais tempo), ou refaça o plano com novo mês de início.

### ⚠ Nº 8 — previdência privada é penalizada pelo modelo

A contribuição cadastrada em `Cadastro → Previdência` **sai do caixa todo mês e
não vira patrimônio em lugar nenhum**. Ela reduz as sobras, reduz o patrimônio
projetado, para na aposentadoria — e nunca retorna como renda.

Como contornar hoje:
- Registre o **saldo acumulado** da previdência em
  `Patrimônio → Carteira de investimentos`, classe *Previdência*. Isso entra na
  projeção corretamente.
- Registre o **fluxo de contribuição** em `Cadastro → Previdência` apenas se
  quiser que ele apareça como saída de caixa — sabendo que o modelo o trata como
  dinheiro perdido.
- Alternativa mais fiel: **não** cadastre a contribuição em Previdência e trate-a
  como parte das sobras que são investidas. O patrimônio projetado fica correto;
  o custo de vida fica ligeiramente subestimado.

Documente a escolha nas notas do cliente para que o próximo planejador entenda o
número.

### ⚠ Nº 9 — categorias novas são da organização inteira

Uma categoria de custo criada durante o cadastro de um cliente passa a existir
para **todos** os clientes da organização. Não crie categorias hiperespecíficas
("Mensalidade escola do Pedro") — use a descrição da linha de custo para isso.

### ⚠ Nº 10 — permissões

Só `admin` e `planner` editam planejamento. Um usuário de outro papel vê tudo,
mas recebe "Seu papel não permite editar o planejamento" ao salvar. A autorização
real é da política do banco; a mensagem é só para não aparecer um silêncio.

---

## 15. Checklist de qualidade de um plano

Antes de congelar as metas, verifique:

- [ ] Data de nascimento preenchida
- [ ] Modo de valor escolhido conscientemente (Real para conversa com cliente)
- [ ] Todas as dívidas com **última parcela** preenchida — nenhum aviso âmbar
      na aba Mudanças ("Sem data de término")
- [ ] Receitas anuais com valor **cheio** e mês de ocorrência correto
- [ ] Carteira de investimentos preenchida (é o ponto de partida do patrimônio)
- [ ] Renda do INSS reflete **toda** a renda esperada na aposentadoria, não só
      o benefício
- [ ] Objetivos com sinal correto (positivo = compra)
- [ ] Mudanças com sinal correto (positivo = melhora o caixa)
- [ ] Pelo menos uma mudança cadastrada — plano sem mudanças é irreal
- [ ] Objetivos já realizados marcados como concluídos
- [ ] Diagnóstico lido: o ano de ruína faz sentido? A cobertura da renda
      desejada é plausível?

---

## 16. Glossário

| Termo | Significado no sistema |
|---|---|
| **Mês comum** | mês sem nenhum evento anual (13º, IPVA, férias) |
| **Mensalizado** | anual rateado por 12; média, não fluxo real |
| **Sobras** | receitas − despesas − parcelas − previdência − seguros |
| **Janela curta** | os primeiros `meses_curto` meses; tabela mensal e taxa de juros de curto prazo |
| **Projeção longa** | agregado anual, do início até o ano da aposentadoria |
| **Metas congeladas** | foto da projeção no momento do fechamento do plano |
| **Balde / controlabilidade** | fixo, extra, parcela ou adicional — leitura do orçamento por negociabilidade |
| **Marco** | observação de uma mudança ou título de um objetivo; anotado no gráfico e na tabela |
| **Ano de ruína** | primeiro ano, após a aposentadoria, com patrimônio negativo |
| **Renda privada** | rendimento mensal do patrimônio na aposentadoria sem consumir o principal |
