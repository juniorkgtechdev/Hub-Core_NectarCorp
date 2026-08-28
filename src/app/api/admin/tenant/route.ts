import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { auth } from "@/auth";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const session = await auth();

    // Ideally, check if the user is SUPERADMIN
    if (!session || !session.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { name } = await req.json();

    if (!name) {
      return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 });
    }

    const tenant = await prisma.tenant.create({
      data: { name },
    });

    return NextResponse.json(tenant, { status: 201 });
  } catch (error: any) {
    console.error("Erro ao criar tenant:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
