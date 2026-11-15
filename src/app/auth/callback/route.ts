import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** Destino do link mágico: troca o código pela sessão e entra no painel. */
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    console.warn("[auth] exchangeCodeForSession:", error.status, error.code);
  }

  return NextResponse.redirect(new URL("/admin/login?erro=link", request.url));
}
