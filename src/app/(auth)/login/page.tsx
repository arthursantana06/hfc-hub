import Link from "next/link";
import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/LoginForm";
import { FormAlert } from "@/components/ui/Form";

export const metadata: Metadata = {
  title: "Entrar — HFC Hub",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  // `searchParams` é assíncrono nesta versão do Next.
  const { erro } = await searchParams;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-poppins font-medium text-3xl text-brand-950">
          Entrar
        </h1>
        <p className="font-inter text-sm text-slate-500 mt-2">
          Acesse o hub da consultoria com suas credenciais.
        </p>
      </div>

      {erro === "link-invalido" && (
        <FormAlert tone="error">
          O link de confirmação é inválido ou já expirou. Entre com e-mail e
          senha ou peça um novo link.
        </FormAlert>
      )}

      <LoginForm />

      <p className="font-inter text-sm text-slate-500">
        Ainda não tem conta?{" "}
        <Link
          href="/signup"
          className="text-brand-600 hover:text-brand-900 font-medium transition-colors"
        >
          Criar conta
        </Link>
      </p>
    </div>
  );
}
