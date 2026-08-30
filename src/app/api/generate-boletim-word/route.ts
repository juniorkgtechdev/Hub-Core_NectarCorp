import { NextResponse } from "next/server";
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";
import { ExtractedData } from "@/types";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const dataList: ExtractedData[] = body.dataList || body;

    if (!dataList || !Array.isArray(dataList) || dataList.length === 0) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }

    // 1. Ordenar em ordem alfabética
    const sortedList = [...dataList].sort((a, b) => 
      (a.nome || "").localeCompare(b.nome || "")
    );

    // 2. Criar os parágrafos do Boletim
    const children: Paragraph[] = [
      new Paragraph({
        text: "BOLETIM DE DADOS CADASTRAIS",
        heading: HeadingLevel.HEADING_1,
        alignment: "center",
        spacing: { after: 400 },
      })
    ];

    sortedList.forEach((data) => {
      // Formato exigido:
      // "[Nome], [nacionalidade], nascida em [dataNascimento], [profissao], [estado civil], Portadora da carteira profissional [carteiraProfissional], CPF [cpf], residente e domiciliada na [endereco], [cidade], [estado], CEP nº [cep]."
      const paragraphText = `${data.nome || ""}, ${data.nacionalidade || ""}, nascido(a) em ${data.dataNascimento || ""}, ${data.profissao || ""}, ${data.estadoCivil || ""}, Portador(a) da carteira profissional ${data.carteiraProfissional || ""}, CPF ${data.cpf || ""}, residente e domiciliado(a) na ${data.endereco || ""}, ${data.cidade || ""}, ${data.estado || ""}, CEP nº ${data.cep || ""}.`;

      children.push(
        new Paragraph({
          children: [new TextRun({ text: paragraphText, size: 24 })], // size 24 = 12pt
          spacing: { after: 240 }, // Adiciona um espaço/linha em branco após o parágrafo
          alignment: "both", // Justificado
        })
      );
    });

    const doc = new Document({
      sections: [{
        properties: {},
        children: children,
      }],
    });

    const buffer = await Packer.toBuffer(doc);

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="Boletim.docx"`,
      },
    });

  } catch (error: any) {
    console.error("Erro na geração do Boletim Word:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
