export function DemoTag({ className = "" }: { className?: string }) {
  return (
    <span
      title="Produto de demonstração: não está à venda"
      className={`bg-ink-900 text-cream-50 inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold tracking-widest ${className}`}
    >
      DEMO
    </span>
  );
}
