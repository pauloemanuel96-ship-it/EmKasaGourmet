import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { publicEnv } from "@/lib/env";

/**
 * Cliente Supabase para Server Components, Server Actions e Route Handlers.
 * Usa a chave publicável + a sessão do usuário (cookies): o RLS decide o acesso.
 */
export async function createClient() {
  // cookies() primeiro: no build (prerender) a rota é adiada aqui e as
  // variáveis de ambiente só são exigidas em tempo de requisição.
  const cookieStore = await cookies();
  const env = publicEnv();

  return createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Chamado de um Server Component (cookies somente leitura).
            // A renovação da sessão fica a cargo do proxy (tarefa 8).
          }
        },
      },
    },
  );
}
