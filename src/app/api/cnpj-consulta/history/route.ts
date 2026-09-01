import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { auth } from "@/auth";

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const tenantId = session.user.tenantId;
    if (!tenantId) {
      return NextResponse.json({ error: "Tenant não encontrado na sessão" }, { status: 403 });
    }

    const history = await prisma.cnpjConsulta.findMany({
      where: { tenantId },
    });

    return NextResponse.json(history);
  } catch (error: any) {
    console.error("Erro ao buscar histórico de CNPJs:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
