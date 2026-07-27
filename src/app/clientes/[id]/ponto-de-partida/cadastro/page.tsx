import { notFound } from "next/navigation";
import { Camera, Settings2, Umbrella, UserRound } from "lucide-react";
import {
  getAposentadoria,
  getClient,
  getPlanoAtivo,
  linhasDoPlano,
} from "@/lib/planning-dal";
import { Card } from "@/components/planejamento/primitives";
import { FormularioCliente } from "@/components/planejamento/FormularioCliente";
import {
  FormularioPlano,
  FormularioAposentadoria,
} from "@/components/planejamento/FormularioPlano";
import { FotoCliente } from "@/components/planejamento/FotoCliente";
import { ListaEditavel } from "@/components/planejamento/ListaEditavel";
import { escreverMoeda } from "@/lib/forms/planejamento";

export default async function Cadastro({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [cliente, plano] = await Promise.all([getClient(id), getPlanoAtivo(id)]);
  if (!cliente) notFound();

  const [aposentadoria, previdencia, seguros] = await Promise.all([
    getAposentadoria(id),
    plano ? linhasDoPlano("plan_pension", plano.id) : [],
    plano ? linhasDoPlano("plan_insurance", plano.id) : [],
  ]);

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto">
      <Card titulo="Dados do cliente" icone={UserRound}>
        <FormularioCliente
          cliente={{
            id: cliente.id,
            nome: cliente.nome,
            email: cliente.email,
            nascimento: cliente.nascimento,
            profissao: cliente.profissao,
            risco: cliente.risco,
            plano_status: cliente.planoStatus,
            adesao: cliente.adesao,
            notas: cliente.notas,
          }}
        />
      </Card>

      <Card titulo="Foto" icone={Camera}>
        <FotoCliente clientId={cliente.id} url={cliente.avatarUrl} nome={cliente.nome} />
      </Card>

      <Card titulo="Premissas do plano" icone={Settings2} tom="roxo">
        {!plano && (
          <p className="font-inter text-sm text-slate-500 mb-5 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2.5">
            Este cliente ainda não tem plano. Crie um aqui — sem ele, receitas,
            custos e mudanças não têm onde ser gravados.
          </p>
        )}
        <FormularioPlano clientId={cliente.id} plano={plano} />
      </Card>

      {plano && (
        <>
          <Card titulo="Aposentadoria" icone={Umbrella} tom="ambar">
            <FormularioAposentadoria
              clientId={cliente.id}
              planId={plano.id}
              dados={aposentadoria}
            />
          </Card>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <Card titulo="Previdência">
              <ListaEditavel
                entidade="previdencia"
                planId={plano.id}
                clientId={cliente.id}
                vazio="Nenhuma contribuição registrada."
                linhas={previdencia.map((p) => ({
                  id: p.id,
                  titulo: p.nome,
                  valor: `R$ ${escreverMoeda(Number(p.valor))}`,
                  bruto: p,
                }))}
              />
            </Card>

            <Card titulo="Seguros">
              <ListaEditavel
                entidade="seguro"
                planId={plano.id}
                clientId={cliente.id}
                vazio="Nenhum seguro registrado."
                linhas={seguros.map((s) => ({
                  id: s.id,
                  titulo: s.nome,
                  valor: `R$ ${escreverMoeda(Number(s.valor))}`,
                  bruto: s,
                }))}
              />
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
