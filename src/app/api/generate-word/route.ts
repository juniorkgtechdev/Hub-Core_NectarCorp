import { NextResponse } from "next/server";
import { generateContractDocx } from "@/utils/contractGenerator";
import { Packer } from "docx";
import { ExtractedData } from "@/types";

export async function POST(req: Request) {
  try {
    const data = await req.json() as ExtractedData;

    const doc = generateContractDocx(data);
    const b64string = await Packer.toBase64String(doc);
    const buffer = Buffer.from(b64string, "base64");

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="Contrato_${data.nome.replace(/\s+/g, "_")}.docx"`,
      },
    });
  } catch (error: any) {
    console.error("Erro ao gerar Word:", error);
    return NextResponse.json({ error: error.message || "Erro interno" }, { status: 500 });
  }
}
