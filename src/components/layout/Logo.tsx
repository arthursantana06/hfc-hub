import Image from "next/image";

const SIZES = {
  sm: { w: 56, h: 56 },
  md: { w: 88, h: 88 },
  lg: { w: 132, h: 132 },
} as const;

/**
 * Marca do HFC. O arquivo é transparente com traços em azul-escuro, então em
 * fundo escuro ele some — `tone="light"` inverte para branco sólido via filtro,
 * evitando manter um segundo arquivo só para isso.
 */
export function Logo({
  tone = "dark",
  size = "md",
  className = "",
}: {
  tone?: "dark" | "light";
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const { w, h } = SIZES[size];

  return (
    <Image
      src="/logo-hfc.png"
      alt="HFC"
      width={w}
      height={h}
      priority
      className={`${tone === "light" ? "brightness-0 invert" : ""} ${className}`}
    />
  );
}
