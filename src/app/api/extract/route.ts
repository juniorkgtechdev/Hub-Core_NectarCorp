import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { ExtractedData } from "@/types";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const files = formData.getAll("file") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    // Mock data
    if (!apiKey) {
      console.warn("GEMINI_API_KEY não configurada. Usando dados fictícios (Mock).");
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockDataArray: ExtractedData[] = files.map((f, index) => ({
        nome: index === 0 ? "Eduarda Kohakoski" : `Mock Pessoa ${index + 1}`,
        nacionalidade: "Brasileira",
        dataNascimento: "17/01/1998",
        estadoCivil: "Solteira",
        profissao: "Médica",
        carteiraProfissional: "55082 CRM/PR",
        rg: "39.122.263-6",
        cpf: "064.258.409-51",
        endereco: "Rua João Baptista Gobbo, nº 117, Oficinas",
        cep: "85854-540",
        cidade: "Ponta Grossa",
        estado: "PR",
      }));
      return NextResponse.json(mockDataArray);
    }

    const ai = new GoogleGenAI({ apiKey });
    
    // Process all files in parallel
    const extractions = await Promise.all(
      files.map(async (file) => {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const mimeType = file.type || "application/pdf";
        
        const prompt = `Extraia as seguintes informações da ficha cadastral em anexo e retorne APENAS um objeto JSON válido (sem formatação markdown) com as seguintes chaves (exatamente com estes nomes, em camelCase):
        - nome
        - nacionalidade
        - dataNascimento (apenas a data ex: 17/01/1998)
        - estadoCivil
        - profissao (geralmente "Médico" ou na função)
        - carteiraProfissional (ex: 55082 CRM/PR)
        - rg
        - cpf
        - endereco (Rua, número e bairro se tiver)
        - cep
        - cidade (Se possível deduzir ou extrair)
        - estado (UF, ex: SP ou Paraná)
        
        Se a ficha estiver vazia ou não tiver dados legíveis, retorne um objeto vazio.`;

        const response = await ai.models.generateContent({
          model: "gemini-3.6-flash",
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
        return JSON.parse(jsonString) as ExtractedData;
      })
    );

    // Filter out empty objects in case a file had no readable data
    const validExtractions = extractions.filter(d => d.nome && d.nome.trim() !== "");

    return NextResponse.json(validExtractions);

  } catch (error: any) {
    console.error("Erro na extração em lote:", error);
    return NextResponse.json({ error: error.message || "Erro interno" }, { status: 500 });
  }
}
