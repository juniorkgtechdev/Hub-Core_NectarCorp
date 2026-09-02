import { GoogleGenAI } from "@google/genai";
import * as dotenv from "dotenv";

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error("ERRO: GEMINI_API_KEY não está definida no arquivo .env");
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey });

async function test() {
  console.log("Iniciando teste de comunicação com o Gemini...");
  console.log("API Key carregada:", apiKey.slice(0, 10) + "...");
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash-lite",
      contents: "Responda pode extrir dados ede um arquivo pdf?"
    });

    console.log("SUCESSO na comunicação com a IA!");
    console.log("Resposta:", response.text);
  } catch (error: any) {
    console.error("FALHA na comunicação com a IA.");
    console.error("Detalhes do erro:", error.message);
    if (error.status) console.error("Status HTTP:", error.status);
    console.error(error);
  }
}

test();
