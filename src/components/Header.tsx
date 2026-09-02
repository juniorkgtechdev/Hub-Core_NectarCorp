"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { Sun, Moon, Settings, LogOut } from "lucide-react";

export default function Header({ isDark, setTheme, isSuperAdmin }: { isDark: boolean; setTheme: (theme: 'dark' | 'light') => void; isSuperAdmin?: boolean }) {
  return (
    <nav className={`relative z-10 px-6 py-4 flex items-center justify-end transition-colors ${isDark ? 'bg-black/40 backdrop-blur-md border-b border-white/10' : 'bg-white border-b border-slate-200 shadow-sm shrink-0'}`}>
      <div className="flex items-center gap-4">
        <button onClick={() => setTheme(isDark ? 'light' : 'dark')} className={`p-2 rounded-lg transition-colors ${isDark ? 'text-slate-400 hover:text-white hover:bg-white/10' : 'text-slate-500 hover:text-indigo-600 hover:bg-slate-100'}`} title="Alternar Tema">
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
        {isSuperAdmin && (
          <Link href="/superadmin" className={`text-sm font-medium transition-colors flex items-center gap-1 ${isDark ? 'text-slate-300 hover:text-white' : 'text-slate-600 hover:text-indigo-600'}`}>
            <Settings className="w-4 h-4" /> Admin Global
          </Link>
        )}
        <button onClick={async () => { await signOut({ redirect: false }); window.location.href = "/"; }} className="text-sm font-medium text-red-500 hover:text-red-600 transition-colors flex items-center gap-1 ml-2 border-l pl-4 border-slate-200 dark:border-white/10">
          <LogOut className="w-4 h-4" /> Sair
        </button>
      </div>
    </nav>
  );
}
