"use client";

import { useState } from "react";
import { LogOut, Settings, Sun, Moon, FileText, Lock } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import InteractiveBackground from "@/components/InteractiveBackground";
import { useRouter } from "next/navigation";

type Tenant = { id: string; name: string; slug: string; logoUrl: string | null; moduleContracts?: boolean };

export default function PortalClient({ tenant }: { tenant: Tenant }) {
  const { data: session } = useSession();
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
    <div className={`min-h-screen font-sans flex flex-col relative transition-colors duration-500 ${isDark ? 'bg-[#0a0a0a] text-white' : 'bg-slate-50 text-slate-800'}`}>
      {isDark && <InteractiveBackground colorful={false} staticMode={true} />}

      <nav className={`relative z-10 px-6 py-4 flex items-center justify-between transition-colors ${
        isDark ? 'bg-black/40 backdrop-blur-md border-b border-white/10' : 'bg-white border-b border-slate-200 shadow-sm'
      }`}>
        <div className="flex items-center gap-3">
          {tenant.logoUrl ? (
            <div className={`relative w-8 h-8 rounded-md overflow-hidden p-0.5 border flex items-center justify-center ${
              isDark ? 'bg-white/5 border-white/10' : 'bg-slate-100 border-slate-200'
            }`}>
              {/* @next/next/no-img-element */}
              <img src={tenant.logoUrl.startsWith('/uploads/') ? `/api${tenant.logoUrl}` : tenant.logoUrl} alt="Logo" className="w-full h-full object-contain" />
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
          
          {isSuperAdmin && (
            <Link href="/superadmin" className={`text-sm font-medium transition-colors flex items-center gap-1 ${
              isDark ? 'text-slate-300 hover:text-white' : 'text-slate-600 hover:text-indigo-600'
            }`}>
              <Settings className="w-4 h-4" /> Admin Global
            </Link>
          )}
          <button onClick={async () => {
            await signOut({ redirect: false });
            window.location.href = "/";
          }} className="text-sm font-medium text-red-500 hover:text-red-600 transition-colors flex items-center gap-1 ml-2 border-l pl-4 border-slate-200 dark:border-white/10">
            <LogOut className="w-4 h-4" /> Sair
          </button>
        </div>
      </nav>

      <main className="relative z-10 flex-1 p-8">
        <div className="max-w-6xl mx-auto space-y-8">
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
  );
}
