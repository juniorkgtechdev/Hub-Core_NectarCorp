"use client";

import { useState } from "react";
import InteractiveBackground from "@/components/InteractiveBackground";
import Link from "next/link";
import { Mail, ArrowLeft, Loader2 } from "lucide-react";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch("/api/auth/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage(data.message || "Se o e-mail existir, um link de recuperação foi enviado.");
      } else {
        setError(data.error || "Ocorreu um erro ao processar a solicitação.");
      }
    } catch (err) {
      setError("Falha de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center relative overflow-hidden font-sans">
      <InteractiveBackground />
      
      <div className="w-full max-w-md p-8 relative z-10">
        <div className="bg-black/40 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-[#D9AE55]/10 rounded-2xl mx-auto flex items-center justify-center mb-6 border border-[#D9AE55]/20">
              <span className="text-[#D9AE55] text-3xl font-black">N</span>
            </div>
            <h1 className="text-2xl font-bold mb-2">Recuperar Senha</h1>
            <p className="text-slate-400 text-sm">
              {message ? "Quase lá!" : "Digite o e-mail cadastrado e enviaremos um link para você redefinir sua senha."}
            </p>
          </div>

          {message ? (
            <div className="text-center space-y-6">
              <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
                <p className="text-green-400 text-sm">{message}</p>
                <p className="text-green-400/80 text-xs mt-2">Verifique também sua caixa de SPAM.</p>
              </div>
              <Link href="/portal" className="w-full inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#D9AE55] text-black font-semibold hover:bg-[#c49a45] transition-colors">
                <ArrowLeft className="w-4 h-4" />
                Voltar para o Login
              </Link>
            </div>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">
                    E-mail
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-slate-500" />
                    </div>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#D9AE55]/50 focus:border-[#D9AE55] transition-all"
                      placeholder="seu@email.com"
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
                  className="w-full relative inline-flex h-12 overflow-hidden rounded-xl p-[1px] focus:outline-none focus:ring-2 focus:ring-[#D9AE55] focus:ring-offset-2 focus:ring-offset-[#0a0a0a] group/btn disabled:opacity-70 disabled:cursor-not-allowed mt-2"
                >
                  <span className="absolute inset-[-1000%] animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,transparent_0%,#D9AE55_50%,transparent_100%)]" />
                  <span className="inline-flex h-full w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-black px-8 py-1 text-sm font-medium text-white backdrop-blur-3xl transition-colors group-hover/btn:bg-black/70">
                    {loading ? <Loader2 className="w-5 h-5 animate-spin text-[#D9AE55]" /> : "Enviar Link de Recuperação"}
                  </span>
                </button>
              </form>

              <div className="mt-8 text-center">
                <Link href="/portal" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors">
                  <ArrowLeft className="w-4 h-4" />
                  Voltar para o Login
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
