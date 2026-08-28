"use client";

import { useState } from "react";
import { UploadCloud, FileText, Loader2, Download, FileDown, LogOut, Settings } from "lucide-react";
import { ExtractedData } from "@/types";
import { signOut } from "next-auth/react";
import Link from "next/link";

export default function Dashboard() {
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [dataList, setDataList] = useState<ExtractedData[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files);
      setFiles(selectedFiles);
      await extractData(selectedFiles);
    }
  };

  const extractData = async (selectedFiles: File[]) => {
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      selectedFiles.forEach((file) => formData.append("file", file));

      const res = await fetch("/api/extract", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Falha ao extrair dados");
      }

      const extracted: ExtractedData[] = await res.json();
      setDataList(extracted);
    } catch (err: any) {
      setError(err.message || "Ocorreu um erro na extração");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async (endpoint: string, filename: string) => {
    if (dataList.length === 0) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataList),
      });

      if (!res.ok) {
        throw new Error(`Falha ao gerar o arquivo`);
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err: any) {
      setError(err.message || `Erro ao gerar arquivo`);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const newDataList = [...dataList];
    newDataList[index] = { ...newDataList[index], [e.target.name]: e.target.value };
    setDataList(newDataList);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
      {/* Top Navbar */}
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">M</div>
          <span className="text-xl font-bold text-slate-800">Medprime</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/admin" className="text-sm font-medium text-slate-600 hover:text-indigo-600 flex items-center gap-1">
            <Settings className="w-4 h-4" /> Admin
          </Link>
          <button onClick={() => signOut()} className="text-sm font-medium text-red-500 hover:text-red-700 flex items-center gap-1">
            <LogOut className="w-4 h-4" /> Sair
          </button>
        </div>
      </nav>

      <main className="flex-1 p-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <header className="text-center mb-10">
            <h1 className="text-3xl font-bold text-slate-800">Gerador de Contratos e Boletins</h1>
            <p className="text-slate-500 mt-2">Faça o upload de uma ou mais Fichas Cadastrais para gerar documentos em lote.</p>
          </header>

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-200">
              {error}
            </div>
          )}

          {dataList.length === 0 && (
            <div className="bg-white p-12 rounded-2xl shadow-sm border border-slate-200 text-center max-w-3xl mx-auto">
              <UploadCloud className="w-16 h-16 text-indigo-500 mx-auto mb-4" />
              <h2 className="text-xl font-medium text-slate-700 mb-2">Selecione as Fichas Cadastrais</h2>
              <p className="text-slate-500 mb-6">Você pode selecionar vários arquivos de uma vez (PDF, JPG, PNG)</p>
              
              <label className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg cursor-pointer transition-colors inline-flex items-center gap-2 shadow-sm">
                {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <FileText className="w-5 h-5" />}
                <span>{loading ? "Processando..." : "Escolher Arquivos"}</span>
                <input type="file" className="hidden" multiple accept=".pdf,image/*" onChange={handleFileChange} disabled={loading} />
              </label>
            </div>
          )}

          {dataList.length > 0 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-800">
                  {dataList.length} {dataList.length === 1 ? "pessoa extraída" : "pessoas extraídas"}
                </h2>
                <button 
                  onClick={() => { setDataList([]); setFiles([]); }}
                  className="text-sm font-medium text-slate-500 hover:text-slate-800"
                >
                  Cancelar e Enviar Outros
                </button>
              </div>

              {/* Grid of Extracted Data */}
              <div className="grid grid-cols-1 gap-6">
                {dataList.map((data, index) => (
                  <div key={index} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="font-semibold text-lg text-slate-800 mb-4 pb-2 border-b border-slate-100">
                      Registro #{index + 1}: {data.nome || "Sem Nome"}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {[
                        { label: "Nome", name: "nome" },
                        { label: "Nacionalidade", name: "nacionalidade" },
                        { label: "Data de Nasc.", name: "dataNascimento" },
                        { label: "Estado Civil", name: "estadoCivil" },
                        { label: "Profissão", name: "profissao" },
                        { label: "Cart. Profissional", name: "carteiraProfissional" },
                        { label: "RG", name: "rg" },
                        { label: "CPF", name: "cpf" },
                        { label: "Endereço", name: "endereco" },
                        { label: "CEP", name: "cep" },
                        { label: "Cidade", name: "cidade" },
                        { label: "UF", name: "estado" },
                      ].map((field) => (
                        <div key={field.name}>
                          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{field.label}</label>
                          <input
                            type="text"
                            name={field.name}
                            value={(data as any)[field.name] || ""}
                            onChange={(e) => handleChange(index, e)}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-wrap gap-4 items-center justify-between sticky bottom-6">
                <div>
                  <h3 className="font-semibold text-slate-800">Exportar Documentos</h3>
                  <p className="text-sm text-slate-500">Escolha o formato desejado para salvar.</p>
                </div>
                
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => handleGenerate("/api/generate-pdf", "Contratos.pdf")}
                    disabled={loading}
                    className="px-5 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition-colors flex items-center gap-2"
                  >
                    {loading ? <Loader2 className="animate-spin w-4 h-4" /> : <FileDown className="w-4 h-4" />}
                    Contratos (PDF)
                  </button>
                  <button
                    onClick={() => handleGenerate("/api/generate-word", "Contratos.docx")}
                    disabled={loading}
                    className="px-5 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition-colors flex items-center gap-2"
                  >
                    {loading ? <Loader2 className="animate-spin w-4 h-4" /> : <Download className="w-4 h-4" />}
                    Contratos (Word)
                  </button>
                  <button
                    onClick={() => handleGenerate("/api/generate-boletim-pdf", "Boletim.pdf")}
                    disabled={loading}
                    className="px-5 py-2.5 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 rounded-lg font-medium transition-colors flex items-center gap-2"
                  >
                    {loading ? <Loader2 className="animate-spin w-4 h-4" /> : <FileDown className="w-4 h-4" />}
                    Boletim (PDF)
                  </button>
                  <button
                    onClick={() => handleGenerate("/api/generate-boletim-word", "Boletim.docx")}
                    disabled={loading}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm rounded-lg font-medium transition-colors flex items-center gap-2"
                  >
                    {loading ? <Loader2 className="animate-spin w-4 h-4" /> : <Download className="w-4 h-4" />}
                    Boletim (Word)
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
