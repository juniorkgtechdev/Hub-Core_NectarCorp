"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Edit2, Shield, Plus, Trash2, Building, Users, LogIn } from "lucide-react";

type Tenant = { id: string; name: string; slug: string; logoUrl?: string | null; moduleContracts?: boolean };
type User = { id: string; name: string | null; email: string; role: string; tenantId: string | null; tenant?: Tenant | null };

export default function AdminPanelClient({
  initialTenants,
  initialUsers,
}: {
  initialTenants: Tenant[];
  initialUsers: User[];
}) {
  const router = useRouter();
  
  // Tenant Form
  const [editingTenantId, setEditingTenantId] = useState<string | null>(null);
  const [tenantName, setTenantName] = useState("");
  const [tenantSlug, setTenantSlug] = useState("");
  const [tenantLogo, setTenantLogo] = useState<File | null>(null);
  const [tenantModuleContracts, setTenantModuleContracts] = useState(true);
  const [isSubmittingTenant, setIsSubmittingTenant] = useState(false);

  // User Form
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userPassword, setUserPassword] = useState("");
  const [userRole, setUserRole] = useState("USER");
  const [userTenant, setUserTenant] = useState("");
  const [isSubmittingUser, setIsSubmittingUser] = useState(false);

  const [selectedFilterTenantId, setSelectedFilterTenantId] = useState<string | null>(null);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTenantName(val);
    setTenantSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''));
  };

  const handleCreateOrUpdateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantName || !tenantSlug) return;

    setIsSubmittingTenant(true);
    try {
      let logoUrl = undefined;

      if (tenantLogo) {
        const formData = new FormData();
        formData.append("file", tenantLogo);

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (uploadRes.ok) {
          const data = await uploadRes.json();
          logoUrl = data.url;
        } else {
          alert("Falha ao fazer upload da logomarca.");
          setIsSubmittingTenant(false);
          return;
        }
      }

      const method = editingTenantId ? "PUT" : "POST";
      const payload: any = { name: tenantName, slug: tenantSlug, moduleContracts: tenantModuleContracts };
      if (editingTenantId) payload.id = editingTenantId;
      if (logoUrl !== undefined) payload.logoUrl = logoUrl;

      const res = await fetch("/api/admin/tenant", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setEditingTenantId(null);
        setTenantName("");
        setTenantSlug("");
        setTenantLogo(null);
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || "Erro ao salvar empresa.");
      }
    } catch (error) {
      alert("Erro ao salvar empresa.");
    } finally {
      setIsSubmittingTenant(false);
    }
  };

  const handleEditTenant = (t: Tenant) => {
    setEditingTenantId(t.id);
    setTenantName(t.name);
    setTenantSlug(t.slug);
    setTenantLogo(null);
    setTenantModuleContracts(t.moduleContracts ?? true);
  };

  const cancelEditTenant = () => {
    setEditingTenantId(null);
    setTenantName("");
    setTenantSlug("");
    setTenantLogo(null);
    setTenantModuleContracts(true);
  };

  const handleCreateOrUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userEmail) return;

    setIsSubmittingUser(true);
    try {
      const url = "/api/admin/user";
      const method = editingUserId ? "PUT" : "POST";
      
      const payload: any = {
        name: userName,
        email: userEmail,
        role: userRole,
        tenantId: userTenant || null,
      };

      if (editingUserId) {
        payload.id = editingUserId;
      }
      
      if (userPassword) {
        payload.password = userPassword;
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setEditingUserId(null);
        setUserName("");
        setUserEmail("");
        setUserPassword("");
        setUserRole("USER");
        setUserTenant("");
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || "Erro ao salvar usuário.");
      }
    } catch (error) {
      alert("Erro ao salvar usuário.");
    } finally {
      setIsSubmittingUser(false);
    }
  };

  const handleEditUser = (u: User) => {
    setEditingUserId(u.id);
    setUserName(u.name || "");
    setUserEmail(u.email);
    setUserRole(u.role);
    setUserTenant(u.tenantId || "");
    setUserPassword("");
  };

  const cancelEdit = () => {
    setEditingUserId(null);
    setUserName("");
    setUserEmail("");
    setUserRole("USER");
    setUserTenant("");
    setUserPassword("");
  };

  const handleImpersonate = async (u: User) => {
    try {
      const res = await fetch("/api/admin/impersonate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: u.id }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Erro ao gerar token de acesso.");
        return;
      }

      const { impersonateToken } = await res.json();

      // Forçar o login via NextAuth Credentials com o token e redirecionar para a URL correta
      const callbackUrl = u.tenant?.slug ? `${window.location.origin}/${u.tenant.slug}/dashboard` : `${window.location.origin}/`;
      
      const resAuth = await signIn("credentials", {
        impersonateToken,
        redirect: false,
      });

      if (resAuth?.ok) {
        window.location.href = callbackUrl;
      } else {
        alert("Erro ao realizar login impersonate.");
      }

    } catch (error) {
      alert("Erro ao tentar acessar como usuário.");
    }
  };

  const filteredUsers = selectedFilterTenantId === "none" 
    ? initialUsers.filter(u => !u.tenantId)
    : selectedFilterTenantId 
      ? initialUsers.filter(u => u.tenantId === selectedFilterTenantId)
      : initialUsers;

  const adminUsers = filteredUsers.filter(u => u.role === 'ADMIN' || u.role === 'SUPERADMIN');
  const commonUsers = filteredUsers.filter(u => u.role === 'USER');

  const UserCard = ({ u }: { u: User }) => (
    <li key={u.id} className="p-4 rounded-xl border border-white/5 bg-white/5 flex flex-col space-y-1 group hover:bg-white/10 transition-colors">
      <div className="flex justify-between items-start gap-4">
        <span className="font-bold text-slate-200 truncate">{u.name || "Sem nome"}</span>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider
            ${u.role === 'SUPERADMIN' ? 'bg-[#D9AE55]/20 text-[#D9AE55] border border-[#D9AE55]/30' : 
              u.role === 'ADMIN' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 
              'bg-white/10 text-slate-400 border border-white/10'}`}>
            {u.role}
          </span>
          <button onClick={() => handleEditUser(u)} title="Editar Usuário" className="transition-opacity text-slate-400 hover:text-[#D9AE55] p-1 rounded-md hover:bg-white/10">
            <Edit2 className="w-4 h-4" />
          </button>
          <button onClick={() => handleImpersonate(u)} title="Acessar como (Impersonate)" className="transition-opacity text-slate-400 hover:text-green-400 p-1 rounded-md hover:bg-white/10">
            <LogIn className="w-4 h-4" />
          </button>
        </div>
      </div>
      <span className="text-sm text-slate-400">{u.email}</span>
      <div className="text-xs text-slate-500 mt-2 flex items-center gap-1.5">
        <Shield className="w-3.5 h-3.5" />
        {u.tenant ? u.tenant.name : "Sem vínculo"}
      </div>
    </li>
  );

  return (
    <div className="space-y-8 relative z-10">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Coluna 1: Formulários */}
        <div className="space-y-8">
        
        {/* Formulário de Empresa */}
        <div className="bg-[#0f0f11]/80 backdrop-blur-xl p-6 rounded-2xl shadow-2xl border border-white/10 relative">
          {editingTenantId && (
            <div className="absolute top-6 right-6">
              <button onClick={cancelEditTenant} className="text-xs text-slate-400 hover:text-white transition-colors">
                Cancelar
              </button>
            </div>
          )}
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Building className="w-5 h-5 text-[#D9AE55]" />
            {editingTenantId ? "Editar Empresa" : "Adicionar Empresa"}
          </h2>
          <form onSubmit={handleCreateOrUpdateTenant} className="space-y-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Nome da Empresa</label>
              <input
                type="text"
                required
                value={tenantName}
                onChange={handleNameChange}
                className="w-full rounded-xl bg-black/50 border border-white/10 text-white px-4 py-2 focus:border-[#D9AE55] outline-none transition-colors"
                placeholder="Ex: MedPrime Matriz"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Slug (URL)</label>
              <div className="flex items-center">
                <span className="text-sm text-slate-500 bg-white/5 border border-r-0 border-white/10 rounded-l-xl px-3 py-2">/</span>
                <input
                  type="text"
                  required
                  value={tenantSlug}
                  onChange={(e) => setTenantSlug(e.target.value)}
                  className="w-full rounded-r-xl bg-black/50 border border-white/10 text-white px-4 py-2 focus:border-[#D9AE55] outline-none transition-colors"
                  placeholder="medprimematriz"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Logomarca (PNG/JPG)</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setTenantLogo(e.target.files ? e.target.files[0] : null)}
                className="w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-medium file:bg-white/10 file:text-white hover:file:bg-white/20 transition-colors"
              />
            </div>
            
            <div className="flex items-center gap-3 bg-white/5 p-4 rounded-xl border border-white/10">
              <input
                type="checkbox"
                id="moduleContracts"
                checked={tenantModuleContracts}
                onChange={(e) => setTenantModuleContracts(e.target.checked)}
                className="w-5 h-5 accent-[#D9AE55] rounded border-white/20 bg-black/50 cursor-pointer"
              />
              <div>
                <label htmlFor="moduleContracts" className="block text-sm font-medium text-slate-200 cursor-pointer">
                  Módulo: Gerador de Contratos
                </label>
                <span className="text-xs text-slate-400">Habilita a criação de contratos em lote para esta empresa.</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmittingTenant}
              className="w-full bg-[#D9AE55]/10 hover:bg-[#D9AE55]/20 text-[#D9AE55] border border-[#D9AE55]/30 font-medium py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2"
            >
              {editingTenantId && !isSubmittingTenant && <Edit2 className="w-4 h-4" />}
              {isSubmittingTenant ? "Salvando..." : editingTenantId ? "Salvar Alterações" : "Criar Empresa"}
            </button>
          </form>
        </div>

        {/* Formulário de Usuário */}
        <div className="bg-[#0f0f11]/80 backdrop-blur-xl p-6 rounded-2xl shadow-2xl border border-white/10 relative">
          {editingUserId && (
            <div className="absolute top-6 right-6">
              <button onClick={cancelEdit} className="text-xs text-slate-400 hover:text-white transition-colors">
                Cancelar
              </button>
            </div>
          )}
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Users className="w-5 h-5 text-[#D9AE55]" />
            {editingUserId ? "Editar Usuário" : "Adicionar Usuário"}
          </h2>
          <form onSubmit={handleCreateOrUpdateUser} className="space-y-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Nome Completo</label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="w-full rounded-xl bg-black/50 border border-white/10 text-white px-4 py-2 focus:border-[#D9AE55] outline-none transition-colors"
                placeholder="Ex: João da Silva"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">E-mail</label>
              <input
                type="email"
                required
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                className="w-full rounded-xl bg-black/50 border border-white/10 text-white px-4 py-2 focus:border-[#D9AE55] outline-none transition-colors"
                placeholder="joao@exemplo.com"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">{editingUserId ? "Nova Senha (deixe em branco para não alterar)" : "Senha (Opcional - E-mail de convite será enviado)"}</label>
              <input
                type="password"
                required={false}
                value={userPassword}
                onChange={(e) => setUserPassword(e.target.value)}
                className="w-full rounded-xl bg-black/50 border border-white/10 text-white px-4 py-2 focus:border-[#D9AE55] outline-none transition-colors placeholder:text-slate-600"
                placeholder={editingUserId ? "********" : "Deixe em branco para auto-gerar"}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Nível de Acesso</label>
                <select
                  value={userRole}
                  onChange={(e) => setUserRole(e.target.value)}
                  className="w-full rounded-xl bg-black/50 border border-white/10 text-white px-4 py-2 focus:border-[#D9AE55] outline-none transition-colors [&>option]:bg-[#0f0f11]"
                >
                  <option value="USER">Usuário Comum</option>
                  <option value="ADMIN">Administrador</option>
                  <option value="SUPERADMIN">Super Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Vincular Empresa</label>
                <select
                  value={userTenant}
                  onChange={(e) => setUserTenant(e.target.value)}
                  className="w-full rounded-xl bg-black/50 border border-white/10 text-white px-4 py-2 focus:border-[#D9AE55] outline-none transition-colors [&>option]:bg-[#0f0f11]"
                >
                  <option value="">-- Nenhuma --</option>
                  {initialTenants.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <button
              type="submit"
              disabled={isSubmittingUser}
              className="w-full bg-[#D9AE55]/10 hover:bg-[#D9AE55]/20 text-[#D9AE55] border border-[#D9AE55]/30 font-medium py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2"
            >
              {editingUserId && !isSubmittingUser && <Edit2 className="w-4 h-4" />}
              {isSubmittingUser ? "Salvando..." : editingUserId ? "Salvar Alterações" : "Criar Usuário"}
            </button>
          </form>
        </div>

      </div>

      {/* Coluna 2: Listas */}
      <div className="space-y-8">
        
        {/* Lista de Empresas */}
        <div className="bg-[#0f0f11]/80 backdrop-blur-xl p-6 rounded-2xl shadow-2xl border border-white/10">
          <h2 className="text-xl font-bold text-white mb-6">Empresas Cadastradas</h2>
          {initialTenants.length === 0 ? (
            <p className="text-slate-500 text-sm">Nenhuma empresa encontrada.</p>
          ) : (
            <ul className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {initialTenants.map((t) => (
                <li key={t.id} className="flex justify-between items-center p-4 rounded-xl border border-white/5 bg-white/5 group hover:bg-white/10 transition-colors">
                  <div className="flex flex-col">
                    <span className="font-medium text-slate-200">{t.name}</span>
                    <div className="flex gap-2 mt-1">
                      {t.moduleContracts && <span className="text-[10px] bg-[#D9AE55]/20 text-[#D9AE55] border border-[#D9AE55]/30 px-1.5 py-0.5 rounded">Contratos</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-500 font-mono bg-black/50 px-2 py-1 rounded">{t.id.slice(-6)}</span>
                    <button onClick={() => handleEditTenant(t)} title="Editar Empresa" className="transition-opacity text-slate-400 hover:text-[#D9AE55] p-1 rounded-md hover:bg-white/10">
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      </div>

      {/* Lista de Usuários - Largura Total */}
      <div className="w-full">
        <div className="bg-[#0f0f11]/80 backdrop-blur-xl p-6 rounded-2xl shadow-2xl border border-white/10 w-full">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <h2 className="text-xl font-bold text-white">Usuários Cadastrados</h2>
            <select 
              value={selectedFilterTenantId || ""} 
              onChange={(e) => setSelectedFilterTenantId(e.target.value || null)}
              className="rounded-xl bg-black/50 border border-white/10 text-white px-3 py-1.5 focus:border-[#D9AE55] outline-none transition-colors text-sm [&>option]:bg-[#0f0f11]"
            >
              <option value="">Todas as Empresas</option>
              {initialTenants.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
              <option value="none">Sem vínculo</option>
            </select>
          </div>
          
          {filteredUsers.length === 0 ? (
            <p className="text-slate-500 text-sm">Nenhum usuário encontrado para o filtro atual.</p>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Administradores */}
              <div>
                <h3 className="text-xs font-semibold text-slate-400 mb-3 uppercase tracking-wider flex items-center gap-2">
                  <Shield className="w-4 h-4 text-indigo-400" />
                  Administradores ({adminUsers.length})
                </h3>
                {adminUsers.length === 0 ? (
                  <p className="text-slate-600 text-xs italic">Nenhum administrador.</p>
                ) : (
                  <ul className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {adminUsers.map((u) => <UserCard key={u.id} u={u} />)}
                  </ul>
                )}
              </div>

              {/* Usuários Comuns */}
              <div>
                <h3 className="text-xs font-semibold text-slate-400 mb-3 uppercase tracking-wider flex items-center gap-2">
                  <Users className="w-4 h-4 text-slate-400" />
                  Usuários Comuns ({commonUsers.length})
                </h3>
                {commonUsers.length === 0 ? (
                  <p className="text-slate-600 text-xs italic">Nenhum usuário comum.</p>
                ) : (
                  <ul className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {commonUsers.map((u) => <UserCard key={u.id} u={u} />)}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
