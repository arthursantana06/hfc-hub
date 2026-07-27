import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

/**
 * O alias `@/` vem do `tsconfig` e o Next resolve sozinho; o Vitest roda fora
 * do Next e precisa da mesma equivalência declarada aqui, senão os testes não
 * enxergam nada de `src/`.
 */
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    include: ["src/**/*.test.ts"],
  },
});
