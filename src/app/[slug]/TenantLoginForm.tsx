"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import Image from "next/image";

type Tenant = { id: string; name: string; slug: string; logoUrl: string | null };

export default function TenantLoginForm({ tenant }: { tenant: Tenant }) {
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
      // In auth.ts we will check if the user belongs to this tenant by passing tenantSlug
      const res = await signIn("credentials", {
        redirect: false,
        email,
        password,
        tenantSlug: tenant.slug, // Pass the slug to credentials authorization
      });

      if (res?.error) {
        setError(res.error === "CredentialsSignin" ? "E-mail ou senha inválidos." : res.error);
      } else {
        router.push(`/${tenant.slug}/dashboard`);
        router.refresh();
      }
    } catch (error) {
      setError("Ocorreu um erro ao tentar fazer login.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
        <div className="text-center mb-8 flex flex-col items-center">
          {tenant.logoUrl ? (
            <div className="relative w-32 h-32 mb-4">
              <Image src={tenant.logoUrl} alt={`Logo ${tenant.name}`} fill className="object-contain" />
            </div>
          ) : (
             <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-3xl mb-4">
              {tenant.name.charAt(0).toUpperCase()}
            </div>
          )}
          <h1 className="text-3xl font-bold text-slate-800">{tenant.name}</h1>
          <p className="text-slate-500 mt-2">Acesso ao sistema de contratos</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 border border-red-200 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              E-mail
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2.5 bg-white border border-slate-300 text-slate-900 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
              placeholder="seu@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Senha
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2.5 bg-white border border-slate-300 text-slate-900 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center"
          >
            {loading ? <Loader2 className="animate-spin w-5 h-5" /> : "Entrar no Sistema"}
          </button>
        </form>
      </div>
    </main>
  );
}
