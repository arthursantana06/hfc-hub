import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, UserRoundPlus } from "lucide-react";
import { Page } from "@/components/layout/Page";
import { Card } from "@/components/planejamento/primitives";
import { FormularioCliente } from "@/components/planejamento/FormularioCliente";

export const metadata: Metadata = {
  title: "Novo cliente — HFC Hub",
};

export default function NovoCliente() {
  return (
    <Page
      title="Novo cliente"
      subtitle="O cadastro é o primeiro passo do raio-x."
      actions={
        <Link
          href="/clientes"
          className="inline-flex items-center gap-1.5 font-inter text-sm text-slate-500 hover:text-brand-950 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Link>
      }
    >
      <div className="max-w-2xl">
        <Card titulo="Dados do cliente" icone={UserRoundPlus}>
          <FormularioCliente />
          <p className="font-inter text-xs text-slate-400 mt-5">
            Ao salvar, você vai direto para as premissas do plano. A data de
            nascimento é o único campo que a projeção não dispensa — é dela que
            saem a idade e o ano de aposentadoria.
          </p>
        </Card>
      </div>
    </Page>
  );
}
