import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Server, ShieldCheck, Zap } from "lucide-react";
import InteractiveBackground from "@/components/InteractiveBackground";

export default function Home() {
  return (
    <div className="min-h-screen bg-transparent text-slate-50 font-sans selection:bg-indigo-500/30 overflow-hidden relative">
      <InteractiveBackground />

      {/* Navbar */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 overflow-hidden rounded-full border border-white/10">
            <Image src="/nectar-logo.jpeg" alt="Nectar Logo" fill sizes="40px" className="object-cover" />
          </div>
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
            Néctar Corp
          </span>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/portal" className="hidden md:block text-sm font-medium text-slate-300 hover:text-white transition-colors">
            Portal do Cliente
          </Link>
          <Link href="/superadmin/login" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">
            Admin
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 max-w-7xl mx-auto px-8 pt-24 pb-32 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium mb-8">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
          </span>
          Hub Core de Soluções
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-tight">
          Néctar Corp <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">Hub Core</span>
        </h1>
        
        <p className="max-w-2xl text-lg md:text-xl text-slate-400 mb-10">
          Central unificada de gestão corporativa. Conecte, controle e desenvolva todas as soluções, filiais e recursos da sua empresa em um único ecossistema integrado.
        </p>
        
        <Link 
          href="/portal" 
          className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 bg-white text-slate-900 rounded-full font-semibold text-lg overflow-hidden transition-transform hover:scale-105 shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)]"
        >
          <span className="relative z-10 flex items-center gap-2">
            Acessar Ecossistema <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </span>
        </Link>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-32 w-full max-w-5xl text-left">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
            <div className="w-12 h-12 bg-indigo-500/20 rounded-xl flex items-center justify-center mb-4 border border-indigo-500/30">
              <Server className="text-indigo-400 w-6 h-6" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Ecossistema Integrado</h3>
            <p className="text-slate-400">Conecte e gerencie todas as aplicações e sistemas da Néctar Corp a partir de um único hub centralizado.</p>
          </div>
          
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
            <div className="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center mb-4 border border-cyan-500/30">
              <ShieldCheck className="text-cyan-400 w-6 h-6" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Gestão Multi-Tenant</h3>
            <p className="text-slate-400">Isolamento total de dados entre diferentes empresas com controle absoluto de acessos e permissões.</p>
          </div>
          
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
            <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mb-4 border border-purple-500/30">
              <Zap className="text-purple-400 w-6 h-6" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Alta Performance</h3>
            <p className="text-slate-400">Infraestrutura escalável preparada para suportar o desenvolvimento e crescimento contínuo de novas soluções.</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 py-8 text-center text-slate-500 text-sm">
        <p>© {new Date().getFullYear()} Néctar Corp. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}
