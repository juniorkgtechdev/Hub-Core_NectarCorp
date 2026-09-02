"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, FileText, Search, Shield, ChevronLeft, ChevronRight, Sun, Moon, Settings, LogOut, Menu } from "lucide-react";
import { signOut } from "next-auth/react";

type Tenant = { id: string; name: string; slug: string; logoUrl: string | null };

export default function Sidebar({
  tenant,
  isDark,
  isAdmin,
  setTheme,
  isSuperAdmin
}: {
  tenant: Tenant;
  isDark: boolean;
  isAdmin?: boolean;
  setTheme: (theme: 'dark' | 'light') => void;
  isSuperAdmin?: boolean;
}) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const appVersion = "v1.4.4";

  const navItems = [
    { name: "Dashboard", href: `/${tenant.slug}/dashboard`, icon: LayoutDashboard },
    { name: "Gerador de Contratos", href: `/${tenant.slug}/contratos`, icon: FileText },
    { name: "Consultar CNPJ", href: `/${tenant.slug}/cnpj`, icon: Search },
  ];

  if (isAdmin) {
    navItems.push({ name: "Gerenciar Equipe", href: `/${tenant.slug}/equipe`, icon: Shield });
  }

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    window.location.href = "/";
  };

  return (
    <>
      {/* Mobile Toggle Button */}
      <button 
        onClick={() => setIsMobileOpen(true)}
        className={`md:hidden fixed top-4 left-4 z-40 p-2 rounded-lg border shadow-sm ${
          isDark ? 'bg-black/80 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-800'
        }`}
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside className={`fixed md:relative inset-y-0 left-0 z-50 flex flex-col transition-all duration-300 ease-in-out border-r shrink-0
        ${isDark ? 'bg-[#0a0a0a] md:bg-[#0a0a0a]/80 backdrop-blur-xl border-white/10' : 'bg-white border-slate-200 shadow-sm'}
        ${isCollapsed ? 'w-20' : 'w-64'}
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Toggle Collapse Button (Desktop) */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`hidden md:flex absolute -right-3 top-8 items-center justify-center w-6 h-6 rounded-full border shadow-sm transition-colors z-50 ${
            isDark ? 'bg-[#111] border-white/10 text-slate-400 hover:text-white hover:bg-white/10' : 'bg-white border-slate-200 text-slate-500 hover:text-indigo-600 hover:bg-slate-50'
          }`}
        >
          {isCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>

        {/* Logo / Tenant Info */}
        <div className={`p-6 flex items-center shrink-0 ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
          {tenant.logoUrl ? (
            <div className={`relative w-10 h-10 rounded-xl overflow-hidden p-0.5 border flex items-center justify-center shrink-0 ${isDark ? 'bg-white/5 border-white/10' : 'bg-slate-100 border-slate-200'}`}>
              <img src={tenant.logoUrl.startsWith('/uploads/') ? `/api${tenant.logoUrl}` : tenant.logoUrl} alt="Logo" className="w-full h-full object-contain" />
            </div>
          ) : (
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold shrink-0 ${isDark ? 'bg-[#D9AE55]/20 text-[#D9AE55] border border-[#D9AE55]/30' : 'bg-indigo-100 text-indigo-600 border border-indigo-200'}`}>
              {tenant.name.charAt(0).toUpperCase()}
            </div>
          )}
          {!isCollapsed && (
            <div className="overflow-hidden whitespace-nowrap">
              <h2 className={`font-bold text-lg tracking-tight truncate ${isDark ? 'text-white' : 'text-slate-800'}`}>
                {tenant.name}
              </h2>
            </div>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto overflow-x-hidden">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (pathname?.startsWith(item.href) && item.href !== `/${tenant.slug}`);
            
            return (
              <Link
                key={item.name} 
                href={item.href}
                title={isCollapsed ? item.name : undefined}
                className={`flex items-center rounded-xl transition-all group ${isCollapsed ? 'justify-center px-0 py-3' : 'gap-3 px-4 py-3'}
                  ${isActive 
                    ? (isDark ? 'bg-[#D9AE55]/10 text-[#D9AE55] font-medium' : 'bg-indigo-50 text-indigo-700 font-medium')
                    : (isDark ? 'text-slate-400 hover:text-white hover:bg-white/5' : 'text-slate-500 hover:text-indigo-600 hover:bg-slate-100')
                  }
                `}
              >
                <Icon className={`w-5 h-5 shrink-0 ${!isActive && 'group-hover:scale-110 transition-transform'}`} />
                {!isCollapsed && <span className="font-medium truncate">{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Footer Controls (Theme, Admin, Logout, Version) */}
        <div className={`p-4 border-t flex flex-col gap-2 shrink-0 ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
          <button 
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            title="Alternar Tema"
            className={`flex items-center rounded-xl transition-all group ${isCollapsed ? 'justify-center px-0 py-3' : 'gap-3 px-4 py-3'}
              ${isDark ? 'text-slate-400 hover:text-white hover:bg-white/10' : 'text-slate-500 hover:text-indigo-600 hover:bg-slate-100'}
            `}
          >
            {isDark ? <Sun className="w-5 h-5 shrink-0 group-hover:scale-110 transition-transform" /> : <Moon className="w-5 h-5 shrink-0 group-hover:scale-110 transition-transform" />}
            {!isCollapsed && <span className="font-medium truncate">Modo {isDark ? 'Claro' : 'Escuro'}</span>}
          </button>

          {isSuperAdmin && (
            <Link 
              href="/superadmin"
              title="Admin Global"
              className={`flex items-center rounded-xl transition-all group ${isCollapsed ? 'justify-center px-0 py-3' : 'gap-3 px-4 py-3'}
                ${isDark ? 'text-slate-400 hover:text-white hover:bg-white/10' : 'text-slate-500 hover:text-indigo-600 hover:bg-slate-100'}
              `}
            >
              <Settings className="w-5 h-5 shrink-0 group-hover:scale-110 transition-transform" />
              {!isCollapsed && <span className="font-medium truncate">Admin Global</span>}
            </Link>
          )}

          <button 
            onClick={handleSignOut}
            title="Sair"
            className={`flex items-center rounded-xl transition-all group ${isCollapsed ? 'justify-center px-0 py-3' : 'gap-3 px-4 py-3'}
              ${isDark ? 'text-red-400 hover:text-red-300 hover:bg-red-500/10' : 'text-red-500 hover:text-red-600 hover:bg-red-50'}
            `}
          >
            <LogOut className="w-5 h-5 shrink-0 group-hover:scale-110 transition-transform" />
            {!isCollapsed && <span className="font-medium truncate">Sair</span>}
          </button>

          <div className={`mt-2 flex justify-center items-center h-4 ${isCollapsed ? 'opacity-50' : ''}`}>
            <span className={`text-[10px] font-mono font-medium tracking-wider uppercase ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
              {isCollapsed ? appVersion.replace('v', '') : appVersion}
            </span>
          </div>
        </div>
      </aside>
    </>
  );
}
