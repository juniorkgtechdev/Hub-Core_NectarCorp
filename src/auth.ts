import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./lib/prisma";
import bcrypt from "bcryptjs";

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  trustHost: true,
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
        impersonateToken: { label: "Impersonate Token", type: "text" },
      },
      async authorize(credentials) {
        // Lógica de Impersonation
        if (credentials?.impersonateToken) {
          const tokenRecord = await prisma.passwordResetToken.findUnique({
            where: { token: credentials.impersonateToken as string },
          });

          if (!tokenRecord || tokenRecord.expires < new Date() || !tokenRecord.email.startsWith("impersonate:")) {
            return null;
          }

          await prisma.passwordResetToken.delete({
            where: { id: tokenRecord.id },
          });

          const targetEmail = tokenRecord.email.replace("impersonate:", "");
          const user = await prisma.user.findUnique({
            where: { email: targetEmail },
            include: { tenant: true },
          });

          if (!user) return null;

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            tenantId: user.tenantId,
            tenantSlug: user.tenant?.slug || null,
          };
        }

        // Fluxo de login normal
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
          include: { tenant: true },
        });

        if (!user) return null;

        const passwordsMatch = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        );

        if (passwordsMatch) {
          // Se não for super admin e não tiver empresa, não deixa logar
          if (user.role !== 'SUPERADMIN' && !user.tenant) {
            throw new Error("Usuário não possui uma empresa vinculada.");
          }

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            tenantId: user.tenantId,
            tenantSlug: user.tenant?.slug || null,
          };
        }
        return null;
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.tenantId = user.tenantId;
        token.tenantSlug = (user as any).tenantSlug;
      }
      return token;
    },
    session({ session, token }) {
      if (token && session.user) {
        session.user.id = (token.id || token.sub) as string;
        session.user.role = token.role as string;
        session.user.tenantId = token.tenantId as string | null;
        (session.user as any).tenantSlug = token.tenantSlug as string | null;
      }
      return session;
    },
  },
  pages: {
    signIn: "/",
  },
  session: { strategy: "jwt" },
});
