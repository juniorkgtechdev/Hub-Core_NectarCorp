"use client";

import { useState, useEffect } from "react";
import { Loader2, Building, CheckCircle, XCircle, AlertCircle, FileText, Search, Save, FileSpreadsheet } from "lucide-react";
import InteractiveBackground from "@/components/InteractiveBackground";
import Sidebar from "@/components/Sidebar";
import { useSession } from "next-auth/react";

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
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "SUPERADMIN" || session?.user?.role === "ADMIN";
  const isSuperAdmin = session?.user?.role === "SUPERADMIN";
  
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const isDark = theme === 'dark';

  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<CnpjResult[]>([]);
  const [errors, setErrors] = useState<CnpjError[]>([]);
  const [invalidLocal, setInvalidLocal] = useState<string[]>([]);
  const [totalParsed, setTotalParsed] = useState(0);
  const [hasSearched, setHasSearched] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState<string | null>(null);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [cnpjsInHistory, setCnpjsInHistory] = useState<any[]>([]);
  const [pendingValidCnpjs, setPendingValidCnpjs] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/cnpj-consulta/history")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setHistory(data);
          
          if (data.length > 0) {
            const historyMapped: CnpjResult[] = data.map(h => ({
              cnpj: h.cnpj,
              razaoSocial: h.razaoSocial || "N/A",
              nomeFantasia: h.nomeFantasia || "N/A",
              situacao: h.situacao || "N/A",
              simples: { optante: h.simplesOptante, dataOpcao: null },
              simei: { optante: h.simeiOptante },
              endereco: h.endereco || "",
              municipio: h.municipio || "",
              uf: h.uf || "",
              cep: h.cep || "",
              atividadePrincipal: ""
            }));
            
            setResults(historyMapped);
            setTotalParsed(data.length);
            setHasSearched(true);
          }
        }
      })
      .catch(console.error);
  }, []);

  const normalizeCnpj = (text: string) => {
    return text.replace(/[^\d]/g, "");
  };

  const handleConsultar = async () => {
    if (!inputText.trim()) return;

    setHasSearched(false);
    setResults([]);
    setErrors([]);
    setInvalidLocal([]);

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
      const alreadyInDb = validCnpjs.filter(cnpj => history.some(h => h.cnpj === cnpj));
      
      if (alreadyInDb.length > 0) {
        setCnpjsInHistory(history.filter(h => validCnpjs.includes(h.cnpj)));
        setPendingValidCnpjs(validCnpjs);
        setShowModal(true);
      } else {
        executeConsulta(validCnpjs, []);
      }
    } else {
      setHasSearched(true);
    }
  };

  const executeConsulta = async (cnpjsToFetch: string[], cnpjsFromHistory: any[]) => {
    setLoading(true);
    setHasSearched(true);
    
    try {
      let apiResults: CnpjResult[] = [];
      let apiErrors: CnpjError[] = [];
      
      if (cnpjsToFetch.length > 0) {
        const response = await fetch("/api/cnpj-consulta", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ cnpjs: cnpjsToFetch }),
        });

        if (!response.ok) {
          throw new Error("Falha ao comunicar com o servidor");
        }

        const data = await response.json();
        apiResults = data.success || [];
        apiErrors = data.errors || [];

        // Auto-save the newly fetched ones
        if (apiResults.length > 0) {
          try {
            await fetch("/api/cnpj-consulta/save", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ results: apiResults })
            });
            // Reload history silently
            const histRes = await fetch("/api/cnpj-consulta/history");
            const histData = await histRes.json();
            if (Array.isArray(histData)) setHistory(histData);
          } catch (e) {
            console.error("Erro ao auto-salvar histórico:", e);
          }
        }
      }

      // Map history data back to CnpjResult format
      const historyMapped: CnpjResult[] = cnpjsFromHistory.map(h => ({
        cnpj: h.cnpj,
        razaoSocial: h.razaoSocial || "N/A",
        nomeFantasia: h.nomeFantasia || "N/A",
        situacao: h.situacao || "N/A",
        simples: { optante: h.simplesOptante, dataOpcao: null },
        simei: { optante: h.simeiOptante },
        endereco: h.endereco || "",
        municipio: h.municipio || "",
        uf: h.uf || "",
        cep: h.cep || "",
        atividadePrincipal: ""
      }));

      setResults([...historyMapped, ...apiResults]);
      setErrors(apiErrors);
    } catch (err: any) {
      console.error(err);
      setErrors([{ cnpj: "Erro Geral", message: err.message || "Ocorreu um erro na requisição." }]);
    } finally {
      setLoading(false);
    }
  };

  const handleModalAction = (refazer: boolean) => {
    setShowModal(false);
    if (refazer) {
      // Refazer consulta na API para TODOS (ignorando o histórico)
      executeConsulta(pendingValidCnpjs, []);
    } else {
      // Buscar apenas os que não estão no histórico
      const toFetch = pendingValidCnpjs.filter(c => !cnpjsInHistory.some(h => h.cnpj === c));
      executeConsulta(toFetch, cnpjsInHistory);
    }
  };

  const handleSave = async () => {
    if (results.length === 0) return;
    setSaving(true);
    try {
      const response = await fetch("/api/cnpj-consulta/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ results })
      });
      if (response.ok) {
        alert("Consultas salvas no histórico com sucesso!");
        // Reload history
        const histRes = await fetch("/api/cnpj-consulta/history");
        const histData = await histRes.json();
        if (Array.isArray(histData)) setHistory(histData);
      } else {
        alert("Erro ao salvar histórico.");
      }
    } catch (e) {
      console.error(e);
      alert("Erro ao salvar histórico.");
    } finally {
      setSaving(false);
    }
  };

  const handleExport = async (format: "pdf" | "excel") => {
    if (results.length === 0) return;
    setExporting(format);
    try {
      const response = await fetch("/api/cnpj-consulta/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ results, format })
      });
      if (!response.ok) throw new Error("Erro na exportação");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Consulta_CNPJ.${format === "excel" ? "xlsx" : "pdf"}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert("Falha ao exportar arquivo.");
    } finally {
      setExporting(null);
    }
  };

  const getDiffStatus = (current: CnpjResult) => {
    const past = history.find(h => h.cnpj === current.cnpj);
    if (!past) return { type: "NOVO", text: "Novo", color: "bg-blue-500/10 text-blue-400" };
    
    let changed = false;
    let reason = "";
    if (past.simplesOptante !== current.simples.optante) {
      changed = true;
      reason = `Simples mudou para ${current.simples.optante ? "SIM" : "NÃO"}`;
    } else if (past.situacao !== current.situacao) {
      changed = true;
      reason = `Situação mudou para ${current.situacao}`;
    }

    if (changed) return { type: "ALTERADO", text: reason, color: "bg-purple-500/10 text-purple-400 border border-purple-500/30" };
    return { type: "IGUAL", text: "Sem mudança", color: "text-gray-500" };
  };

  const formatCnpj = (cnpj: string) => {
    if (cnpj.length !== 14) return cnpj;
    return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
  };

  return (
    <div className={`min-h-screen font-sans flex h-screen overflow-hidden relative transition-colors duration-500 ${isDark ? 'bg-gray-900 text-white selection:bg-purple-500/30' : 'bg-slate-50 text-slate-800 selection:bg-purple-500/30'}`}>
      {isDark && <InteractiveBackground />}
      
      <Sidebar tenant={tenant} isDark={isDark} isAdmin={isAdmin} setTheme={setTheme} isSuperAdmin={isSuperAdmin} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative z-10 overflow-hidden">
        <main className="flex-1 flex flex-col h-screen overflow-hidden">
          <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent">
            {/* Page Header */}
            <div>
              <h1 className={`text-2xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-800'}`}>Consulta de Simples Nacional</h1>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>Cole uma lista de CNPJs para consultar dados cadastrais e o Simples.</p>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent">
            {/* Stats (Cards) na parte superior */}
            {hasSearched && (
              <div className="grid grid-cols-5 gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
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
            )}
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

                {/* Table Header with Actions */}
                {results.length > 0 && (
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold">Resultados da Consulta</h3>
                    <div className="flex gap-3">
                      <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm font-medium transition-colors border border-gray-700">
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 text-green-400" />}
                        Salvar no Histórico
                      </button>
                      <button onClick={() => handleExport("excel")} disabled={exporting !== null} className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm font-medium transition-colors border border-gray-700">
                        {exporting === "excel" ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4 text-emerald-400" />}
                        Excel
                      </button>
                      <button onClick={() => handleExport("pdf")} disabled={exporting !== null} className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm font-medium transition-colors border border-gray-700">
                        {exporting === "pdf" ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4 text-red-400" />}
                        PDF
                      </button>
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
                            <th className="px-6 py-4 font-medium">Status / Diff</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700/30">
                          {results.map((r, idx) => {
                            const diff = getDiffStatus(r);
                            return (
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
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${diff.color}`}>
                                  {diff.text}
                                </span>
                              </td>
                            </tr>
                          );
                          })}
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-4 text-purple-400">
              <AlertCircle className="w-6 h-6" />
              <h2 className="text-lg font-bold text-white">CNPJs já consultados</h2>
            </div>
            
            <p className="text-gray-300 text-sm mb-6">
              Identificamos que <strong>{cnpjsInHistory.length}</strong> dos CNPJs inseridos já estão salvos no seu banco de dados.
              <br /><br />
              Deseja refazer a consulta na API para atualizar os dados, ou usar as informações já salvas para maior rapidez?
            </p>

            <div className="flex flex-col gap-3">
              <button 
                onClick={() => handleModalAction(false)}
                className="w-full px-4 py-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl font-medium transition-colors text-white"
              >
                Usar dados do banco (Não atualizar)
              </button>
              <button 
                onClick={() => handleModalAction(true)}
                className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-xl font-medium transition-all shadow-lg shadow-purple-500/25"
              >
                Refazer consulta (Atualizar dados)
              </button>
              <button 
                onClick={() => setShowModal(false)}
                className="w-full px-4 py-2 mt-2 text-gray-500 hover:text-white transition-colors text-sm font-medium"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
