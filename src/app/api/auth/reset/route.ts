import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { generatePasswordResetToken } from "@/lib/tokens";
import { sendPasswordResetEmail } from "@/lib/mail";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email é obrigatório" }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (!existingUser) {
      // Retornamos 200 de qualquer forma por segurança (evitar enumeration attack)
      return NextResponse.json({ message: "Se o e-mail existir, um link de recuperação foi enviado." });
    }

    const origin = req.headers.get("origin") || req.headers.get("referer")?.replace(/\/$/, '') || process.env.NEXT_PUBLIC_APP_URL || undefined;

    const resetToken = await generatePasswordResetToken(email);
    
    // Dispara o e-mail em background para não atrasar a resposta da API (que estava levando mais de 1 minuto no SMTP)
    sendPasswordResetEmail(email, resetToken.token, origin).catch(console.error);

    return NextResponse.json({ message: "Se o e-mail existir, um link de recuperação foi enviado." });
  } catch (error: any) {
    console.error("Erro na recuperação de senha:", error);
    return NextResponse.json({ error: "Ocorreu um erro ao processar a solicitação", details: error.message }, { status: 500 });
  }
}
