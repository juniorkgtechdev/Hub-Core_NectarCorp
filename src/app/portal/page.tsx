"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Lock, Mail, ArrowRight, ShieldCheck, Server, Zap, CheckCircle2 } from "lucide-react";
import InteractiveBackground from "@/components/InteractiveBackground";
import pkg from "../../../../package.json";

export default function PortalLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (res?.error) {
        setError(res.error);
        setLoading(false);
      } else {
        const sessionRes = await fetch("/api/auth/session");
        const sessionData = await sessionRes.json();
        
        if (sessionData?.user?.tenantSlug) {
           router.push(`/${sessionData.user.tenantSlug}/dashboard`);
        } else if (sessionData?.user?.role === 'SUPERADMIN') {
           router.push('/superadmin');
        } else {
           setError("Nenhuma empresa associada encontrada.");
           setLoading(false);
        }
      }
    } catch (err) {
      setError("Ocorreu um erro inesperado.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex w-full relative bg-[#0a0a0a]">
      {/* Fundo Interativo Néctar cobrindo TUDO */}
      <InteractiveBackground />

      {/* LEFT SIDE - Branding & Info */}
      <div className="hidden lg:flex w-[55%] relative flex-col justify-between p-12 overflow-hidden text-white z-10">
        <div className="relative z-10">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-16">
            <div className="relative w-8 h-8 rounded-full overflow-hidden border border-white/20">
              <Image src="/nectar-logo.jpeg" alt="Nectar Logo" fill sizes="32px" className="object-cover" />
            </div>
            <span className="text-xl font-bold tracking-tight">Néctar Corp</span>
          </div>

          {/* Headline */}
          <div className="max-w-xl mt-12">
            <h1 className="text-5xl font-extrabold tracking-tight mb-6 leading-[1.1]">
              Hub central de <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
                soluções corporativas.
              </span>
            </h1>
            <p className="text-slate-300 text-lg leading-relaxed">
              O core das suas automações. Gestão de contratos, documentos, 
              auditoria e inteligência artificial em uma única plataforma isolada.
            </p>
          </div>
        </div>

        {/* Feature Cards Bottom */}
        <div className="relative z-10 grid grid-cols-3 gap-4 mt-12">
          <div className="bg-black/20 border border-white/10 p-5 rounded-2xl backdrop-blur-md">
            <Server className="w-6 h-6 text-indigo-400 mb-3" />
            <h3 className="font-semibold text-sm mb-1 text-white">Ambiente Isolado</h3>
            <p className="text-xs text-slate-400 leading-relaxed">Arquitetura multi-tenant garantindo que seus dados fiquem separados.</p>
          </div>
          
          <div className="bg-black/20 border border-white/10 p-5 rounded-2xl backdrop-blur-md">
            <Zap className="w-6 h-6 text-cyan-400 mb-3" />
            <h3 className="font-semibold text-sm mb-1 text-white">Extração com IA</h3>
            <p className="text-xs text-slate-400 leading-relaxed">Automação e leitura inteligente de dados através de PDFs e imagens nativamente.</p>
          </div>
          
          <div className="bg-black/20 border border-white/10 p-5 rounded-2xl backdrop-blur-md">
            <ShieldCheck className="w-6 h-6 text-purple-400 mb-3" />
            <h3 className="font-semibold text-sm mb-1 text-white">Segurança Total</h3>
            <p className="text-xs text-slate-400 leading-relaxed">Dados protegidos com criptografia e validação rígida de acessos cruzados.</p>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE - Login Form */}
      <div className="w-full lg:w-[45%] relative z-10 flex flex-col justify-center items-center p-8 sm:p-12">
        <div className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 p-8 sm:p-10 rounded-3xl shadow-2xl">
          
          <div className="w-12 h-12 bg-indigo-500/20 border border-indigo-500/30 rounded-2xl flex items-center justify-center mb-6">
            <Lock className="w-6 h-6 text-indigo-400" />
          </div>
          
          <h2 className="text-3xl font-bold text-white mb-2">Bem-vindo!</h2>
          <p className="text-slate-400 text-sm mb-8">
            Acesse o hub de soluções da sua empresa com o login vinculado.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Email corporativo
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-500" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-black/30 border border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-white placeholder:text-slate-500 transition-all outline-none"
                  placeholder="seu.email@empresa.com.br"
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Senha
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-500" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-black/30 border border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-white placeholder:text-slate-500 transition-all outline-none"
                  placeholder="Digite sua senha"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer group">
                <div className="relative flex items-center justify-center w-4 h-4 border border-white/30 rounded focus-within:ring-2 focus-within:ring-indigo-500 group-hover:border-indigo-400 transition-colors bg-black/20">
                  <input type="checkbox" className="peer sr-only" />
                  <div className="opacity-0 peer-checked:opacity-100 peer-checked:bg-indigo-500 absolute inset-0 rounded flex items-center justify-center transition-all">
                    <CheckCircle2 className="w-3 h-3 text-white" />
                  </div>
                </div>
                <span className="text-sm text-slate-400 group-hover:text-white transition-colors">Permanecer conectado</span>
              </label>
              <Link href="/auth/reset" className="text-sm font-medium text-indigo-400 hover:text-indigo-300 transition-colors">
                Esqueceu sua senha?
              </Link>
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 text-red-400 rounded-lg text-sm border border-red-500/20 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="relative w-full inline-flex h-12 overflow-hidden rounded-xl p-[1px] focus:outline-none focus:ring-2 focus:ring-[#D9AE55] focus:ring-offset-2 focus:ring-offset-[#0a0a0a] group disabled:opacity-70 disabled:cursor-not-allowed"
            >
              <span className="absolute inset-[-1000%] animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,transparent_0%,#D9AE55_50%,transparent_100%)]" />
              <span className="inline-flex h-full w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-black px-3 py-1 text-sm font-medium text-white backdrop-blur-3xl transition-colors group-hover:bg-black/70">
                {loading ? "Autenticando..." : "Entrar no Hub"}
                {!loading && <ArrowRight className="w-4 h-4 text-[#D9AE55]" />}
              </span>
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" />
              <span>Ambiente seguro</span>
            </div>
            <span>v{pkg.version}</span>
          </div>

        </div>
      </div>
    </div>
  );
}
