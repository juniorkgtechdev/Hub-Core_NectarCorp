import { NextResponse } from "next/server";
import { generateContractsPdf } from "@/utils/pdfGenerator";
import { ExtractedData } from "@/types";
import JSZip from "jszip";

export async function POST(req: Request) {
  try {
    const dataList: ExtractedData[] = await req.json();

    if (!dataList || !Array.isArray(dataList) || dataList.length === 0) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }

    const buffers = await generateContractsPdf(dataList);

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
