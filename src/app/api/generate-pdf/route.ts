import { NextResponse } from "next/server";
import { generateContractsPdf } from "@/utils/pdfGenerator";
import { ExtractedData } from "@/types";

export async function POST(req: Request) {
  try {
    const dataList: ExtractedData[] = await req.json();

    if (!dataList || !Array.isArray(dataList) || dataList.length === 0) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }

    const buffer = await generateContractsPdf(dataList);

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Contratos.pdf"`,
      },
    });
  } catch (error: any) {
    console.error("Erro ao gerar PDF:", error);
    return NextResponse.json({ error: error.message || "Erro interno" }, { status: 500 });
  }
}
