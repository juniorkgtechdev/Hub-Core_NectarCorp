import { NextResponse } from "next/server";
import { generateContractPdf } from "@/utils/pdfGenerator";
import { ExtractedData } from "@/types";

export async function POST(req: Request) {
  try {
    const data = await req.json() as ExtractedData;

    const buffer = await generateContractPdf(data);

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Contrato_${data.nome.replace(/\s+/g, "_")}.pdf"`,
      },
    });
  } catch (error: any) {
    console.error("Erro ao gerar PDF:", error);
    return NextResponse.json({ error: error.message || "Erro interno" }, { status: 500 });
  }
}
