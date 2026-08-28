import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const secret = process.env.NEXTAUTH_SECRET || "super-secret-key-change-in-production";
  
  // Usar getToken evita carregar o auth.ts (e o Prisma) no Edge Runtime
  const token = await getToken({ req: request, secret });
  
  const { pathname } = request.nextUrl;

  // Rotas protegidas que exigem login
  const isProtectedRoute = pathname.startsWith('/dashboard') || pathname.startsWith('/admin');
  const isLoginRoute = pathname === '/' || pathname === '/login';

  // Se tentar acessar rota protegida sem login, redireciona para o login
  if (isProtectedRoute && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Se tentar acessar o login já estando logado, redireciona pro dashboard
  if (isLoginRoute && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
