/** Esqueleto mostrado enquanto uma página da loja carrega (no lugar de um spinner). */
export default function LojaLoading() {
  return (
    <div
      role="status"
      aria-label="Carregando"
      className="mx-auto max-w-6xl animate-pulse px-4 pt-12 sm:px-6"
    >
      <div className="bg-sand-200 h-3 w-24 rounded" />
      <div className="bg-sand-200 mt-4 h-9 w-2/3 max-w-md rounded" />
      <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="flex flex-col gap-3">
            <div className="bg-sand-200 aspect-[4/5] rounded-(--radius-media)" />
            <div className="bg-sand-200 h-4 w-3/4 rounded" />
            <div className="bg-sand-200 h-4 w-1/3 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
