import { z } from "zod";

/**
 * Variáveis públicas (vão para o navegador). Precisam ser lidas com o nome literal
 * `process.env.NEXT_PUBLIC_...` para o Next.js conseguir embuti-las no build.
 */
const publicSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(20),
});

export function publicEnv() {
  const parsed = publicSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  });
  if (!parsed.success) {
    throw new Error(
      "Variáveis do Supabase ausentes ou inválidas. Copie .env.example para .env.local e preencha.\n" +
        z.prettifyError(parsed.error),
    );
  }
  return parsed.data;
}
