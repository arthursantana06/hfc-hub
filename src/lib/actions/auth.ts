"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AuthFormState =
  | {
      errors?: {
        nome?: string[];
        email?: string[];
        password?: string[];
      };
      message?: string;
      success?: string;
      /** Devolvido para repopular o formulário — nunca inclui a senha. */
      values?: { nome?: string; email?: string };
    }
  | undefined;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(fields: { nome?: string; email: string; password: string }) {
  const errors: NonNullable<AuthFormState>["errors"] = {};

  if (fields.nome !== undefined && fields.nome.trim().length < 2) {
    errors.nome = ["Informe seu nome completo."];
  }
  if (!EMAIL_RE.test(fields.email)) {
    errors.email = ["Informe um e-mail válido."];
  }
  if (fields.password.length < 8) {
    errors.password = ["A senha precisa ter ao menos 8 caracteres."];
  }

  return Object.keys(errors).length > 0 ? errors : null;
}

export async function login(
  _state: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const errors = validate({ email, password });
  if (errors) return { errors, values: { email } };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    // Mensagem genérica de propósito: não revela se o e-mail existe.
    return { message: "E-mail ou senha inválidos.", values: { email } };
  }

  revalidatePath("/", "layout");
  redirect("/");
}

export async function signup(
  _state: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const nome = String(formData.get("nome") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const values = { nome, email };

  const errors = validate({ nome, email, password });
  if (errors) return { errors, values };

  const orgId = process.env.NEXT_PUBLIC_DEFAULT_ORG_ID;
  if (!orgId) {
    return {
      message:
        "Organização padrão não configurada (NEXT_PUBLIC_DEFAULT_ORG_ID). Fale com o administrador.",
      values,
    };
  }

  const supabase = await createClient();
  // `org_id` e `nome` alimentam o trigger handle_new_user(), que cria o app_user.
  // O papel NÃO é enviado: o trigger fixa `planner`; promoção é feita por um admin.
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { org_id: orgId, nome } },
  });

  if (error) {
    return {
      message: "Não foi possível criar a conta. Tente novamente.",
      values,
    };
  }

  // Sem sessão = confirmação de e-mail ativada no projeto Supabase.
  if (!data.session) {
    return {
      success:
        "Conta criada. Confira seu e-mail e clique no link de confirmação para entrar.",
    };
  }

  revalidatePath("/", "layout");
  redirect("/");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();

  revalidatePath("/", "layout");
  redirect("/login");
}
