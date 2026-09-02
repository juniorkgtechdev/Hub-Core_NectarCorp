"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, FileText, Search, Shield } from "lucide-react";

type Tenant = { id: string; name: string; slug: string; logoUrl: string | null };

export default function Sidebar({ tenant, isDark, isAdmin }: { tenant: Tenant; isDark: boolean; isAdmin?: boolean }) {
  const pathname = usePathname();

  const navItems = [
    { name: "Dashboard", href: `/${tenant.slug}/dashboard`, icon: LayoutDashboard },
    { name: "Gerador de Contratos", href: `/${tenant.slug}/contratos`, icon: FileText },
    { name: "Consultar CNPJ", href: `/${tenant.slug}/cnpj`, icon: Search },
  ];

  if (isAdmin) {
    navItems.push({ name: "Gerenciar Equipe", href: `/${tenant.slug}/equipe`, icon: Shield });
  }

  return (
    <aside className={`relative z-20 w-64 border-r flex flex-col transition-all duration-300 ${isDark ? 'bg-[#0a0a0a]/80 backdrop-blur-xl border-white/10' : 'bg-white border-slate-200 shadow-sm shrink-0'}`}>
      <div className="p-6 flex items-center gap-3">
        {tenant.logoUrl ? (
          <div className={`relative w-10 h-10 rounded-xl overflow-hidden p-0.5 border flex items-center justify-center ${isDark ? 'bg-white/5 border-white/10' : 'bg-slate-100 border-slate-200'}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={tenant.logoUrl.startsWith('/uploads/') ? `/api${tenant.logoUrl}` : tenant.logoUrl} alt="Logo" className="w-full h-full object-contain" />
          </div>
        ) : (
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${isDark ? 'bg-[#D9AE55]/20 text-[#D9AE55] border border-[#D9AE55]/30' : 'bg-indigo-100 text-indigo-600 border border-indigo-200'}`}>
            {tenant.name.charAt(0).toUpperCase()}
          </div>
        )}
        <div>
          <h2 className={`font-bold text-lg tracking-tight ${isDark ? 'text-white' : 'text-slate-800'}`}>
            {tenant.name}
          </h2>
        </div>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (pathname?.startsWith(item.href) && item.href !== `/${tenant.slug}`);
          
          if (isActive) {
            return (
              <div key={item.name} className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium ${isDark ? 'bg-[#D9AE55]/10 text-[#D9AE55]' : 'bg-indigo-50 text-indigo-700'}`}>
                <Icon className="w-5 h-5" />
                <span>{item.name}</span>
              </div>
            );
          }

          return (
            <Link key={item.name} href={item.href} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${isDark ? 'text-slate-400 hover:text-white hover:bg-white/5' : 'text-slate-500 hover:text-indigo-600 hover:bg-slate-100'}`}>
              <Icon className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span className="font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
