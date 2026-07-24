import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

// `proxy` substitui o antigo `middleware` nesta versão do Next (runtime Node.js).
export default async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  // Roda em tudo, exceto assets estáticos e imagens.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
