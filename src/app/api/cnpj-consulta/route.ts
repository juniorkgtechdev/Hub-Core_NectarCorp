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
        const url = `https://brasilapi.com.br/api/cnpj/v1/${cnpj.replace(/\D/g, '')}`;
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
          throw new Error(`Erro na API: ${response.status} ${response.statusText}`);
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
        
        // Mapeamento dos campos principais para o formato esperado
        success.push({
          cnpj: cnpjOriginal,
          razaoSocial: data.razao_social || "N/A",
          nomeFantasia: data.nome_fantasia || "N/A",
          situacao: data.descricao_situacao_cadastral || "N/A",
          simples: {
            optante: !!data.opcao_pelo_simples,
            dataOpcao: data.data_opcao_pelo_simples || null,
          },
          simei: {
            optante: !!data.opcao_pelo_mei,
          },
          endereco: data.descricao_tipo_de_logradouro ? `${data.descricao_tipo_de_logradouro} ${data.logradouro}, ${data.numero || 'S/N'}` : (data.logradouro || ""),
          municipio: data.municipio || "",
          uf: data.uf || "",
          cep: data.cep || "",
          atividadePrincipal: data.cnae_fiscal_descricao || "",
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
