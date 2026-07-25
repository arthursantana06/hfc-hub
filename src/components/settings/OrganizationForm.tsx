"use client";

import { useActionState } from "react";
import { updateOrganization } from "@/lib/actions/settings";
import { Field, FormAlert, SubmitButton } from "@/components/ui/Form";

export function OrganizationForm({
  name,
  plano,
}: {
  name: string;
  plano: string | null;
}) {
  const [state, action, pending] = useActionState(updateOrganization, undefined);

  return (
    <form action={action} className="flex flex-col gap-4 max-w-md">
      {state?.error && <FormAlert tone="error">{state.error}</FormAlert>}
      {state?.success && <FormAlert tone="success">{state.success}</FormAlert>}

      <Field id="name" label="Nome da organização" defaultValue={name} />
      <Field
        id="plano"
        label="Plano"
        defaultValue={plano ?? ""}
        placeholder="Opcional"
      />

      <div className="self-start w-40">
        <SubmitButton pending={pending} label="Salvar" pendingLabel="Salvando…" />
      </div>
    </form>
  );
}
