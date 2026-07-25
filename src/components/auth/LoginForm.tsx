"use client";

import { useActionState } from "react";
import { login } from "@/lib/actions/auth";
import { Field, FormAlert, SubmitButton } from "./AuthFields";

export function LoginForm() {
  const [state, action, pending] = useActionState(login, undefined);

  return (
    <form action={action} className="flex flex-col gap-4">
      {state?.message && <FormAlert tone="error">{state.message}</FormAlert>}

      <Field
        id="email"
        label="E-mail"
        type="email"
        autoComplete="email"
        placeholder="voce@hfc.com.br"
        errors={state?.errors?.email}
      />
      <Field
        id="password"
        label="Senha"
        type="password"
        autoComplete="current-password"
        placeholder="••••••••"
        errors={state?.errors?.password}
      />

      <SubmitButton pending={pending} label="Entrar" pendingLabel="Entrando…" />
    </form>
  );
}
