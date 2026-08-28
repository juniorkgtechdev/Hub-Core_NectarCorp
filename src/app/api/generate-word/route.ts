import { NextResponse } from "next/server";
import { generateContractsDocx } from "@/utils/contractGenerator";
import { Packer } from "docx";
import { ExtractedData } from "@/types";

export async function POST(req: Request) {
  try {
    const dataList: ExtractedData[] = await req.json();

    if (!dataList || !Array.isArray(dataList) || dataList.length === 0) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }

    const doc = generateContractsDocx(dataList);
    const b64string = await Packer.toBase64String(doc);
    const buffer = Buffer.from(b64string, "base64");

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="Contratos.docx"`,
      },
    });
  } catch (error: any) {
    console.error("Erro ao gerar Word:", error);
    return NextResponse.json({ error: error.message || "Erro interno" }, { status: 500 });
  }
}
