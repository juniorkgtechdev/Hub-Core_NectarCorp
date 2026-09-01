import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  
  // Excluir arquivos estáticos e rotas de API
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/uploads") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET || "super-secret-key-change-in-production" });

  // Rotas do superadmin
  if (pathname.startsWith("/superadmin")) {
    if (pathname === "/superadmin/login") {
       if (token?.role === "SUPERADMIN") return NextResponse.redirect(new URL("/superadmin", req.url));
       return NextResponse.next();
    }
    
    if (!token || token.role !== "SUPERADMIN") {
      return NextResponse.redirect(new URL("/superadmin/login", req.url));
    }
    return NextResponse.next();
  }

  // Se a rota acessada for uma página dentro do painel da empresa: ex: /[slug]/dashboard
  const parts = pathname.split("/").filter(Boolean);
  const isProtectedRoute = parts.length > 1 && (parts[1] === "dashboard" || parts[1] === "cnpj");
  
  if (isProtectedRoute) {
    const slug = parts[0]; // ex: "medprimesaude"
    
    if (!token) {
      // Se não estiver logado, redireciona para o login dessa empresa
      return NextResponse.redirect(new URL(`/${slug}`, req.url));
    }

    // Se estiver logado, verificar se pertence à empresa
    if (token.role !== "SUPERADMIN" && token.tenantSlug !== slug) {
      // Se for de outra empresa, redireciona para a empresa dele
      if (token.tenantSlug) {
        return NextResponse.redirect(new URL(`/${token.tenantSlug}/dashboard`, req.url));
      } else {
        // Se não tiver empresa (usuário sem vínculo), redireciona pra home
        return NextResponse.redirect(new URL("/", req.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
