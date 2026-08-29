import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { auth } from "@/auth";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { generatePasswordResetToken } from "@/lib/tokens";
import { sendPasswordResetEmail } from "@/lib/mail";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const session = await auth();

    // Check if the user is SUPERADMIN or ADMIN
    if (!session || !session.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { name, email, password, role, tenantId } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email é obrigatório" }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ error: "Usuário com este email já existe" }, { status: 400 });
    }

    // Gera uma senha aleatória caso não seja fornecida
    const finalPassword = password || uuidv4();
    const passwordHash = await bcrypt.hash(finalPassword, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: role || "USER",
        tenantId: tenantId || null,
      },
    });

    if (!password) {
      const origin = req.headers.get("origin") || req.headers.get("referer")?.replace(/\/$/, '') || process.env.NEXT_PUBLIC_APP_URL || undefined;
      const resetToken = await generatePasswordResetToken(email);
      sendPasswordResetEmail(email, resetToken.token, origin).catch(console.error);
    }

    // Don't return password hash
    const { passwordHash: _, ...userWithoutPassword } = user;

    return NextResponse.json(userWithoutPassword, { status: 201 });
  } catch (error: any) {
    console.error("Erro ao criar usuário:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user || session.user.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id, name, email, password, role, tenantId } = await req.json();

    if (!id || !email) {
      return NextResponse.json({ error: 'ID e Email são obrigatórios' }, { status: 400 });
    }

    const userToEdit = await prisma.user.findUnique({
      where: { id }
    });

    if (!userToEdit) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    const updateData: any = { 
      name, 
      email,
      role: role || userToEdit.role,
      tenantId: tenantId === "" ? null : (tenantId || userToEdit.tenantId)
    };

    if (password && password.trim() !== '') {
      updateData.passwordHash = await bcrypt.hash(password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
    });

    const { passwordHash: _, ...userWithoutPassword } = updatedUser;

    return NextResponse.json(userWithoutPassword);
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Erro ao atualizar usuário' }, { status: 500 });
  }
}
