"use client";

import { useActionState } from "react";
import { signup } from "@/lib/actions/auth";
import { Field, FormAlert, SubmitButton } from "./AuthFields";

export function SignupForm() {
  const [state, action, pending] = useActionState(signup, undefined);

  // Conta criada e aguardando confirmação: o formulário sai de cena.
  if (state?.success) {
    return <FormAlert tone="success">{state.success}</FormAlert>;
  }

  return (
    <form action={action} className="flex flex-col gap-4">
      {state?.message && <FormAlert tone="error">{state.message}</FormAlert>}

      <Field
        id="nome"
        label="Nome completo"
        autoComplete="name"
        placeholder="Seu nome"
        defaultValue={state?.values?.nome}
        errors={state?.errors?.nome}
      />
      <Field
        id="email"
        label="E-mail"
        type="email"
        autoComplete="email"
        placeholder="voce@hfc.com.br"
        defaultValue={state?.values?.email}
        errors={state?.errors?.email}
      />
      <Field
        id="password"
        label="Senha"
        type="password"
        autoComplete="new-password"
        placeholder="Mínimo de 8 caracteres"
        errors={state?.errors?.password}
      />

      <SubmitButton
        pending={pending}
        label="Criar conta"
        pendingLabel="Criando…"
      />
    </form>
  );
}
