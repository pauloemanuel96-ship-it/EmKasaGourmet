import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { publicEnv } from "@/lib/env";

/**
 * Roda antes das rotas /admin, /auth e da área do cliente:
 * 1) renova a sessão do Supabase (cookies) a cada requisição;
 * 2) checagem otimista: sem sessão em /admin → tela de login.
 * A checagem definitiva de papel acontece no servidor (modules/auth) e no RLS.
 */
export async function proxy(request: NextRequest) {
  const env = publicEnv();
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
          for (const [key, value] of Object.entries(headers ?? {})) {
            response.headers.set(key, value);
          }
        },
      },
    },
  );

  const { data } = await supabase.auth.getClaims();
  const path = request.nextUrl.pathname;
  const isLogin = path === "/admin/login";

  if (!data?.claims && path.startsWith("/admin") && !isLogin) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }
  if (data?.claims && isLogin) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  return response;
}

export const config = {
  // /minha-casa e /entrar entram só para renovar a sessão do cliente.
  matcher: ["/admin/:path*", "/auth/:path*", "/minha-casa/:path*", "/entrar"],
};
