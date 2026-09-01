"use client";

import { useState } from "react";
import { Loader2, Building, CheckCircle, XCircle, AlertCircle, FileText, Search, LayoutDashboard } from "lucide-react";
import InteractiveBackground from "@/components/InteractiveBackground";
import Link from "next/link";

type Tenant = { id: string; name: string; slug: string; logoUrl: string | null };

type CnpjResult = {
  cnpj: string;
  razaoSocial: string;
  nomeFantasia: string;
  situacao: string;
  simples: {
    optante: boolean;
    dataOpcao: string | null;
  };
  simei: {
    optante: boolean;
  };
  endereco: string;
  municipio: string;
  uf: string;
  cep: string;
  atividadePrincipal: string;
};

type CnpjError = {
  cnpj: string;
  message: string;
};

export default function CnpjClient({ tenant }: { tenant: Tenant }) {
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<CnpjResult[]>([]);
  const [errors, setErrors] = useState<CnpjError[]>([]);
  const [invalidLocal, setInvalidLocal] = useState<string[]>([]);
  const [totalParsed, setTotalParsed] = useState(0);
  const [hasSearched, setHasSearched] = useState(false);

  const normalizeCnpj = (text: string) => {
    return text.replace(/[^\d]/g, "");
  };

  const handleConsultar = async () => {
    if (!inputText.trim()) return;

    setLoading(true);
    setHasSearched(true);
    setResults([]);
    setErrors([]);
    setInvalidLocal([]);

    try {
      // Parse e normaliza
      const rawCnpjs = inputText.split(/[\n,;\s]+/).filter(Boolean);
      const normalizedCnpjs = rawCnpjs.map(normalizeCnpj).filter(Boolean);
      
      // Remover duplicatas
      const uniqueCnpjs = Array.from(new Set(normalizedCnpjs));
      setTotalParsed(uniqueCnpjs.length);

      const validCnpjs: string[] = [];
      const invalid: string[] = [];

      uniqueCnpjs.forEach((cnpj) => {
        if (cnpj.length === 14) {
          validCnpjs.push(cnpj);
        } else {
          invalid.push(cnpj);
        }
      });

      setInvalidLocal(invalid);

      if (validCnpjs.length > 0) {
        const response = await fetch("/api/cnpj-consulta", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ cnpjs: validCnpjs }),
        });

        if (!response.ok) {
          throw new Error("Falha ao comunicar com o servidor");
        }

        const data = await response.json();
        setResults(data.success || []);
        setErrors(data.errors || []);
      }
    } catch (err: any) {
      console.error(err);
      setErrors([{ cnpj: "Erro Geral", message: err.message || "Ocorreu um erro na requisição." }]);
    } finally {
      setLoading(false);
    }
  };

  const formatCnpj = (cnpj: string) => {
    if (cnpj.length !== 14) return cnpj;
    return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans selection:bg-purple-500/30">
      <InteractiveBackground />
      
      <div className="relative z-10 flex h-screen">
        {/* Sidebar */}
        <aside className="w-64 bg-gray-900/50 backdrop-blur-xl border-r border-gray-800 flex flex-col transition-all duration-300">
          <div className="p-6 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Building className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                {tenant.name}
              </h2>
              <p className="text-xs text-gray-500 font-medium tracking-wider uppercase">CNPJ Consulta</p>
            </div>
          </div>

          <nav className="flex-1 px-4 py-6 space-y-2">
            <Link href={`/${tenant.slug}/dashboard`} className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all group">
              <LayoutDashboard className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span className="font-medium">Dashboard</span>
            </Link>
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-purple-500/10 text-purple-400 font-medium">
              <Search className="w-5 h-5" />
              <span>Consultar CNPJ</span>
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col h-screen overflow-hidden">
          <header className="h-20 bg-gray-900/30 backdrop-blur-md border-b border-gray-800/50 flex items-center justify-between px-8 shrink-0">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Consulta de Simples Nacional</h1>
              <p className="text-sm text-gray-400">Cole uma lista de CNPJs para consultar dados cadastrais e o Simples.</p>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent">
            {/* Input Section */}
            <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Digite ou cole os CNPJs (separados por linha, vírgula, ou espaços)
              </label>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Exemplo:&#10;12.345.678/0001-90&#10;98.765.432/0001-10"
                className="w-full h-40 bg-gray-900/50 border border-gray-700 rounded-xl p-4 text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all font-mono text-sm resize-none"
              />
              <div className="mt-4 flex justify-end">
                <button
                  onClick={handleConsultar}
                  disabled={loading || !inputText.trim()}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-xl font-medium transition-all shadow-lg shadow-purple-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Consultando...
                    </>
                  ) : (
                    <>
                      <Search className="w-5 h-5" />
                      Consultar CNPJs
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Results Section */}
            {hasSearched && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Stats */}
                <div className="grid grid-cols-5 gap-4">
                  <div className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-4">
                    <p className="text-gray-400 text-sm">Total Identificados</p>
                    <p className="text-2xl font-bold mt-1">{totalParsed}</p>
                  </div>
                  <div className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-4">
                    <p className="text-gray-400 text-sm">Sucesso</p>
                    <p className="text-2xl font-bold text-green-400 mt-1">{results.length}</p>
                  </div>
                  <div className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-4">
                    <p className="text-gray-400 text-sm">Optantes</p>
                    <p className="text-2xl font-bold text-blue-400 mt-1">
                      {results.filter(r => r.simples.optante).length}
                    </p>
                  </div>
                  <div className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-4">
                    <p className="text-gray-400 text-sm">Não Optantes</p>
                    <p className="text-2xl font-bold text-orange-400 mt-1">
                      {results.filter(r => !r.simples.optante).length}
                    </p>
                  </div>
                  <div className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-4">
                    <p className="text-gray-400 text-sm">Erros</p>
                    <p className="text-2xl font-bold text-red-400 mt-1">{errors.length + invalidLocal.length}</p>
                  </div>
                </div>

                {/* Errors Display */}
                {(errors.length > 0 || invalidLocal.length > 0) && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                    <h3 className="flex items-center gap-2 font-medium text-red-400 mb-2">
                      <AlertCircle className="w-5 h-5" />
                      Erros encontrados ({errors.length + invalidLocal.length})
                    </h3>
                    <div className="text-sm text-red-300 space-y-1 mt-2">
                      {invalidLocal.map((cnpj, i) => (
                        <p key={`inv-${i}`}>• <strong>{cnpj}</strong>: Formato inválido (precisa ter 14 dígitos).</p>
                      ))}
                      {errors.map((err, i) => (
                        <p key={`err-${i}`}>• <strong>{formatCnpj(err.cnpj)}</strong>: {err.message}</p>
                      ))}
                    </div>
                  </div>
                )}

                {/* Table */}
                {results.length > 0 && (
                  <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700/50 rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-gray-900/50 border-b border-gray-700/50 text-gray-400">
                          <tr>
                            <th className="px-6 py-4 font-medium">CNPJ</th>
                            <th className="px-6 py-4 font-medium">Razão Social</th>
                            <th className="px-6 py-4 font-medium">Situação</th>
                            <th className="px-6 py-4 font-medium">Simples Nacional</th>
                            <th className="px-6 py-4 font-medium">SIMEI</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700/30">
                          {results.map((r, idx) => (
                            <tr key={idx} className="hover:bg-gray-800/50 transition-colors">
                              <td className="px-6 py-4 font-mono text-gray-300">
                                {formatCnpj(r.cnpj)}
                              </td>
                              <td className="px-6 py-4">
                                <div className="font-medium text-white">{r.razaoSocial}</div>
                                <div className="text-xs text-gray-500">{r.nomeFantasia !== "N/A" ? r.nomeFantasia : ""}</div>
                              </td>
                              <td className="px-6 py-4">
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                  r.situacao.toUpperCase() === "ATIVA" ? "bg-green-500/10 text-green-400" : "bg-gray-500/10 text-gray-400"
                                }`}>
                                  {r.situacao}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                {r.simples.optante ? (
                                  <span className="inline-flex items-center gap-1.5 text-green-400 bg-green-400/10 px-2.5 py-1 rounded-lg">
                                    <CheckCircle className="w-4 h-4" />
                                    SIM
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1.5 text-orange-400 bg-orange-400/10 px-2.5 py-1 rounded-lg">
                                    <XCircle className="w-4 h-4" />
                                    NÃO
                                  </span>
                                )}
                                {r.simples.dataOpcao && (
                                  <div className="text-xs text-gray-500 mt-1">Desde {r.simples.dataOpcao.split('-').reverse().join('/')}</div>
                                )}
                              </td>
                              <td className="px-6 py-4">
                                {r.simei.optante ? (
                                  <span className="text-green-400 font-medium">SIM</span>
                                ) : (
                                  <span className="text-gray-500">NÃO</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
