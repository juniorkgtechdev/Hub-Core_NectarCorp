import { NextResponse } from "next/server";
import PDFDocument from "pdfkit";
import { ExtractedData } from "@/types";

export async function POST(req: Request) {
  try {
    const dataList: ExtractedData[] = await req.json();

    if (!dataList || !Array.isArray(dataList) || dataList.length === 0) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }

    // Ordenar em ordem alfabética
    const sortedList = [...dataList].sort((a, b) => 
      (a.nome || "").localeCompare(b.nome || "")
    );

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];

      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => {
        const result = Buffer.concat(chunks);
        resolve(
          new NextResponse(result, {
            headers: {
              "Content-Type": "application/pdf",
              "Content-Disposition": `attachment; filename="Boletim.pdf"`,
            },
          })
        );
      });
      doc.on("error", reject);

      // Título
      doc.font("Helvetica-Bold").fontSize(16).text("BOLETIM DE DADOS CADASTRAIS", { align: "center" });
      doc.moveDown(2);

      // Parágrafos
      doc.font("Helvetica").fontSize(12);

      sortedList.forEach((data) => {
        const paragraphText = `${data.nome || ""}, ${data.nacionalidade || ""}, nascido(a) em ${data.dataNascimento || ""}, ${data.profissao || ""}, ${data.estadoCivil || ""}, Portador(a) da carteira profissional ${data.carteiraProfissional || ""}, CPF ${data.cpf || ""}, residente e domiciliado(a) na ${data.endereco || ""}, ${data.cidade || ""}, ${data.estado || ""}, CEP nº ${data.cep || ""}.`;
        
        doc.text(paragraphText, {
          align: "justify",
          indent: 20
        });
        
        // Espaço de uma linha em branco
        doc.moveDown(1);
      });

      doc.end();
    });

  } catch (error: any) {
    console.error("Erro na geração do Boletim PDF:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
