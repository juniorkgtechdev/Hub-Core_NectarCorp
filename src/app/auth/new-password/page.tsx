"use client";

import { useState, Suspense } from "react";
import InteractiveBackground from "@/components/InteractiveBackground";
import { Lock, ArrowRight, Loader2, CheckCircle } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

function NewPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  if (!token) {
    return (
      <div className="text-center">
        <div className="w-16 h-16 bg-red-500/10 rounded-2xl mx-auto flex items-center justify-center mb-6 border border-red-500/20">
          <span className="text-red-500 text-3xl font-black">!</span>
        </div>
        <h1 className="text-2xl font-bold mb-2">Token Inválido</h1>
        <p className="text-slate-400 text-sm mb-8">
          O link que você acessou é inválido ou não possui um token de recuperação.
        </p>
        <Link href="/portal" className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors inline-flex items-center gap-2">
          Voltar para o Login <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="text-center">
        <div className="w-16 h-16 bg-green-500/10 rounded-2xl mx-auto flex items-center justify-center mb-6 border border-green-500/20">
          <CheckCircle className="text-green-500 w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Senha Definida!</h1>
        <p className="text-slate-400 text-sm mb-8">
          Sua senha foi atualizada com sucesso. Você já pode acessar a plataforma.
        </p>
        <Link href="/portal" className="px-6 py-3 bg-[#D9AE55]/10 border border-[#D9AE55]/30 text-[#D9AE55] rounded-xl hover:bg-[#D9AE55]/20 transition-colors inline-flex items-center gap-2">
          Ir para o Login <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || !confirmPassword) return;

    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    if (password.length < 6) {
      setError("A senha deve ter no mínimo 6 caracteres.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/new-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
      } else {
        setError(data.error || "Ocorreu um erro ao atualizar a senha.");
      }
    } catch (err) {
      setError("Falha de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-[#D9AE55]/10 rounded-2xl mx-auto flex items-center justify-center mb-6 border border-[#D9AE55]/20">
          <Lock className="text-[#D9AE55] w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Definir Nova Senha</h1>
        <p className="text-slate-400 text-sm">
          Crie uma nova senha segura para acessar a plataforma.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">
            Nova Senha
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-slate-500" />
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="block w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#D9AE55]/50 focus:border-[#D9AE55] transition-all"
              placeholder="********"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">
            Confirmar Senha
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-slate-500" />
            </div>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="block w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#D9AE55]/50 focus:border-[#D9AE55] transition-all"
              placeholder="********"
            />
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg text-center">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full relative inline-flex h-12 overflow-hidden rounded-xl p-[1px] focus:outline-none focus:ring-2 focus:ring-[#D9AE55] focus:ring-offset-2 focus:ring-offset-[#0a0a0a] group/btn disabled:opacity-70 disabled:cursor-not-allowed mt-4"
        >
          <span className="absolute inset-[-1000%] animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,transparent_0%,#D9AE55_50%,transparent_100%)]" />
          <span className="inline-flex h-full w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-black px-8 py-1 text-sm font-medium text-white backdrop-blur-3xl transition-colors group-hover/btn:bg-black/70">
            {loading ? <Loader2 className="w-5 h-5 animate-spin text-[#D9AE55]" /> : "Salvar Senha"}
          </span>
        </button>
      </form>
    </>
  );
}

export default function NewPasswordPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center relative overflow-hidden font-sans">
      <InteractiveBackground />
      
      <div className="w-full max-w-md p-8 relative z-10">
        <div className="bg-black/40 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl">
          <Suspense fallback={<div className="text-center text-slate-400 py-10"><Loader2 className="w-8 h-8 animate-spin mx-auto text-[#D9AE55]" /></div>}>
            <NewPasswordForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
