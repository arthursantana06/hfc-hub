import Link from "next/link";
import type { Metadata } from "next";
import { SignupForm } from "@/components/auth/SignupForm";

export const metadata: Metadata = {
  title: "Criar conta — HFC Hub",
};

export default function SignupPage() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-poppins font-medium text-3xl text-brand-950">
          Criar conta
        </h1>
        <p className="font-inter text-sm text-slate-500 mt-2">
          Novas contas entram como <strong className="font-medium">planejador</strong>;
          um administrador ajusta o papel depois.
        </p>
      </div>

      <SignupForm />

      <p className="font-inter text-sm text-slate-500">
        Já tem conta?{" "}
        <Link
          href="/login"
          className="text-brand-600 hover:text-brand-900 font-medium transition-colors"
        >
          Entrar
        </Link>
      </p>
    </div>
  );
}
