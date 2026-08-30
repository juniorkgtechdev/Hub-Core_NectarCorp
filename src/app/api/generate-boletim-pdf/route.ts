import { NextResponse } from "next/server";
import { ExtractedData } from "@/types";
import JSZip from "jszip";
import PDFDocument from "pdfkit";
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

    const buffers: Buffer[] = await Promise.all(dataList.map(async (data) => {
      return new Promise<Buffer>((resolve, reject) => {
        try {
          const doc = new PDFDocument({ margin: 50 });
          const pdfBuffers: Buffer[] = [];
          
          doc.on("data", pdfBuffers.push.bind(pdfBuffers));
          doc.on("end", () => resolve(Buffer.concat(pdfBuffers)));

          // Template simples do Boletim em PDF
          doc.font("Helvetica-Bold").fontSize(16).text("BOLETIM DE DADOS CADASTRAIS", { align: "center" });
          doc.moveDown(2);

          const entries = Object.entries(data);
          for (const [key, value] of entries) {
            doc.font("Helvetica-Bold").fontSize(12).text(`${key.toUpperCase()}:`, { continued: true });
            doc.font("Helvetica").text(` ${value || "N/A"}`);
            doc.moveDown(0.5);
          }

          doc.end();
        } catch (e) {
          reject(e);
        }
      });
    }));

    // Salva histórico se tiver tenantId
    if (tenantId) {
      const docsDir = path.join(process.cwd(), "public", "uploads", "documents");
      if (!fs.existsSync(docsDir)) {
        fs.mkdirSync(docsDir, { recursive: true });
      }

      for (let i = 0; i < buffers.length; i++) {
        const data = dataList[i];
        const name = data.nome ? data.nome.replace(/\s+/g, '_') : `Boletim_${i+1}`;
        const filename = `${uuidv4()}_Boletim_${name}.pdf`;
        const filePath = path.join(docsDir, filename);
        fs.writeFileSync(filePath, buffers[i]);

        await prisma.generatedDocument.create({
          data: {
            name: `Boletim_${name}.pdf`,
            type: "BOLETIM",
            fileUrl: `/uploads/documents/${filename}`,
            tenantId,
          }
        });
      }
    }

    if (buffers.length === 1) {
      const name = dataList[0].nome ? dataList[0].nome.replace(/\s+/g, '_') : "Boletim";
      return new NextResponse(new Uint8Array(buffers[0]), {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="Boletim_${name}.pdf"`,
        },
      });
    }

    const zip = new JSZip();
    for (let i = 0; i < buffers.length; i++) {
      const data = dataList[i];
      const name = data.nome ? data.nome.replace(/\s+/g, '_') : `Boletim_${i+1}`;
      zip.file(`Boletim_${name}.pdf`, buffers[i]);
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
    console.error("Erro na geração do Boletim PDF:", error);
    return NextResponse.json({ error: error.message || "Erro interno" }, { status: 500 });
  }
}
