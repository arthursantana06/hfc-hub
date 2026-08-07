"use client";

import { useEffect, useRef, useState } from "react";

export type EstadoAutosave =
  | { fase: "ocioso" }
  | { fase: "salvando" }
  | { fase: "salvo" }
  | { fase: "erro"; mensagem: string };

/**
 * A fila de gravação do grid.
 *
 * Uma fila POR LINHA, com no máximo uma gravação em voo e no máximo uma
 * pendente: digitar rápido em três células da mesma linha vira duas idas ao
 * servidor (a que estava em voo e a última), não três — as intermediárias são
 * substituídas pela mais recente, porque cada gravação envia a linha inteira.
 *
 * As tarefas são thunks avaliados NA HORA DE RODAR, não na hora de enfileirar:
 * é o que faz a gravação pendente ler o estado mais novo da linha (inclusive um
 * id real que substituiu o provisório enquanto ela esperava).
 */
export function useAutosave() {
  const filas = useRef(
    new Map<string, { emVoo: boolean; pendente: (() => Promise<void>) | null }>(),
  );
  const emVoo = useRef(0);
  const [estado, setEstado] = useState<EstadoAutosave>({ fase: "ocioso" });

  // `beforeunload` enquanto houver gravação em voo ou pendente: fechar a aba
  // no meio perderia a última célula sem nenhum aviso.
  useEffect(() => {
    const aviso = (e: BeforeUnloadEvent) => {
      if (emVoo.current > 0) e.preventDefault();
    };
    window.addEventListener("beforeunload", aviso);
    return () => window.removeEventListener("beforeunload", aviso);
  }, []);

  function enfileirar(chave: string, tarefa: () => Promise<void>) {
    const fila = filas.current.get(chave) ?? { emVoo: false, pendente: null };
    filas.current.set(chave, fila);

    if (fila.emVoo) {
      fila.pendente = tarefa;
      return;
    }

    fila.emVoo = true;
    emVoo.current += 1;
    setEstado({ fase: "salvando" });

    const rodar = async (t: () => Promise<void>) => {
      try {
        await t();
      } finally {
        if (fila.pendente) {
          const proxima = fila.pendente;
          fila.pendente = null;
          await rodar(proxima);
        } else {
          fila.emVoo = false;
          emVoo.current -= 1;
          if (emVoo.current === 0) {
            // Só declara "salvo" se nenhuma tarefa reportou erro no meio.
            setEstado((atual) => (atual.fase === "erro" ? atual : { fase: "salvo" }));
          }
        }
      }
    };

    void rodar(tarefa);
  }

  function reportarErro(mensagem: string) {
    setEstado({ fase: "erro", mensagem });
  }

  function limparErro() {
    setEstado((atual) => (atual.fase === "erro" ? { fase: "ocioso" } : atual));
  }

  return { estado, enfileirar, reportarErro, limparErro };
}
