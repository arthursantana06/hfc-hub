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

  const supabase = await createClient();
  // Só `nome` vai no metadata. Organização e papel saem do convite que o admin
  // liberou — ver handle_new_user() na migração 0010. Sem convite ativo, o
  // trigger aborta o cadastro.
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { nome } },
  });

  if (error) {
    console.error("[signup]", error.message);

    if (/already registered/i.test(error.message)) {
      return { message: "Este e-mail já tem conta. Tente entrar.", values };
    }

    // handle_new_user() aborta com P0001 e o GoTrue repassa a mensagem
    // ("signup sem convite ativo para ..."); `database error` fica de rede de
    // segurança caso uma versão futura mascare o texto do trigger.
    if (/sem convite|database error/i.test(error.message)) {
      return {
        message:
          "Este e-mail não está liberado para criar conta. Peça um convite ao administrador.",
        values,
      };
    }

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
