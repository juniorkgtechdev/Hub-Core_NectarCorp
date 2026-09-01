import { NextResponse } from "next/server";
import { auth } from "@/auth";

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

export async function POST(req: Request) {
  try {
    // Validação de autenticação existente
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const { cnpjs } = body;

    if (!cnpjs || !Array.isArray(cnpjs) || cnpjs.length === 0) {
      return NextResponse.json({ error: "Lista de CNPJs inválida" }, { status: 400 });
    }

    const success: any[] = [];
    const errors: { cnpj: string; message: string }[] = [];

    // Remover duplicatas
    const uniqueCnpjs = Array.from(new Set(cnpjs));

    // Processamento estritamente sequencial com delay para respeitar o rate limit da API gratuita
    const results: any[] = [];
    for (let i = 0; i < uniqueCnpjs.length; i++) {
      const cnpj = uniqueCnpjs[i];
      
      if (i > 0) {
        await delay(1500); // Espera 1.5 segundos entre cada requisição
      }

      try {
        const url = `https://open.cnpja.com/office/${cnpj}`;
        const response = await fetch(url, {
          method: "GET",
          headers: {
            "Accept": "application/json",
          },
        });

        if (response.status === 429) {
          throw new Error("Rate limit atingido (Muitas requisições).");
        }

        if (!response.ok) {
          throw new Error(`Erro na API CNPJa: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        results.push({ status: "fulfilled", value: { cnpj, data } });
      } catch (err: any) {
        results.push({ status: "rejected", reason: err, cnpj });
      }
    }

    results.forEach((result) => {
      if (result.status === "fulfilled") {
        const data = result.value.data;
        const cnpjOriginal = result.value.cnpj;
        
        // Mapeamento dos campos principais
        success.push({
          cnpj: cnpjOriginal,
          razaoSocial: data.company?.name || "N/A",
          nomeFantasia: data.alias || "N/A",
          situacao: data.status?.text || "N/A",
          simples: {
            optante: !!data.simples?.optant,
            dataOpcao: data.simples?.since || null,
          },
          simei: {
            optante: !!data.simei?.optant,
          },
          endereco: data.address?.street || "",
          municipio: data.address?.city || "",
          uf: data.address?.state || "",
          cep: data.address?.zip || "",
          atividadePrincipal: data.mainActivity?.text || "",
        });
      } else {
        errors.push({ 
          cnpj: result.cnpj, 
          message: result.reason?.message || "Não foi possível consultar este CNPJ. Pode ser inválido ou rate limit atingido." 
        });
      }
    });

    return NextResponse.json({ success, errors });

  } catch (error: any) {
    console.error("Erro no módulo de consulta de CNPJ:", error);
    return NextResponse.json({ error: error.message || "Erro interno" }, { status: 500 });
  }
}
