import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeNext } from "@/modules/conta/schemas";

/**
 * Destino dos links enviados por e-mail: troca o código pela sessão.
 * Equipe (link mágico) vai para o painel; cliente (confirmação de conta ou
 * senha nova) vem com ?next= e vai para a área dele.
 */
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const next = request.nextUrl.searchParams.get("next");
  const customer = next !== null;

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(
        new URL(customer ? safeNext(next) : "/admin", request.url),
      );
    }
    console.warn("[auth] exchangeCodeForSession:", error.status, error.code);
  }

  return NextResponse.redirect(
    new URL(
      customer ? "/entrar?erro=link" : "/admin/login?erro=link",
      request.url,
    ),
  );
}
