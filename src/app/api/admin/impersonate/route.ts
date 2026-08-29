import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { auth } from "@/auth";
import { v4 as uuidv4 } from "uuid";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const session = await auth();

    // Apenas SUPERADMIN pode acessar
    if (!session || !session.user || session.user.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: "Acesso Negado." }, { status: 403 });
    }

    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "O ID do usuário é obrigatório." }, { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
    }

    // Gera um token de uso único (valido por 5 minutos)
    const token = uuidv4();
    const expires = new Date(Date.now() + 5 * 60 * 1000);

    // Salva na tabela PasswordResetToken usando um prefixo para diferenciar
    await prisma.passwordResetToken.create({
      data: {
        email: `impersonate:${targetUser.email}`,
        token,
        expires,
      },
    });

    return NextResponse.json({ impersonateToken: token });

  } catch (error: any) {
    console.error("Erro na rota de impersonate:", error);
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
  }
}
