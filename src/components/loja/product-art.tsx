/**
 * Placeholder de foto enquanto não temos fotografias reais (DESIGN_SYSTEM §7).
 * Cor por produto + nome em serifada. Nunca usar fotos de terceiros.
 */
export function ProductArt({
  name,
  tone,
  ratio = "4/5",
  className = "",
}: {
  name: string;
  tone: string;
  ratio?: string;
  className?: string;
}) {
  return (
    <div
      role="img"
      aria-label={`Foto ilustrativa: ${name}`}
      className={`relative flex items-end overflow-hidden rounded-(--radius-media) p-4 ${className}`}
      style={{
        aspectRatio: ratio,
        backgroundColor: tone,
        backgroundImage:
          "radial-gradient(circle at 75% 25%, rgba(255,255,255,0.28) 0, rgba(255,255,255,0) 45%)",
      }}
    >
      <span className="font-serif text-lg leading-tight text-white/95 drop-shadow-sm">
        {name}
      </span>
      <span className="absolute top-3 right-3 rounded bg-black/25 px-1.5 py-0.5 text-[10px] font-medium tracking-wide text-white uppercase">
        Foto demo
      </span>
    </div>
  );
}
