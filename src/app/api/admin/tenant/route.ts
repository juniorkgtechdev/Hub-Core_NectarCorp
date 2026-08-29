import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { auth } from "@/auth";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session || !session.user || session.user.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { name, slug, logoUrl } = await req.json();

    if (!name || !slug) {
      return NextResponse.json({ error: "Nome e slug são obrigatórios" }, { status: 400 });
    }

    // Check if slug is unique
    const existingTenant = await prisma.tenant.findUnique({
      where: { slug }
    });

    if (existingTenant) {
      return NextResponse.json({ error: "Este slug já está em uso" }, { status: 400 });
    }

    const tenant = await prisma.tenant.create({
      data: { name, slug, logoUrl },
    });

    return NextResponse.json(tenant, { status: 201 });
  } catch (error: any) {
    console.error("Erro ao criar tenant:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
