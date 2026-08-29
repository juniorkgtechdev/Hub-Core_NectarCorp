import { NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "Nenhum arquivo enviado." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Garantir extensão
    const ext = path.extname(file.name) || ".png";
    const filename = `${uuidv4()}${ext}`;
    
    // Pasta onde os arquivos públicos ficam (public/uploads)
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    
    // Garantir que a pasta exista (no node local, em serverless Vercel isso seria diferente)
    const fs = require("fs");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filePath = path.join(uploadDir, filename);
    await writeFile(filePath, buffer);

    const logoUrl = `/uploads/${filename}`;
    return NextResponse.json({ url: logoUrl }, { status: 200 });

  } catch (error: any) {
    console.error("Erro no upload:", error);
    return NextResponse.json({ error: error.message || "Erro interno" }, { status: 500 });
  }
}
