import { NextResponse } from "next/server";
import { generateContractsPdf } from "@/utils/pdfGenerator";
import { ExtractedData } from "@/types";
import JSZip from "jszip";
import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const dataList: ExtractedData[] = body.dataList || body;
    const tenantId = body.tenantId;

    if (!dataList || !Array.isArray(dataList) || dataList.length === 0) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }

    const buffers = await generateContractsPdf(dataList);

    // Salva histórico se tiver tenantId
    if (tenantId) {
      const docsDir = path.join(process.cwd(), "public", "uploads", "documents");
      if (!fs.existsSync(docsDir)) {
        fs.mkdirSync(docsDir, { recursive: true });
      }

      for (let i = 0; i < buffers.length; i++) {
        const data = dataList[i];
        const name = data.nome ? data.nome.replace(/\s+/g, '_') : `Contrato_${i+1}`;
        const filename = `${uuidv4()}_Contrato_${name}.pdf`;
        const filePath = path.join(docsDir, filename);
        fs.writeFileSync(filePath, buffers[i]);

        await prisma.generatedDocument.create({
          data: {
            name: `Contrato_${name}.pdf`,
            type: "CONTRATO",
            fileUrl: `/uploads/documents/${filename}`,
            tenantId,
          }
        });
      }
    }

    if (buffers.length === 1) {
      const name = dataList[0].nome ? dataList[0].nome.replace(/\s+/g, '_') : "Contrato";
      return new NextResponse(new Uint8Array(buffers[0]), {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="Contrato_${name}.pdf"`,
        },
      });
    }

    const zip = new JSZip();
    for (let i = 0; i < buffers.length; i++) {
      const data = dataList[i];
      const name = data.nome ? data.nome.replace(/\s+/g, '_') : `Contrato_${i+1}`;
      zip.file(`Contrato_${name}.pdf`, buffers[i]);
    }

    const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });

    return new NextResponse(new Uint8Array(zipBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="Contratos.zip"`,
      },
    });
  } catch (error: any) {
    console.error("Erro ao gerar PDF:", error);
    return NextResponse.json({ error: error.message || "Erro interno" }, { status: 500 });
  }
}
