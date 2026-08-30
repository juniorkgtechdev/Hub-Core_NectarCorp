import { NextResponse } from "next/server";
import { generateContractsDocx } from "@/utils/contractGenerator";
import { Packer } from "docx";
import { ExtractedData } from "@/types";
import JSZip from "jszip";
import { PrismaClient } from "@prisma/client";
import { auth } from "@/auth";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import Docxtemplater from "docxtemplater";
import PizZip from "pizzip";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const dataList: ExtractedData[] = body.dataList || body; // Suporta formato antigo ou novo
    const tenantId = body.tenantId;
    const templateId = body.templateId;

    if (!dataList || !Array.isArray(dataList) || dataList.length === 0) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }

    let docsBuffers: { name: string; buffer: Buffer }[] = [];

    // Se houver um template selecionado, usa docxtemplater
    if (templateId && tenantId) {
      const template = await prisma.contractTemplate.findUnique({
        where: { id: templateId }
      });
      
      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId }
      });

      if (template && fs.existsSync(path.join(process.cwd(), "public", template.fileUrl))) {
        const templateContent = fs.readFileSync(path.join(process.cwd(), "public", template.fileUrl), "binary");
        
        for (let i = 0; i < dataList.length; i++) {
          const data = dataList[i];
          const zip = new PizZip(templateContent);
          const doc = new Docxtemplater(zip, {
            paragraphLoop: true,
            linebreaks: true,
          });

          // Preenche os dados do paciente + dados da clínica
          doc.render({
            ...data,
            clinica_nome: tenant?.name || "",
            clinica_razao: tenant?.razaoSocial || "",
            clinica_cnpj: tenant?.cnpj || "",
            clinica_endereco: tenant?.endereco || "",
          });

          const buf = doc.getZip().generate({ type: "nodebuffer" });
          const patientName = data.nome ? data.nome.replace(/\s+/g, '_') : `Contrato_${i+1}`;
          docsBuffers.push({ name: `Contrato_${patientName}.docx`, buffer: buf });
        }
      }
    }

    // Fallback: se não usou template ou falhou, usa o gerador hardcoded atual
    if (docsBuffers.length === 0) {
      const docs = generateContractsDocx(dataList);
      for (let i = 0; i < docs.length; i++) {
        const b64string = await Packer.toBase64String(docs[i]);
        const buffer = Buffer.from(b64string, "base64");
        const patientName = dataList[i].nome ? dataList[i].nome.replace(/\s+/g, '_') : `Contrato_${i+1}`;
        docsBuffers.push({ name: `Contrato_${patientName}.docx`, buffer });
      }
    }

    // Salva histórico se tiver tenantId
    if (tenantId) {
      const docsDir = path.join(process.cwd(), "public", "uploads", "documents");
      if (!fs.existsSync(docsDir)) {
        fs.mkdirSync(docsDir, { recursive: true });
      }

      for (const doc of docsBuffers) {
        const filename = `${uuidv4()}_${doc.name}`;
        const filePath = path.join(docsDir, filename);
        fs.writeFileSync(filePath, doc.buffer);

        await prisma.generatedDocument.create({
          data: {
            name: doc.name,
            type: "CONTRATO",
            fileUrl: `/uploads/documents/${filename}`,
            tenantId,
          }
        });
      }
    }

    // Retorna zip ou arquivo único
    if (docsBuffers.length === 1) {
      return new NextResponse(new Uint8Array(docsBuffers[0].buffer), {
        status: 200,
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "Content-Disposition": `attachment; filename="${docsBuffers[0].name}"`,
        },
      });
    }

    const zip = new JSZip();
    for (const doc of docsBuffers) {
      zip.file(doc.name, doc.buffer);
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
    console.error("Erro ao gerar Word:", error);
    return NextResponse.json({ error: error.message || "Erro interno" }, { status: 500 });
  }
}
