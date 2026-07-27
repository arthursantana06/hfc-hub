/* eslint-disable @next/next/no-img-element */

/**
 * Foto de perfil, com as iniciais como retrato falado quando não há imagem.
 *
 * Usa `<img>` e não `next/image`: a origem é uma URL assinada do Supabase, que
 * muda a cada render e expira — otimizar e cachear isso não traz ganho e ainda
 * exigiria liberar o host no `next.config`.
 */
export function Avatar({
  src,
  nome,
  size = 40,
  className = "",
}: {
  src?: string | null;
  nome?: string | null;
  size?: number;
  className?: string;
}) {
  const label = initials(nome);

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-300 ${className}`}
      style={{ width: size, height: size }}
      aria-hidden
    >
      {src ? (
        <img
          src={src}
          alt=""
          className="h-full w-full object-cover"
          width={size}
          height={size}
        />
      ) : (
        <span
          className="font-poppins font-semibold text-brand-900"
          style={{ fontSize: Math.max(11, Math.round(size * 0.36)) }}
        >
          {label}
        </span>
      )}
    </span>
  );
}

/** "Ana Beatriz Souza" → "AS". */
export function initials(nome?: string | null) {
  const parts = (nome ?? "").trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase() || "?";
}
