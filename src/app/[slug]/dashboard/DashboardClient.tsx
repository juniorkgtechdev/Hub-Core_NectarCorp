"use client";

import { useState, useEffect } from "react";
import { UploadCloud, FileText, Loader2, Download, FileDown, LogOut, Settings, Users, Plus, Trash2, Shield, Sun, Moon, Edit2 } from "lucide-react";
import { ExtractedData } from "@/types";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import InteractiveBackground from "@/components/InteractiveBackground";

type Tenant = { id: string; name: string; slug: string; logoUrl: string | null };
type User = { id: string; name: string | null; email: string; role: string; createdAt: string };

export default function DashboardClient({ tenant }: { tenant: Tenant }) {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "SUPERADMIN" || session?.user?.role === "ADMIN";
  const isSuperAdmin = session?.user?.role === "SUPERADMIN";
  
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [dataList, setDataList] = useState<ExtractedData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  // Theme Management
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const isDark = theme === 'dark';

  // Users Management State
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [teamUsers, setTeamUsers] = useState<User[]>([]);
  const [loadingTeam, setLoadingTeam] = useState(false);
  
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [newUser, setNewUser] = useState({ name: "", email: "", password: "", role: "USER" });
  const [teamError, setTeamError] = useState<string | null>(null);

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
    setLoadingAction(endpoint);
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
      setLoadingAction(null);
    }
  };

  const handleChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const newDataList = [...dataList];
    newDataList[index] = { ...newDataList[index], [e.target.name]: e.target.value };
    setDataList(newDataList);
  };

  const fetchTeam = async () => {
    setLoadingTeam(true);
    try {
      const res = await fetch("/api/tenant/users");
      if (res.ok) {
        const data = await res.json();
        setTeamUsers(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingTeam(false);
    }
  };

  const handleCreateOrUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.email) return;
    setLoadingTeam(true);
    setTeamError(null);
    try {
      const method = editingUserId ? "PUT" : "POST";
      const payload: any = { ...newUser, newRole: newUser.role };
      if (editingUserId) {
        payload.id = editingUserId;
      }

      const res = await fetch("/api/tenant/users", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erro ao salvar usuário");
      }
      setEditingUserId(null);
      setNewUser({ name: "", email: "", password: "", role: "USER" });
      await fetchTeam();
    } catch (e: any) {
      setTeamError(e.message);
    } finally {
      setLoadingTeam(false);
    }
  };

  const handleEditUser = (u: User) => {
    setEditingUserId(u.id);
    setNewUser({
      name: u.name || "",
      email: u.email,
      role: u.role,
      password: ""
    });
  };

  const cancelEdit = () => {
    setEditingUserId(null);
    setNewUser({ name: "", email: "", password: "", role: "USER" });
    setTeamError(null);
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm("Tem certeza que deseja remover este usuário?")) return;
    setLoadingTeam(true);
    try {
      const res = await fetch(`/api/tenant/users?id=${id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Erro ao remover");
      } else {
        await fetchTeam();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingTeam(false);
    }
  };

  useEffect(() => {
    if (showTeamModal) {
      fetchTeam();
    }
  }, [showTeamModal]);

  return (
    <div className={`min-h-screen font-sans flex flex-col relative transition-colors duration-500 ${isDark ? 'bg-[#0a0a0a] text-white' : 'bg-slate-50 text-slate-800'}`}>
      {/* Background Interativo apenas no modo dark */}
      {isDark && <InteractiveBackground colorful={false} staticMode={true} />}

      {/* Top Navbar */}
      <nav className={`relative z-10 px-6 py-4 flex items-center justify-between transition-colors ${
        isDark ? 'bg-black/40 backdrop-blur-md border-b border-white/10' : 'bg-white border-b border-slate-200 shadow-sm'
      }`}>
        <div className="flex items-center gap-3">
          {tenant.logoUrl ? (
            <div className={`relative w-8 h-8 rounded-md overflow-hidden p-0.5 border ${
              isDark ? 'bg-white/5 border-white/10' : 'bg-slate-100 border-slate-200'
            }`}>
              <Image src={tenant.logoUrl} alt="Logo" fill className="object-contain" />
            </div>
          ) : (
            <div className="w-8 h-8 bg-indigo-500/20 border border-indigo-500/30 rounded-lg flex items-center justify-center text-indigo-500 font-bold">
              {tenant.name.charAt(0).toUpperCase()}
            </div>
          )}
          <span className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>{tenant.name}</span>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className={`p-2 rounded-lg transition-colors ${
              isDark ? 'text-slate-400 hover:text-white hover:bg-white/10' : 'text-slate-500 hover:text-indigo-600 hover:bg-slate-100'
            }`}
            title="Alternar Tema"
          >
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          
          {isAdmin && (
            <button 
              onClick={() => setShowTeamModal(true)}
              className={`text-sm font-medium transition-colors flex items-center gap-1 px-3 py-1.5 rounded-lg border ${
                isDark ? 'text-slate-300 hover:text-white bg-white/5 border-white/10 hover:bg-white/10' : 'text-slate-600 hover:text-indigo-600 bg-white border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Users className="w-4 h-4" /> Gerenciar Equipe
            </button>
          )}
          {isSuperAdmin && (
            <Link href="/superadmin" className={`text-sm font-medium transition-colors flex items-center gap-1 ${
              isDark ? 'text-slate-300 hover:text-white' : 'text-slate-600 hover:text-indigo-600'
            }`}>
              <Settings className="w-4 h-4" /> Admin Global
            </Link>
          )}
          <button onClick={() => signOut()} className="text-sm font-medium text-red-500 hover:text-red-600 transition-colors flex items-center gap-1 ml-2 border-l pl-4 border-slate-200 dark:border-white/10">
            <LogOut className="w-4 h-4" /> Sair
          </button>
        </div>
      </nav>

      <main className="relative z-10 flex-1 p-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <header className="text-center mb-10">
            <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>Gerador de Contratos e Boletins</h1>
            <p className={`mt-2 text-lg ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Faça o upload de uma ou mais Fichas Cadastrais para gerar documentos em lote.</p>
          </header>

          {error && (
            <div className={`p-4 rounded-lg border backdrop-blur-sm ${
              isDark ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-red-50 text-red-600 border-red-200'
            }`}>
              {error}
            </div>
          )}

          {dataList.length === 0 && (
            <div className={`p-12 rounded-3xl text-center max-w-3xl mx-auto relative overflow-hidden group transition-all ${
              isDark ? 'bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl' : 'bg-white border border-slate-200 shadow-md'
            }`}>
              {isDark && <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 opacity-50 group-hover:opacity-100 transition-opacity" />}
              <div className="relative">
                <UploadCloud className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-[#D9AE55]' : 'text-indigo-500'}`} />
                <h2 className={`text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-slate-700'}`}>Selecione as Fichas Cadastrais</h2>
                <p className={`mb-8 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Você pode selecionar vários arquivos de uma vez (PDF, JPG, PNG)</p>
                
                {isDark ? (
                  <label className="relative inline-flex h-12 overflow-hidden rounded-xl p-[1px] focus:outline-none focus:ring-2 focus:ring-[#D9AE55] focus:ring-offset-2 focus:ring-offset-[#0a0a0a] group/btn cursor-pointer">
                    <span className="absolute inset-[-1000%] animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,transparent_0%,#D9AE55_50%,transparent_100%)]" />
                    <span className="inline-flex h-full w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-black px-6 py-1 text-sm font-medium text-white backdrop-blur-3xl transition-colors group-hover/btn:bg-black/70">
                      {loading ? <Loader2 className="animate-spin w-5 h-5 text-[#D9AE55]" /> : <FileText className="w-5 h-5 text-[#D9AE55]" />}
                      {loading ? "Processando..." : "Escolher Arquivos"}
                    </span>
                    <input type="file" className="hidden" multiple accept=".pdf,image/*" onChange={handleFileChange} disabled={loading} />
                  </label>
                ) : (
                  <label className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl cursor-pointer transition-colors inline-flex items-center gap-2 shadow-sm font-medium">
                    {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <FileText className="w-5 h-5" />}
                    <span>{loading ? "Processando..." : "Escolher Arquivos"}</span>
                    <input type="file" className="hidden" multiple accept=".pdf,image/*" onChange={handleFileChange} disabled={loading} />
                  </label>
                )}
              </div>
            </div>
          )}

          {dataList.length > 0 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className={`text-xl font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-800'}`}>
                  <span className={`px-3 py-1 rounded-full text-sm ${
                    isDark ? 'bg-[#D9AE55]/20 text-[#D9AE55]' : 'bg-indigo-100 text-indigo-700'
                  }`}>
                    {dataList.length}
                  </span>
                  {dataList.length === 1 ? "registro extraído" : "registros extraídos"}
                </h2>
                <button 
                  onClick={() => { setDataList([]); setFiles([]); }}
                  className={`text-sm font-medium transition-colors ${
                    isDark ? 'text-slate-400 hover:text-[#D9AE55]' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Cancelar e Enviar Outros
                </button>
              </div>

              {/* Grid of Extracted Data */}
              <div className="grid grid-cols-1 gap-6">
                {dataList.map((data, index) => (
                  <div key={index} className={`p-6 rounded-2xl shadow-sm border transition-colors ${
                    isDark ? 'bg-white/5 backdrop-blur-lg border-white/10' : 'bg-white border-slate-200'
                  }`}>
                    <h3 className={`font-semibold text-lg mb-6 pb-4 border-b flex items-center gap-3 ${
                      isDark ? 'text-white border-white/10' : 'text-slate-800 border-slate-100'
                    }`}>
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                        isDark ? 'bg-white/10 text-slate-300' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {index + 1}
                      </span>
                      {data.nome || "Extração Pendente"}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-5">
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
                          <label className={`block text-[11px] font-semibold uppercase tracking-wider mb-1.5 ${
                            isDark ? 'text-slate-400' : 'text-slate-500'
                          }`}>{field.label}</label>
                          <input
                            type="text"
                            name={field.name}
                            value={(data as any)[field.name] || ""}
                            onChange={(e) => handleChange(index, e)}
                            className={`w-full px-3 py-2.5 text-sm rounded-lg focus:outline-none focus:ring-1 transition-all ${
                              isDark 
                                ? 'bg-black/30 border border-white/10 text-slate-200 focus:bg-black/50 focus:border-[#D9AE55] focus:ring-[#D9AE55] placeholder:text-slate-600' 
                                : 'bg-slate-50 border border-slate-200 text-slate-800 focus:bg-white focus:border-indigo-500 focus:ring-indigo-500'
                            }`}
                            placeholder="-"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className={`p-6 rounded-2xl shadow-lg border flex flex-wrap gap-4 items-center justify-between sticky bottom-6 z-20 transition-colors ${
                isDark ? 'bg-black/60 backdrop-blur-xl border-white/10' : 'bg-white border-slate-200'
              }`}>
                <div>
                  <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-slate-800'}`}>Exportar Documentos</h3>
                  <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Escolha o formato desejado para salvar o lote processado.</p>
                </div>
                
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => handleGenerate("/api/generate-pdf", "Contratos.zip")}
                    disabled={loadingAction !== null}
                    className={`px-5 py-2.5 rounded-xl font-medium transition-colors flex items-center gap-2 disabled:opacity-50 ${
                      isDark 
                        ? 'bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10' 
                        : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {loadingAction === "/api/generate-pdf" ? <Loader2 className="animate-spin w-4 h-4" /> : <FileDown className="w-4 h-4" />}
                    Contratos (PDF ZIP)
                  </button>
                  <button
                    onClick={() => handleGenerate("/api/generate-word", "Contratos.zip")}
                    disabled={loadingAction !== null}
                    className={`px-5 py-2.5 rounded-xl font-medium transition-colors flex items-center gap-2 disabled:opacity-50 ${
                      isDark 
                        ? 'bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10' 
                        : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {loadingAction === "/api/generate-word" ? <Loader2 className="animate-spin w-4 h-4" /> : <Download className="w-4 h-4" />}
                    Contratos (Word ZIP)
                  </button>
                  
                  {isDark ? (
                    <>
                      <button
                        onClick={() => handleGenerate("/api/generate-boletim-pdf", "Boletim.zip")}
                        disabled={loadingAction !== null}
                        className="px-5 py-2.5 bg-[#D9AE55]/10 border border-[#D9AE55]/30 text-[#D9AE55] hover:bg-[#D9AE55]/20 rounded-xl font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
                      >
                        {loadingAction === "/api/generate-boletim-pdf" ? <Loader2 className="animate-spin w-4 h-4" /> : <FileDown className="w-4 h-4" />}
                        Boletim (PDF ZIP)
                      </button>

                      <button
                        onClick={() => handleGenerate("/api/generate-boletim-word", "Boletim.zip")}
                        disabled={loadingAction !== null}
                        className="relative inline-flex h-11 overflow-hidden rounded-xl p-[1px] focus:outline-none focus:ring-2 focus:ring-[#D9AE55] focus:ring-offset-2 focus:ring-offset-[#0a0a0a] group/btn disabled:opacity-50"
                      >
                        <span className="absolute inset-[-1000%] animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,transparent_0%,#D9AE55_50%,transparent_100%)]" />
                        <span className="inline-flex h-full w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-black px-5 py-1 text-sm font-medium text-white backdrop-blur-3xl transition-colors group-hover/btn:bg-black/70">
                          {loadingAction === "/api/generate-boletim-word" ? <Loader2 className="animate-spin w-4 h-4 text-[#D9AE55]" /> : <Download className="w-4 h-4 text-[#D9AE55]" />}
                          Boletim (Word ZIP)
                        </span>
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => handleGenerate("/api/generate-boletim-pdf", "Boletim.zip")}
                        disabled={loadingAction !== null}
                        className="px-5 py-2.5 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 rounded-xl font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
                      >
                        {loadingAction === "/api/generate-boletim-pdf" ? <Loader2 className="animate-spin w-4 h-4" /> : <FileDown className="w-4 h-4" />}
                        Boletim (PDF ZIP)
                      </button>
                      <button
                        onClick={() => handleGenerate("/api/generate-boletim-word", "Boletim.zip")}
                        disabled={loadingAction !== null}
                        className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm rounded-xl font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
                      >
                        {loadingAction === "/api/generate-boletim-word" ? <Loader2 className="animate-spin w-4 h-4" /> : <Download className="w-4 h-4" />}
                        Boletim (Word ZIP)
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Team Management Modal */}
      {showTeamModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className={`border rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] transition-colors relative ${
            isDark ? 'bg-[#0f0f11] border-white/10' : 'bg-white border-slate-200'
          }`}>
            <div className={`p-6 border-b flex items-center justify-between ${
              isDark ? 'border-white/10 bg-white/5' : 'border-slate-100 bg-slate-50'
            }`}>
              <h2 className={`text-xl font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-800'}`}>
                <Shield className={`w-5 h-5 ${isDark ? 'text-[#D9AE55]' : 'text-indigo-600'}`} />
                Gerenciar Equipe ({tenant.name})
              </h2>
              <button 
                onClick={() => { setShowTeamModal(false); cancelEdit(); }}
                className={`transition-colors ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-400 hover:text-slate-800'}`}
              >
                ✕
              </button>
            </div>
            
            <div className="flex-1 overflow-auto p-6 flex flex-col lg:flex-row gap-8">
              {/* Add/Edit User Form */}
              <div className="w-full lg:w-1/3 space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                    {editingUserId ? "Editar Usuário" : "Novo Usuário"}
                  </h3>
                  {editingUserId && (
                    <button onClick={cancelEdit} className="text-xs text-slate-500 hover:text-slate-700">
                      Cancelar
                    </button>
                  )}
                </div>
                {teamError && (
                  <div className={`text-sm p-3 rounded-lg border ${
                    isDark ? 'text-red-400 bg-red-500/10 border-red-500/20' : 'text-red-600 bg-red-50 border-red-200'
                  }`}>
                    {teamError}
                  </div>
                )}
                <form onSubmit={handleCreateOrUpdateUser} className="space-y-4">
                  <div>
                    <label className={`block text-xs mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Nome</label>
                    <input 
                      type="text" required value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})}
                      className={`w-full rounded-lg px-3 py-2 text-sm outline-none border transition-colors ${
                        isDark 
                          ? 'bg-black/50 border-white/10 text-white focus:border-[#D9AE55]' 
                          : 'bg-white border-slate-300 text-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`block text-xs mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Email</label>
                    <input 
                      type="email" required value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})}
                      className={`w-full rounded-lg px-3 py-2 text-sm outline-none border transition-colors ${
                        isDark 
                          ? 'bg-black/50 border-white/10 text-white focus:border-[#D9AE55]' 
                          : 'bg-white border-slate-300 text-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`block text-xs mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      {editingUserId ? "Nova Senha (opcional)" : "Senha (Opcional - E-mail de convite será enviado)"}
                    </label>
                    <input 
                      type="password" required={false} value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})}
                      placeholder={editingUserId ? "Deixe em branco para não alterar" : "Deixe em branco para auto-gerar"}
                      className={`w-full rounded-lg px-3 py-2 text-sm outline-none border transition-colors ${
                        isDark 
                          ? 'bg-black/50 border-white/10 text-white focus:border-[#D9AE55] placeholder:text-slate-600' 
                          : 'bg-white border-slate-300 text-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 placeholder:text-slate-400'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`block text-xs mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Permissão</label>
                    <select 
                      value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})}
                      className={`w-full rounded-lg px-3 py-2 text-sm outline-none border transition-colors ${
                        isDark 
                          ? 'bg-black/50 border-white/10 text-white focus:border-[#D9AE55]' 
                          : 'bg-white border-slate-300 text-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'
                      }`}
                    >
                      <option value="USER">Usuário (USER)</option>
                      <option value="ADMIN">Administrador (ADMIN)</option>
                    </select>
                  </div>
                  <button 
                    disabled={loadingTeam}
                    type="submit"
                    className={`w-full py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 ${
                      isDark 
                        ? 'bg-white/10 hover:bg-white/20 border border-white/10 text-white'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm'
                    }`}
                  >
                    {loadingTeam ? <Loader2 className="w-4 h-4 animate-spin" /> : editingUserId ? <Edit2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    {editingUserId ? "Salvar Alterações" : "Cadastrar Usuário"}
                  </button>
                </form>
              </div>

              {/* Users List */}
              <div className="w-full lg:w-2/3 flex flex-col">
                <h3 className={`font-semibold mb-4 ${isDark ? 'text-white' : 'text-slate-800'}`}>Usuários Ativos</h3>
                <div className={`flex-1 rounded-xl border overflow-hidden ${
                  isDark ? 'bg-black/30 border-white/10' : 'bg-slate-50 border-slate-200'
                }`}>
                  {teamUsers.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 text-sm">Carregando usuários...</div>
                  ) : (
                    <table className="w-full text-left text-sm">
                      <thead className={`text-xs uppercase border-b ${
                        isDark ? 'bg-black/40 text-slate-400 border-white/10' : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}>
                        <tr>
                          <th className="px-4 py-3">Nome / Email</th>
                          <th className="px-4 py-3">Nível</th>
                          <th className="px-4 py-3 text-right">Ação</th>
                        </tr>
                      </thead>
                      <tbody className={isDark ? 'text-slate-300' : 'text-slate-700'}>
                        {teamUsers.map(user => (
                          <tr key={user.id} className={`border-b transition-colors group ${
                            isDark ? 'border-white/5 hover:bg-white/5' : 'border-slate-100 hover:bg-slate-50'
                          }`}>
                            <td className="px-4 py-3">
                              <div className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{user.name || '-'}</div>
                              <div className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>{user.email}</div>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                user.role === 'ADMIN' || user.role === 'SUPERADMIN' 
                                  ? (isDark ? 'bg-[#D9AE55]/20 text-[#D9AE55]' : 'bg-indigo-100 text-indigo-700')
                                  : (isDark ? 'bg-white/10 text-slate-300' : 'bg-slate-200 text-slate-600')
                              }`}>
                                {user.role}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                  onClick={() => handleEditUser(user)}
                                  className={`p-1.5 rounded-lg transition-colors ${
                                    isDark ? 'text-slate-400 hover:text-white hover:bg-white/10' : 'text-slate-500 hover:text-indigo-600 hover:bg-slate-100'
                                  }`}
                                  title="Editar Usuário"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                {user.id !== session?.user?.id && user.role !== 'SUPERADMIN' && (
                                  <button 
                                    onClick={() => handleDeleteUser(user.id)}
                                    className={`p-1.5 rounded-lg transition-colors ${
                                      isDark ? 'text-slate-500 hover:text-red-400 hover:bg-red-500/10' : 'text-slate-400 hover:text-red-600 hover:bg-red-50'
                                    }`}
                                    title="Remover Usuário"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
