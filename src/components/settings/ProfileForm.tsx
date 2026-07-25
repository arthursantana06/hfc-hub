"use client";

import { useActionState } from "react";
import { updateProfile } from "@/lib/actions/settings";
import { Field, FormAlert, SubmitButton } from "@/components/ui/Form";

export function ProfileForm({ nome }: { nome: string | null }) {
  const [state, action, pending] = useActionState(updateProfile, undefined);

  return (
    <form action={action} className="flex flex-col gap-4 max-w-md">
      {state?.error && <FormAlert tone="error">{state.error}</FormAlert>}
      {state?.success && <FormAlert tone="success">{state.success}</FormAlert>}

      <Field
        id="nome"
        label="Nome"
        autoComplete="name"
        defaultValue={nome ?? ""}
        placeholder="Seu nome"
      />

      <div className="self-start w-40">
        <SubmitButton pending={pending} label="Salvar" pendingLabel="Salvando…" />
      </div>
    </form>
  );
}
