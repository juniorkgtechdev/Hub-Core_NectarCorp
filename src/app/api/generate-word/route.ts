import { NextResponse } from "next/server";
import { generateContractsDocx } from "@/utils/contractGenerator";
import { Packer } from "docx";
import { ExtractedData } from "@/types";
import JSZip from "jszip";

export async function POST(req: Request) {
  try {
    const dataList: ExtractedData[] = await req.json();

    if (!dataList || !Array.isArray(dataList) || dataList.length === 0) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }

    const docs = generateContractsDocx(dataList);
    
    if (docs.length === 1) {
      // Se for apenas 1, retorna direto
      const b64string = await Packer.toBase64String(docs[0]);
      const buffer = Buffer.from(b64string, "base64");
      const name = dataList[0].nome ? dataList[0].nome.replace(/\s+/g, '_') : "Contrato";
      return new NextResponse(new Uint8Array(buffer), {
        status: 200,
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "Content-Disposition": `attachment; filename="Contrato_${name}.docx"`,
        },
      });
    }

    // Se forem vários, empacota num zip
    const zip = new JSZip();
    for (let i = 0; i < docs.length; i++) {
      const doc = docs[i];
      const data = dataList[i];
      const b64string = await Packer.toBase64String(doc);
      const buffer = Buffer.from(b64string, "base64");
      const name = data.nome ? data.nome.replace(/\s+/g, '_') : `Contrato_${i+1}`;
      zip.file(`Contrato_${name}.docx`, buffer);
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
