import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { auth } from "@/auth";
import * as xlsx from "xlsx";
import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const tenantId = session.user.tenantId;
    if (!tenantId) {
      return NextResponse.json({ error: "Tenant não encontrado" }, { status: 403 });
    }

    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) throw new Error("Tenant inválido");

    const body = await req.json();
    const { results, format } = body; // format = "excel" | "pdf"

    if (!results || !Array.isArray(results) || results.length === 0) {
      return NextResponse.json({ error: "Nenhum dado para exportar" }, { status: 400 });
    }

    if (format === "excel") {
      // Gerar Excel
      const wsData = results.map((r: any) => ({
        "CNPJ": r.cnpj,
        "Razão Social": r.razaoSocial,
        "Nome Fantasia": r.nomeFantasia,
        "Situação": r.situacao,
        "Simples Nacional": r.simples?.optante ? "SIM" : "NÃO",
        "SIMEI": r.simei?.optante ? "SIM" : "NÃO",
        "Endereço": r.endereco,
        "Município": r.municipio,
        "UF": r.uf,
        "CEP": r.cep,
      }));

      const ws = xlsx.utils.json_to_sheet(wsData);
      const wb = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(wb, ws, "Consulta CNPJ");

      const buffer = xlsx.write(wb, { type: "buffer", bookType: "xlsx" });

      return new NextResponse(buffer, {
        status: 200,
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="Consulta_CNPJ.xlsx"`,
        },
      });
    } else if (format === "pdf") {
      // Gerar PDF
      const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
        try {
          const doc = new PDFDocument({ margin: 40, size: "A4" });
          const buffers: Buffer[] = [];
          doc.on("data", buffers.push.bind(buffers));
          doc.on("end", () => resolve(Buffer.concat(buffers)));

          // Cabeçalho com Logo
          if (tenant.logoUrl) {
            try {
              let logoPath = tenant.logoUrl;
              if (logoPath.startsWith("/uploads")) {
                logoPath = path.join(process.cwd(), "public", logoPath);
              }
              if (fs.existsSync(logoPath)) {
                doc.image(logoPath, 40, 40, { height: 40 });
                doc.moveDown(3);
              }
            } catch (e) {
              console.warn("Não foi possível renderizar a logo no PDF", e);
            }
          }

          doc.font("Helvetica-Bold").fontSize(18).text("Relatório de Consulta CNPJ", { align: "center" });
          doc.font("Helvetica").fontSize(10).text(`Empresa: ${tenant.name}`, { align: "center" });
          doc.moveDown(2);

          // Lista de resultados
          results.forEach((r: any, idx: number) => {
            doc.font("Helvetica-Bold").fontSize(12).text(`CNPJ: ${r.cnpj}`);
            doc.font("Helvetica").fontSize(10);
            doc.text(`Razão Social: ${r.razaoSocial || "N/A"}`);
            doc.text(`Situação: ${r.situacao || "N/A"}`);
            doc.text(`Simples Nacional: ${r.simples?.optante ? "SIM" : "NÃO"}`);
            doc.text(`SIMEI: ${r.simei?.optante ? "SIM" : "NÃO"}`);
            doc.moveDown(1);
          });

          doc.end();
        } catch (error) {
          reject(error);
        }
      });

      return new NextResponse(pdfBuffer, {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="Consulta_CNPJ.pdf"`,
        },
      });
    }

    return NextResponse.json({ error: "Formato inválido" }, { status: 400 });
  } catch (error: any) {
    console.error("Erro na exportação:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
