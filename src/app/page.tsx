"use client";

import { useState } from "react";
import { UploadCloud, FileText, Loader2, Download, FileDown } from "lucide-react";
import { ExtractedData } from "@/types";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ExtractedData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      await extractData(selectedFile);
    }
  };

  const extractData = async (selectedFile: File) => {
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const res = await fetch("/api/extract", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Falha ao extrair dados");
      }

      const extracted = await res.json();
      setData(extracted);
    } catch (err: any) {
      setError(err.message || "Ocorreu um erro na extração");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async (type: "word" | "pdf") => {
    if (!data) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/generate-${type}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        throw new Error(`Falha ao gerar o arquivo ${type.toUpperCase()}`);
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Contrato_${data.nome.replace(/\s+/g, "_")}.${type === "word" ? "docx" : "pdf"}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err: any) {
      setError(err.message || `Erro ao gerar o ${type.toUpperCase()}`);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (data) {
      setData({ ...data, [e.target.name]: e.target.value });
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="text-center">
          <h1 className="text-3xl font-bold text-slate-800">Sistema de Contratos</h1>
          <p className="text-slate-500 mt-2">Faça o upload da Ficha Cadastral para gerar o contrato automaticamente.</p>
        </header>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-200">
            {error}
          </div>
        )}

        {!data && (
          <div className="bg-white p-12 rounded-2xl shadow-sm border border-slate-200 text-center">
            <UploadCloud className="w-16 h-16 text-indigo-500 mx-auto mb-4" />
            <h2 className="text-xl font-medium text-slate-700 mb-2">Selecione a Ficha Cadastral</h2>
            <p className="text-slate-500 mb-6">Suporta PDF, JPG e PNG</p>
            
            <label className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg cursor-pointer transition-colors inline-flex items-center gap-2">
              {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <FileText className="w-5 h-5" />}
              <span>{loading ? "Processando..." : "Escolher Arquivo"}</span>
              <input type="file" className="hidden" accept=".pdf,image/*" onChange={handleFileChange} disabled={loading} />
            </label>
          </div>
        )}

        {data && (
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-6 pb-6 border-b border-slate-100">
              <h2 className="text-xl font-semibold text-slate-800">Conferência de Dados</h2>
              <button 
                onClick={() => { setData(null); setFile(null); }}
                className="text-sm text-slate-500 hover:text-slate-800"
              >
                Cancelar e Enviar Outro
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { label: "Nome Completo", name: "nome" },
                { label: "Nacionalidade", name: "nacionalidade" },
                { label: "Estado Civil", name: "estadoCivil" },
                { label: "Profissão", name: "profissao" },
                { label: "RG", name: "rg" },
                { label: "CPF", name: "cpf" },
                { label: "Endereço (Rua e Número)", name: "endereco" },
                { label: "CEP", name: "cep" },
                { label: "Cidade", name: "cidade" },
                { label: "Estado (UF)", name: "estado" },
              ].map((field) => (
                <div key={field.name}>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">{field.label}</label>
                  <input
                    type="text"
                    name={field.name}
                    value={data[field.name as keyof ExtractedData] || ""}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-white border border-slate-300 text-slate-900 font-medium rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all placeholder:text-slate-400"
                  />
                </div>
              ))}
            </div>

            <div className="mt-8 flex gap-4 justify-end pt-6 border-t border-slate-100">
              <button
                onClick={() => handleGenerate("pdf")}
                disabled={loading}
                className="px-6 py-3 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition-colors flex items-center gap-2"
              >
                {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <FileDown className="w-5 h-5" />}
                Exportar PDF
              </button>
              <button
                onClick={() => handleGenerate("word")}
                disabled={loading}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2 shadow-sm"
              >
                {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <Download className="w-5 h-5" />}
                Gerar Contrato (Word)
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
