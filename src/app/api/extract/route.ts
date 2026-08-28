import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { ExtractedData } from "@/types";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    // Mock data if no API key is provided
    if (!apiKey) {
      console.warn("GEMINI_API_KEY não configurada. Usando dados fictícios (Mock).");
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockData: ExtractedData = {
        nome: "Caroline Maria de Lima Verza",
        nacionalidade: "Brasileira",
        estadoCivil: "Solteira",
        profissao: "Médico",
        rg: "39122263-6",
        cpf: "366598018-63",
        endereco: "Rua Piracicaba, 1025",
        cep: "14000-000",
        cidade: "Ribeirão Preto",
        estado: "SP",
      };
      return NextResponse.json(mockData);
    }

    const ai = new GoogleGenAI({ apiKey });
    
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // We assume the model expects a base64 encoded string or part object
    const mimeType = file.type || "application/pdf";
    
    const prompt = `Extraia as seguintes informações da ficha cadastral em anexo e retorne APENAS um objeto JSON válido (sem formatação markdown) com as seguintes chaves (exatamente com estes nomes, em camelCase):
    - nome
    - nacionalidade
    - estadoCivil
    - profissao (geralmente "Médico" ou na função)
    - rg
    - cpf
    - endereco (Rua e número)
    - cep
    - cidade (Se possível deduzir ou extrair, se não deixe vazio)
    - estado (UF, ex: SP)
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        { role: "user", parts: [
          { inlineData: { data: buffer.toString("base64"), mimeType } },
          { text: prompt }
        ]}
      ],
      config: {
        responseMimeType: "application/json"
      }
    });

    const jsonString = response.text || "{}";
    const extractedData = JSON.parse(jsonString) as ExtractedData;

    return NextResponse.json(extractedData);

  } catch (error: any) {
    console.error("Erro na extração:", error);
    return NextResponse.json({ error: error.message || "Erro interno" }, { status: 500 });
  }
}
