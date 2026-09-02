"use client";

import { useState, useEffect } from "react";
import { Loader2, Shield, Plus, Edit2, Trash2 } from "lucide-react";
import { useSession } from "next-auth/react";
import InteractiveBackground from "@/components/InteractiveBackground";
import Sidebar from "@/components/Sidebar";
import { useRouter } from "next/navigation";

type Tenant = { id: string; name: string; slug: string; logoUrl: string | null };
type User = { id: string; name: string | null; email: string; role: string; createdAt: string };

export default function EquipeClient({ tenant }: { tenant: Tenant }) {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "SUPERADMIN" || session?.user?.role === "ADMIN";
  const isSuperAdmin = session?.user?.role === "SUPERADMIN";
  const router = useRouter();
  
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const isDark = theme === 'dark';

  const [teamUsers, setTeamUsers] = useState<User[]>([]);
  const [loadingTeam, setLoadingTeam] = useState(true);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [newUser, setNewUser] = useState({ name: "", email: "", password: "", role: "USER" });
  const [teamError, setTeamError] = useState<string | null>(null);

  // Redireciona se não for admin
  useEffect(() => {
    if (session && !isAdmin) {
      router.push(`/${tenant.slug}/dashboard`);
    }
  }, [session, isAdmin, router, tenant.slug]);

  const fetchTeam = async () => {
    setLoadingTeam(true);
    try {
      const res = await fetch(`/api/tenant/users?_t=${Date.now()}`, { cache: 'no-store' });
      if (res.ok) setTeamUsers(await res.json());
    } catch (e) {
      console.error(e);
    } finally { 
      setLoadingTeam(false); 
    }
  };

  useEffect(() => { 
    if (isAdmin) fetchTeam(); 
  }, [isAdmin]);

  const handleCreateOrUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.email) return;
    setLoadingTeam(true); 
    setTeamError(null);
    try {
      const method = editingUserId ? "PUT" : "POST";
      const payload: any = { ...newUser, newRole: newUser.role };
      if (editingUserId) payload.id = editingUserId;
      const res = await fetch("/api/tenant/users", { 
        method, 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify(payload) 
      });
      if (!res.ok) throw new Error((await res.json()).error || "Erro ao salvar usuário");
      
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
    setNewUser({ name: u.name || "", email: u.email, role: u.role, password: "" }); 
  };
  
  const cancelEdit = () => { 
    setEditingUserId(null); 
    setNewUser({ name: "", email: "", password: "", role: "USER" }); 
    setTeamError(null); 
  };
  
  const handleDeleteUser = async (id: string) => {
    if (!confirm("Remover usuário?")) return;
    setLoadingTeam(true);
    try { 
      await fetch(`/api/tenant/users?id=${id}`, { method: "DELETE" }); 
      await fetchTeam(); 
    } catch (e) {
      console.error(e);
    } finally { 
      setLoadingTeam(false); 
    }
  };

  if (!session || !isAdmin) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">Carregando...</div>;
  }

  return (
    <div className={`flex h-screen overflow-hidden font-sans relative transition-colors duration-500 ${isDark ? 'bg-[#0a0a0a] text-white' : 'bg-slate-50 text-slate-800'}`}>
      {isDark && <InteractiveBackground colorful={false} staticMode={true} />}
      
      <Sidebar tenant={tenant} isDark={isDark} isAdmin={isAdmin} setTheme={setTheme} isSuperAdmin={isSuperAdmin} />

      <div className="flex-1 flex flex-col relative z-10 overflow-hidden">
        <main className="flex-1 p-4 md:p-8 flex flex-col overflow-y-auto pt-16 md:pt-8">
          <div className="max-w-7xl mx-auto space-y-8 w-full flex-1">
            <header className="mb-10">
              <h1 className={`text-3xl font-bold flex items-center gap-3 ${isDark ? 'text-white' : 'text-slate-800'}`}>
                <Shield className={`w-8 h-8 ${isDark ? 'text-[#D9AE55]' : 'text-indigo-600'}`} />
                Gerenciar Equipe
              </h1>
              <p className={`mt-2 text-lg ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Gerencie os acessos e permissões da equipe.
              </p>
            </header>

            <div className={`border rounded-2xl w-full shadow-lg overflow-hidden flex flex-col lg:flex-row gap-8 p-6 transition-colors relative ${
              isDark ? 'bg-[#0f0f11] border-white/10' : 'bg-white border-slate-200'
            }`}>
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
                
                <form onSubmit={handleCreateOrUpdateUser} className="space-y-4" autoComplete="off">
                  {/* Honeypot para navegadores / Password managers não preencherem os campos abaixo */}
                  <div style={{ display: 'none' }} aria-hidden="true">
                    <input type="text" name="fake_username" autoComplete="username" />
                    <input type="email" name="fake_email" autoComplete="email" />
                    <input type="password" name="fake_password" autoComplete="new-password" />
                  </div>
                  
                  <div>
                    <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Nome</label>
                    <input 
                      type="text" required value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})}
                      className={`w-full rounded-lg px-3 py-2 text-sm outline-none border transition-colors ${
                        isDark 
                          ? 'bg-black/50 border-white/10 text-white focus:border-[#D9AE55]' 
                          : 'bg-white border-slate-300 text-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'
                      }`}
                      autoComplete="new-name"
                    />
                  </div>
                  <div>
                    <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Email</label>
                    <input 
                      type="email" required value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})}
                      className={`w-full rounded-lg px-3 py-2 text-sm outline-none border transition-colors ${
                        isDark 
                          ? 'bg-black/50 border-white/10 text-white focus:border-[#D9AE55]' 
                          : 'bg-white border-slate-300 text-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'
                      }`}
                      autoComplete="new-email"
                      name="random-email-field"
                    />
                  </div>
                  <div>
                    <label className={`block text-xs mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      {editingUserId ? "Nova Senha (opcional)" : "Senha (Opcional - E-mail convite será enviado)"}
                    </label>
                    <input 
                      type="password" required={false} value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})}
                      placeholder={editingUserId ? "Deixe em branco para não alterar" : "Deixe em branco para auto-gerar"}
                      className={`w-full rounded-lg px-3 py-2 text-sm outline-none border transition-colors ${
                        isDark 
                          ? 'bg-black/50 border-white/10 text-white focus:border-[#D9AE55] placeholder:text-slate-600' 
                          : 'bg-white border-slate-300 text-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 placeholder:text-slate-400'
                      }`}
                      autoComplete="new-password"
                      name="random-password-field"
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

              {/* List Section */}
              <div className="w-full lg:w-2/3 flex flex-col">
                <h3 className={`font-semibold mb-4 ${isDark ? 'text-white' : 'text-slate-800'}`}>Usuários Ativos</h3>
                <div className={`flex-1 rounded-xl border overflow-hidden ${
                  isDark ? 'bg-black/30 border-white/10' : 'bg-slate-50 border-slate-200'
                }`}>
                  {loadingTeam && teamUsers.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 text-sm">Carregando usuários...</div>
                  ) : teamUsers.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 text-sm">Nenhum usuário cadastrado.</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead className={`text-xs uppercase border-b ${
                          isDark ? 'bg-black/40 text-slate-400 border-white/10' : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}>
                          <tr>
                            <th className="px-4 py-3">Nome / Email</th>
                            <th className="px-4 py-3">Permissão</th>
                            <th className="px-4 py-3">Data</th>
                            <th className="px-4 py-3 text-right">Ações</th>
                          </tr>
                        </thead>
                        <tbody className={isDark ? 'text-slate-300' : 'text-slate-700'}>
                          {teamUsers.map(u => (
                            <tr key={u.id} className={`border-b transition-colors ${
                              isDark ? 'border-white/5 hover:bg-white/5' : 'border-slate-100 hover:bg-slate-50'
                            }`}>
                              <td className="px-4 py-3 font-medium">
                                <div>{u.name || "-"}</div>
                                <div className={`text-xs font-normal ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>{u.email}</div>
                              </td>
                              <td className="px-4 py-3">
                                <span className={`px-2 py-1 rounded-md text-[10px] font-bold ${
                                  u.role === 'ADMIN' 
                                    ? (isDark ? 'bg-[#D9AE55]/20 text-[#D9AE55]' : 'bg-indigo-100 text-indigo-700') 
                                    : (isDark ? 'bg-white/10 text-slate-300' : 'bg-slate-200 text-slate-600')
                                }`}>
                                  {u.role}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-xs">{new Date(u.createdAt).toLocaleDateString('pt-BR')}</td>
                              <td className="px-4 py-3 text-right">
                                <button 
                                  onClick={() => handleEditUser(u)} 
                                  className={`p-1.5 rounded-lg mr-2 transition-colors ${
                                    isDark ? 'hover:bg-white/10 text-slate-400' : 'hover:bg-slate-200 text-slate-500'
                                  }`}
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => handleDeleteUser(u.id)} 
                                  className={`p-1.5 rounded-lg transition-colors ${
                                    isDark ? 'hover:bg-red-500/20 text-red-400' : 'hover:bg-red-100 text-red-600'
                                  }`}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
          </div>
        </main>
      </div>
    </div>
  );
}
