"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Tenant = { id: string; name: string };
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
  const [tenantName, setTenantName] = useState("");
  const [isSubmittingTenant, setIsSubmittingTenant] = useState(false);

  // User Form
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userPassword, setUserPassword] = useState("");
  const [userRole, setUserRole] = useState("USER");
  const [userTenant, setUserTenant] = useState("");
  const [isSubmittingUser, setIsSubmittingUser] = useState(false);

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantName) return;

    setIsSubmittingTenant(true);
    try {
      const res = await fetch("/api/admin/tenant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: tenantName }),
      });

      if (res.ok) {
        setTenantName("");
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || "Erro ao criar empresa.");
      }
    } catch (error) {
      alert("Erro ao criar empresa.");
    } finally {
      setIsSubmittingTenant(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userEmail || !userPassword) return;

    setIsSubmittingUser(true);
    try {
      const res = await fetch("/api/admin/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: userName,
          email: userEmail,
          password: userPassword,
          role: userRole,
          tenantId: userTenant || null,
        }),
      });

      if (res.ok) {
        setUserName("");
        setUserEmail("");
        setUserPassword("");
        setUserRole("USER");
        setUserTenant("");
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || "Erro ao criar usuário.");
      }
    } catch (error) {
      alert("Erro ao criar usuário.");
    } finally {
      setIsSubmittingUser(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Coluna 1: Formulários */}
      <div className="space-y-8">
        
        {/* Formulário de Empresa */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Adicionar Clínica / Empresa</h2>
          <form onSubmit={handleCreateTenant} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Empresa</label>
              <input
                type="text"
                required
                value={tenantName}
                onChange={(e) => setTenantName(e.target.value)}
                className="w-full rounded-xl border-gray-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-4 py-2 border"
                placeholder="Ex: MedPrime Matriz"
              />
            </div>
            <button
              type="submit"
              disabled={isSubmittingTenant}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-xl transition-all"
            >
              {isSubmittingTenant ? "Criando..." : "Criar Empresa"}
            </button>
          </form>
        </div>

        {/* Formulário de Usuário */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Adicionar Usuário</h2>
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="w-full rounded-xl border-gray-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-4 py-2 border"
                placeholder="Ex: João da Silva"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
              <input
                type="email"
                required
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                className="w-full rounded-xl border-gray-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-4 py-2 border"
                placeholder="joao@exemplo.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Senha Inicial</label>
              <input
                type="password"
                required
                value={userPassword}
                onChange={(e) => setUserPassword(e.target.value)}
                className="w-full rounded-xl border-gray-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-4 py-2 border"
                placeholder="********"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nível de Acesso</label>
                <select
                  value={userRole}
                  onChange={(e) => setUserRole(e.target.value)}
                  className="w-full rounded-xl border-gray-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-4 py-2 border bg-white"
                >
                  <option value="USER">Usuário Comum</option>
                  <option value="ADMIN">Administrador</option>
                  <option value="SUPERADMIN">Super Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vincular Empresa</label>
                <select
                  value={userTenant}
                  onChange={(e) => setUserTenant(e.target.value)}
                  className="w-full rounded-xl border-gray-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-4 py-2 border bg-white"
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
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-xl transition-all"
            >
              {isSubmittingUser ? "Criando..." : "Criar Usuário"}
            </button>
          </form>
        </div>

      </div>

      {/* Coluna 2: Listas */}
      <div className="space-y-8">
        
        {/* Lista de Empresas */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Empresas Cadastradas</h2>
          {initialTenants.length === 0 ? (
            <p className="text-gray-500 text-sm">Nenhuma empresa encontrada.</p>
          ) : (
            <ul className="space-y-3">
              {initialTenants.map((t) => (
                <li key={t.id} className="flex justify-between items-center p-3 rounded-lg border border-gray-100 bg-gray-50">
                  <span className="font-medium text-gray-800">{t.name}</span>
                  <span className="text-xs text-gray-500 font-mono">{t.id.slice(-6)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Lista de Usuários */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Usuários Cadastrados</h2>
          {initialUsers.length === 0 ? (
            <p className="text-gray-500 text-sm">Nenhum usuário encontrado.</p>
          ) : (
            <ul className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
              {initialUsers.map((u) => (
                <li key={u.id} className="p-4 rounded-lg border border-gray-100 bg-gray-50 flex flex-col space-y-1">
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-gray-800">{u.name || "Sem nome"}</span>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider
                      ${u.role === 'SUPERADMIN' ? 'bg-purple-100 text-purple-700' : 
                        u.role === 'ADMIN' ? 'bg-blue-100 text-blue-700' : 
                        'bg-gray-200 text-gray-700'}`}>
                      {u.role}
                    </span>
                  </div>
                  <span className="text-sm text-gray-600">{u.email}</span>
                  <div className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                    {u.tenant ? u.tenant.name : "Sem vínculo"}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

      </div>
    </div>
  );
}
