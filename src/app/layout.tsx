import { Inter, Outfit, Poppins } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const poppins = Poppins({ weight: ["400", "500", "600", "700"], subsets: ["latin"], variable: "--font-poppins" });
/*
 * Fonte só do wordmark ("hfc hub") — geométrica, terminais retos, "c" de
 * abertura larga. É a que mais se aproxima do lettering do logo, então as duas
 * palavras saem da MESMA fonte em vez de imagem + texto costurados.
 */
const outfit = Outfit({ weight: ["400", "500", "600"], subsets: ["latin"], variable: "--font-outfit" });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.variable} ${poppins.variable} ${outfit.variable} font-inter bg-slate-50 text-slate-800`}>
        {children}
      </body>
    </html>
  );
}
