import { Logo } from "@/components/layout/Logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen w-full flex">
      {/* Painel da marca — só a partir de lg, para não competir com o formulário no mobile. */}
      <div className="hidden lg:flex lg:w-1/2 bg-brand-900 flex-col justify-between p-12">
        <div className="flex items-center gap-3">
          <Logo tone="light" size="md" className="h-12 w-12" />
          <span className="font-poppins font-medium text-white text-lg">Hub</span>
        </div>

        <div className="max-w-md">
          <h2 className="font-poppins font-medium text-3xl text-white leading-snug">
            Um hub único para planejar, acompanhar e encantar cada cliente.
          </h2>
          <p className="font-inter text-brand-300 mt-4">
            CRM, planejamento financeiro, análise de investimentos e relatórios —
            no mesmo lugar.
          </p>
        </div>

        <p className="font-inter text-sm text-brand-300/70">
          Plataforma interna da consultoria HFC.
        </p>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-sm">
          {/* Abaixo de lg o painel da marca some — a marca vem para cá. */}
          <Logo size="sm" className="h-12 w-12 mb-6 lg:hidden" />
          {children}
        </div>
      </div>
    </div>
  );
}
