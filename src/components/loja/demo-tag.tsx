export function DemoTag({
  className = "",
  soon = false,
}: {
  className?: string;
  /** Prévia de produto real ("Em breve") em vez de item fictício ("DEMO"). */
  soon?: boolean;
}) {
  return (
    <span
      title={
        soon
          ? "Produto real, ainda sem preço cadastrado: em breve na loja"
          : "Produto de demonstração: não está à venda"
      }
      className={`${soon ? "bg-terracotta-500 text-white" : "bg-ink-900 text-cream-50"} inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold tracking-widest uppercase ${className}`}
    >
      {soon ? "Em breve" : "Demo"}
    </span>
  );
}
