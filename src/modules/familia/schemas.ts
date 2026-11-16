import { z } from "zod";

export const DIETS = {
  sem_restricao: "Sem restrição",
  vegetariano: "Vegetariana",
  vegano: "Vegana",
  sem_gluten: "Sem glúten",
  sem_lactose: "Sem lactose",
} as const;
export type Diet = keyof typeof DIETS;

/** Texto exato do consentimento de saúde. Vai gravado junto com o aceite. */
export const HEALTH_CONSENT_TEXT =
  "Autorizo a Emkasa a guardar as alergias, a dieta e o objetivo alimentar das pessoas da minha casa, inclusive crianças pelas quais sou responsável, só para filtrar e sugerir produtos. Posso retirar esta autorização e apagar esses dados quando quiser.";

/** "banana, jiló ,  " -> ["banana", "jiló"] (sem repetidos, no máximo 20). */
export function parseList(raw: string): string[] {
  const seen = new Set<string>();
  for (const part of raw.split(/[,;\n]/)) {
    const item = part.trim().replace(/\s+/g, " ");
    if (item) seen.add(item.slice(0, 40));
    if (seen.size >= 20) break;
  }
  return [...seen];
}

export const memberSchema = z.object({
  id: z.uuid().optional(),
  name: z
    .string()
    .trim()
    .min(1, "Informe o nome ou apelido.")
    .max(40, "Nome muito longo."),
  relation: z
    .string()
    .trim()
    .max(30, "Texto muito longo.")
    .transform((v) => (v === "" ? null : v)),
  birthYear: z
    .string()
    .trim()
    .refine(
      (v) => v === "" || /^\d{4}$/.test(v),
      "Informe o ano com 4 números.",
    )
    .transform((v) => (v === "" ? null : Number(v)))
    .refine(
      (v) => v === null || (v >= 1900 && v <= new Date().getFullYear()),
      "Confira o ano de nascimento.",
    ),
  diet: z.enum(Object.keys(DIETS) as [Diet, ...Diet[]]),
  allergies: z.array(z.string().regex(/^[a-z0-9_]+$/)).max(30),
  likes: z.string().max(900).transform(parseList),
  dislikes: z.string().max(900).transform(parseList),
  goal: z
    .string()
    .trim()
    .max(160, "Use até 160 letras.")
    .transform((v) => (v === "" ? null : v)),
});
export type MemberInput = z.infer<typeof memberSchema>;

/** Esta pessoa tem algum dado de saúde preenchido? */
export function hasHealthData(
  m: Pick<MemberInput, "allergies" | "diet" | "goal">,
) {
  return (
    m.allergies.length > 0 || m.diet !== "sem_restricao" || m.goal !== null
  );
}

/** Idade aproximada a partir do ano de nascimento. */
export function ageFrom(
  birthYear: number | null,
  now = new Date(),
): number | null {
  return birthYear === null ? null : Math.max(0, now.getFullYear() - birthYear);
}

/** O pior caso entre as pessoas da casa, para o selo da vitrine. */
export type FitSummary = {
  verdict: "blocked" | "unknown" | "diet";
  names: string[];
};
const WEIGHT = { blocked: 3, unknown: 2, diet: 1 } as const;

export function summarizeFit(
  issues: { memberName: string; verdict: keyof typeof WEIGHT }[],
): FitSummary | null {
  if (issues.length === 0) return null;
  const worst = issues.reduce((a, b) =>
    WEIGHT[b.verdict] > WEIGHT[a.verdict] ? b : a,
  ).verdict;
  return {
    verdict: worst,
    names: issues.filter((i) => i.verdict === worst).map((i) => i.memberName),
  };
}
