import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { auth } from "@/auth";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const tenantId = session.user.tenantId;
    if (!tenantId) {
      return NextResponse.json({ error: "Tenant não encontrado na sessão" }, { status: 403 });
    }

    const body = await req.json();
    const { results } = body; // Array of CNPJ data

    if (!results || !Array.isArray(results)) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }

    // Usaremos transação e upsert para salvar ou atualizar
    const upserts = results.map((item: any) => {
      return prisma.cnpjConsulta.upsert({
        where: {
          tenantId_cnpj: {
            tenantId,
            cnpj: item.cnpj,
          }
        },
        update: {
          razaoSocial: item.razaoSocial,
          nomeFantasia: item.nomeFantasia,
          situacao: item.situacao,
          simplesOptante: item.simples?.optante || false,
          simeiOptante: item.simei?.optante || false,
          endereco: item.endereco,
          municipio: item.municipio,
          uf: item.uf,
          cep: item.cep,
          consultadoEm: new Date(),
        },
        create: {
          cnpj: item.cnpj,
          razaoSocial: item.razaoSocial,
          nomeFantasia: item.nomeFantasia,
          situacao: item.situacao,
          simplesOptante: item.simples?.optante || false,
          simeiOptante: item.simei?.optante || false,
          endereco: item.endereco,
          municipio: item.municipio,
          uf: item.uf,
          cep: item.cep,
          tenantId,
        }
      });
    });

    await prisma.$transaction(upserts);

    return NextResponse.json({ success: true, message: "Consultas salvas com sucesso!" });
  } catch (error: any) {
    console.error("Erro ao salvar histórico de CNPJs:", error);
    return NextResponse.json({ error: error.message || "Erro interno" }, { status: 500 });
  }
}
