import Image from "next/image";

/** Foto editorial do site, com proporção fixa e cantos da marca. */
export function Photo({
  src,
  alt,
  ratio = "4/5",
  sizes = "(min-width: 768px) 25vw, 50vw",
  priority = false,
  className = "",
}: {
  src: string;
  alt: string;
  ratio?: string;
  sizes?: string;
  priority?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`bg-sand-200 relative overflow-hidden rounded-(--radius-media) shadow-[0_18px_40px_-20px_rgba(31,58,43,0.45)] ${className}`}
      style={{ aspectRatio: ratio }}
    >
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        className="object-cover"
      />
    </div>
  );
}
