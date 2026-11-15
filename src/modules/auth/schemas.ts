import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.email({ error: "Informe um e-mail válido." })),
});

export type LoginState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "sent"; message: string };
