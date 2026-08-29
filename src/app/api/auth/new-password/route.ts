import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { token, password } = await req.json();

    if (!token || !password) {
      return NextResponse.json({ error: "Token e nova senha são obrigatórios" }, { status: 400 });
    }

    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
    });

    if (!resetToken) {
      return NextResponse.json({ error: "Token inválido!" }, { status: 400 });
    }

    if (new Date() > new Date(resetToken.expires)) {
      return NextResponse.json({ error: "O token expirou!" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: resetToken.email },
    });

    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Atualiza a senha
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    // Deleta o token
    await prisma.passwordResetToken.delete({
      where: { id: resetToken.id },
    });

    return NextResponse.json({ success: true, message: "Senha atualizada com sucesso!" });
  } catch (error) {
    console.error("Erro ao atualizar senha:", error);
    return NextResponse.json({ error: "Ocorreu um erro interno" }, { status: 500 });
  }
}
