import { BrandOrbit } from "@/components/layout/BrandOrbit";
import { Logo } from "@/components/layout/Logo";

const SITE_URL = "https://www.hfcconsultoria.com/";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-screen w-full flex overflow-y-auto">
      {/* Painel da marca — só a partir de lg, para não competir com o formulário no mobile. */}
      <div className="hidden lg:flex lg:w-1/2 bg-brand-900 flex-col justify-between p-12">
        {/*
         * Wordmark inteiro em texto: antes o "hfc" vinha do PNG e o "Hub" de
         * texto, então peso, altura-x e espacejamento nunca casavam. Agora as
         * duas palavras saem da mesma fonte. O logo em imagem segue vivo no
         * centro da roda abaixo.
         */}
        <span className="font-outfit font-medium text-white text-3xl tracking-tight lowercase">
          hfc <span className="text-brand-300">hub</span>
        </span>

        <BrandOrbit />

        <a
          href={SITE_URL}
          target="_blank"
          rel="noreferrer"
          className="font-inter text-sm text-brand-300/70 hover:text-brand-300 transition-colors w-fit"
        >
          www.hfcconsultoria.com
        </a>
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
