import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { auth } from "@/auth";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const tenantId = formData.get("tenantId") as string;
    const razaoSocial = formData.get("razaoSocial") as string;
    const cnpj = formData.get("cnpj") as string;
    const endereco = formData.get("endereco") as string;
    const logoFile = formData.get("logo") as File | null;

    if (!tenantId) {
      return NextResponse.json({ error: "Tenant ID is required" }, { status: 400 });
    }

    const updateData: any = {
      razaoSocial,
      cnpj,
      endereco,
    };

    if (logoFile && logoFile.size > 0) {
      const buffer = Buffer.from(await logoFile.arrayBuffer());
      const ext = path.extname(logoFile.name) || ".png";
      const filename = `${uuidv4()}${ext}`;
      const uploadDir = path.join(process.cwd(), "public", "uploads", "logos");

      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const filePath = path.join(uploadDir, filename);
      fs.writeFileSync(filePath, buffer);
      
      updateData.logoUrl = `/uploads/logos/${filename}`;
    }

    const tenant = await prisma.tenant.update({
      where: { id: tenantId },
      data: updateData,
    });

    return NextResponse.json(tenant);
  } catch (error: any) {
    console.error("Erro ao atualizar dados do tenant:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
