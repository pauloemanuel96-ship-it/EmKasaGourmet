import Link from "next/link";
import {
  getHouseholdFit,
  type FitIssue,
  type FitVerdict,
} from "@/modules/familia/queries";

const TONE: Record<FitVerdict | "ok", { ring: string; label: string }> = {
  ok: { ring: "#5a8f3c", label: "serve" },
  diet: { ring: "#3b7ea1", label: "dieta não confirmada" },
  unknown: { ring: "#c98a14", label: "em dúvida" },
  blocked: { ring: "#c2412d", label: "não serve" },
};

/**
 * "Raio-X da sua casa" na página do produto (D-044): para cada pessoa
 * cadastrada, se o produto serve. Quem decide é a regra do banco, pela ficha
 * do produto; aqui só se mostra o resultado.
 */
export async function HouseholdFitCard({
  slug,
  isDemo,
}: {
  slug: string;
  isDemo: boolean;
}) {
  // Item de demonstração não tem ficha de verdade: nada a conferir.
  if (isDemo) return null;
  const fit = await getHouseholdFit();

  if (!fit) {
    return (
      <p className="text-ink-600 text-sm">
        <Link href="/minha-casa" className="underline underline-offset-4">
          Cadastre quem mora com você
        </Link>{" "}
        e veja aqui se este produto serve para todos.
      </p>
    );
  }

  return <FitCardView members={fit.members} issues={fit.issues[slug] ?? []} />;
}

export function FitCardView({
  members,
  issues,
}: {
  members: { id: string; name: string }[];
  issues: FitIssue[];
}) {
  const byMember = new Map(issues.map((i) => [i.memberId, i]));
  const allOk = issues.length === 0;
  const blocked = issues.some((i) => i.verdict === "blocked");

  return (
    <section
      aria-labelledby="raio-x-da-casa"
      className="fit-card border-sand-200 bg-paper relative flex flex-col gap-3 overflow-hidden rounded-(--radius-media) border p-4"
    >
      <span aria-hidden="true" className="fit-scan" />
      <div>
        <p className="text-leaf-700 text-xs font-medium tracking-widest uppercase">
          Raio-X da sua casa
        </p>
        <h2 id="raio-x-da-casa" className="font-sans text-base font-medium">
          {allOk
            ? "Serve para todos da casa."
            : blocked
              ? "Atenção: não serve para todos."
              : "Confira antes de comprar."}
        </h2>
      </div>
      <ul className="flex flex-col gap-2">
        {members.map((m) => {
          const issue = byMember.get(m.id);
          const tone = TONE[issue?.verdict ?? "ok"];
          return (
            <li key={m.id} className="flex items-start gap-3 text-sm">
              <span
                aria-hidden="true"
                className="grid size-9 shrink-0 place-items-center rounded-full text-sm font-semibold"
                style={{
                  color: tone.ring,
                  boxShadow: `0 0 0 2px ${tone.ring}, 0 0 12px ${tone.ring}66`,
                }}
              >
                {m.name.slice(0, 1).toUpperCase()}
              </span>
              <span className="pt-1.5">
                <strong className="font-medium">{m.name}</strong>
                <span style={{ color: tone.ring }}> · {tone.label}</span>
                {issue && (
                  <span className="text-ink-600">
                    {" "}
                    ({issue.reasons.join(", ")})
                  </span>
                )}
              </span>
            </li>
          );
        })}
      </ul>
      <p className="text-ink-600 text-xs">
        Conferido pela ficha técnica do produto. Em caso de alergia grave, fale
        com a equipe antes de comprar.
      </p>
    </section>
  );
}
