"use client";

import { useState } from "react";
import { LogOut, Settings, Sun, Moon, FileText, Lock, Building } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import InteractiveBackground from "@/components/InteractiveBackground";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { useRouter } from "next/navigation";

type Tenant = { id: string; name: string; slug: string; logoUrl: string | null; moduleContracts?: boolean };

export default function PortalClient({ tenant }: { tenant: Tenant }) {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "SUPERADMIN" || session?.user?.role === "ADMIN";
  const isSuperAdmin = session?.user?.role === "SUPERADMIN";
  
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const isDark = theme === 'dark';
  const router = useRouter();

  const handleAccessModule = (href: string, isEnabled: boolean) => {
    if (isEnabled) {
      router.push(href);
    }
  };

  return (
    <div className={`flex h-screen overflow-hidden font-sans relative transition-colors duration-500 ${isDark ? 'bg-[#0a0a0a] text-white' : 'bg-slate-50 text-slate-800'}`}>
      {isDark && <InteractiveBackground colorful={false} staticMode={true} />}

      <Sidebar tenant={tenant} isDark={isDark} isAdmin={isAdmin} />

      <div className="flex-1 flex flex-col relative z-10 overflow-hidden">
        <Header isDark={isDark} setTheme={setTheme} isSuperAdmin={isSuperAdmin} />

        <main className="flex-1 p-8 flex flex-col overflow-y-auto">
          <div className="max-w-6xl mx-auto space-y-8 w-full">
          <header className="mb-10">
            <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>Portal de Recursos</h1>
            <p className={`mt-2 text-lg ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Selecione o módulo que deseja acessar.</p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Module Card: Contratos */}
            <div 
              onClick={() => handleAccessModule(`/${tenant.slug}/contratos`, tenant.moduleContracts ?? true)}
              className={`relative overflow-hidden rounded-2xl border p-6 transition-all duration-300 ${
                (tenant.moduleContracts ?? true)
                  ? `cursor-pointer hover:-translate-y-1 hover:shadow-xl ${isDark ? 'bg-white/5 border-white/10 hover:border-[#D9AE55]/50 hover:bg-white/10' : 'bg-white border-slate-200 hover:border-indigo-500 hover:shadow-indigo-500/10'}`
                  : `cursor-not-allowed opacity-60 ${isDark ? 'bg-black/50 border-white/5' : 'bg-slate-100 border-slate-200'}`
              }`}
            >
              {!(tenant.moduleContracts ?? true) && (
                <div className="absolute top-4 right-4 text-slate-500 flex flex-col items-end">
                  <Lock className="w-5 h-5 mb-1" />
                  <span className="text-[10px] font-medium uppercase tracking-wider">Bloqueado</span>
                </div>
              )}
              
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 ${
                (tenant.moduleContracts ?? true)
                  ? (isDark ? 'bg-[#D9AE55]/20 text-[#D9AE55]' : 'bg-indigo-100 text-indigo-600')
                  : (isDark ? 'bg-white/5 text-slate-500' : 'bg-slate-200 text-slate-500')
              }`}>
                <FileText className="w-6 h-6" />
              </div>
              
              <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-800'}`}>Gerador de Contratos</h3>
              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Gere contratos e boletins em lote de forma automatizada a partir de PDFs extraídos.
              </p>
            </div>

            {/* Module Card: Consulta CNPJ */}
            <div 
              onClick={() => handleAccessModule(`/${tenant.slug}/cnpj`, true)}
              className={`relative overflow-hidden rounded-2xl border p-6 transition-all duration-300 cursor-pointer hover:-translate-y-1 hover:shadow-xl ${isDark ? 'bg-white/5 border-white/10 hover:border-purple-500/50 hover:bg-white/10' : 'bg-white border-slate-200 hover:border-purple-500 hover:shadow-purple-500/10'}`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 ${
                isDark ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-100 text-purple-600'
              }`}>
                <Building className="w-6 h-6" />
              </div>
              
              <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-800'}`}>Consulta CNPJ</h3>
              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Consulte a situação cadastral e opção pelo Simples Nacional de múltiplos CNPJs em lote.
              </p>
            </div>

            {/* Placeholder for future modules */}
            <div className={`relative overflow-hidden rounded-2xl border p-6 flex flex-col items-center justify-center text-center ${
              isDark ? 'bg-black/20 border-white/5 border-dashed' : 'bg-slate-50 border-slate-200 border-dashed'
            }`}>
              <div className="w-12 h-12 rounded-full border-2 border-dashed border-slate-400/30 flex items-center justify-center mb-4 text-slate-400/50">
                <span className="text-2xl font-light">+</span>
              </div>
              <h3 className="text-sm font-semibold text-slate-500">Novos Módulos em Breve</h3>
            </div>

          </div>
        </div>
      </main>
    </div>
  </div>
);
}
