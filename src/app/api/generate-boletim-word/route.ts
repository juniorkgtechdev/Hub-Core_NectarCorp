import { NextResponse } from "next/server";
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";
import { ExtractedData } from "@/types";
import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import JSZip from "jszip";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const dataList: ExtractedData[] = body.dataList || body;
    const tenantId = body.tenantId;

    if (!dataList || !Array.isArray(dataList) || dataList.length === 0) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }

    const buffers: { name: string, buffer: Buffer }[] = [];

    for (let i = 0; i < dataList.length; i++) {
      const data = dataList[i];
      const children: Paragraph[] = [
        new Paragraph({
          text: "BOLETIM DE DADOS CADASTRAIS",
          heading: HeadingLevel.HEADING_1,
          alignment: "center",
          spacing: { after: 400 },
        })
      ];

      const paragraphText = `${data.nome || ""}, ${data.nacionalidade || ""}, nascido(a) em ${data.dataNascimento || ""}, ${data.profissao || ""}, ${data.estadoCivil || ""}, Portador(a) da carteira profissional ${data.carteiraProfissional || ""}, CPF ${data.cpf || ""}, residente e domiciliado(a) na ${data.endereco || ""}, ${data.cidade || ""}, ${data.estado || ""}, CEP nº ${data.cep || ""}.`;

      children.push(
        new Paragraph({
          children: [new TextRun({ text: paragraphText, size: 24 })],
          spacing: { after: 240 },
          alignment: "both",
        })
      );

      const doc = new Document({
        sections: [{
          properties: {},
          children: children,
        }],
      });

      const buffer = await Packer.toBuffer(doc);
      const name = data.nome ? data.nome.replace(/\s+/g, '_') : `Boletim_${i+1}`;
      buffers.push({ name: `Boletim_${name}.docx`, buffer });
    }

    // Salva histórico se tiver tenantId
    if (tenantId) {
      const docsDir = path.join(process.cwd(), "public", "uploads", "documents");
      if (!fs.existsSync(docsDir)) {
        fs.mkdirSync(docsDir, { recursive: true });
      }

      for (const doc of buffers) {
        const filename = `${uuidv4()}_${doc.name}`;
        const filePath = path.join(docsDir, filename);
        fs.writeFileSync(filePath, doc.buffer);

        await prisma.generatedDocument.create({
          data: {
            name: doc.name,
            type: "BOLETIM",
            fileUrl: `/uploads/documents/${filename}`,
            tenantId,
          }
        });
      }
    }

    if (buffers.length === 1) {
      return new NextResponse(new Uint8Array(buffers[0].buffer), {
        status: 200,
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "Content-Disposition": `attachment; filename="${buffers[0].name}"`,
        },
      });
    }

    const zip = new JSZip();
    for (const doc of buffers) {
      zip.file(doc.name, doc.buffer);
    }

    const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });

    return new NextResponse(new Uint8Array(zipBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="Boletins.zip"`,
      },
    });

  } catch (error: any) {
    console.error("Erro na geração do Boletim Word:", error);
    return NextResponse.json({ error: error.message || "Erro interno" }, { status: 500 });
  }
}
