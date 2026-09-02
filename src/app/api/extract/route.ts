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
    
    // Process all files in parallel with isolated error handling
    const results = await Promise.allSettled(
      files.map(async (file) => {
        try {
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
          const data = JSON.parse(jsonString) as ExtractedData;
          return { fileName: file.name, data };
        } catch (err: any) {
          console.error(`Erro ao processar arquivo ${file.name}:`, err.message);
          throw new Error(err.message || "Falha na extração");
        }
      })
    );

    const success: ExtractedData[] = [];
    const errors: { fileName: string; message: string }[] = [];

    results.forEach((result, index) => {
      if (result.status === "fulfilled") {
        const { data } = result.value;
        if (data && data.nome && data.nome.trim() !== "") {
          success.push(data);
        } else {
          // Extracted successfully but no valid data found
          errors.push({ fileName: files[index].name, message: "Nenhum dado legível encontrado na ficha." });
        }
      } else {
        errors.push({ fileName: files[index].name, message: `Falha: ${result.reason?.message || "Erro desconhecido"}` });
      }
    });

    return NextResponse.json({ success, errors });

  } catch (error: any) {
    console.error("Erro na extração em lote:", error);
    return NextResponse.json({ error: error.message || "Erro interno" }, { status: 500 });
  }
}
