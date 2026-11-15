import Link from "next/link";

export function Section({
  id,
  eyebrow,
  title,
  lead,
  action,
  children,
}: {
  id: string;
  eyebrow?: string;
  title: string;
  lead?: string;
  action?: { href: string; label: string };
  children: React.ReactNode;
}) {
  return (
    <section
      aria-labelledby={id}
      className="mx-auto max-w-6xl px-4 pt-20 sm:px-6"
    >
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div className="flex max-w-2xl flex-col gap-2">
          {eyebrow && (
            <p className="text-leaf-700 text-xs font-medium tracking-widest uppercase">
              {eyebrow}
            </p>
          )}
          <h2 id={id} className="text-3xl sm:text-4xl">
            {title}
          </h2>
          {lead && <p className="text-ink-600">{lead}</p>}
        </div>
        {action && (
          <Link
            href={action.href}
            className="text-forest-900 hover:text-forest-700 text-sm font-medium underline underline-offset-4"
          >
            {action.label}
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}
