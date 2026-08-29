import { PrismaClient } from "@prisma/client";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import AdminPanelClient from "./AdminPanelClient";
import InteractiveBackground from "@/components/InteractiveBackground";
import { LogOut } from "lucide-react";
import Link from "next/link";

const prisma = new PrismaClient();

export default async function AdminPage() {
  const session = await auth();

  // Redirect if not logged in
  if (!session) {
    redirect("/login");
  }

  // Se 'role' estiver disponível na sessão, verifique:
  if (session.user.role !== 'SUPERADMIN') {
    redirect("/");
  }
  const tenants = await prisma.tenant.findMany({
    orderBy: { createdAt: "desc" },
  });

  const users = await prisma.user.findMany({
    include: { tenant: true },
    orderBy: { createdAt: "desc" },
  });

  // Remove hashes
  const safeUsers = users.map((u) => {
    const { passwordHash, ...rest } = u;
    return rest;
  });

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans flex flex-col relative transition-colors duration-500">
      <InteractiveBackground colorful={false} staticMode={true} />
      
      <nav className="relative z-10 px-6 py-4 flex items-center justify-between bg-black/40 backdrop-blur-md border-b border-white/10">
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold text-white">Hub Global Nectar</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
            Voltar para a Aplicação
          </Link>
        </div>
      </nav>

      <div className="relative z-10 flex-1 p-6 md:p-12">
        <div className="max-w-6xl mx-auto space-y-8">
          <header className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white/5 backdrop-blur-lg p-6 rounded-2xl shadow-sm border border-white/10">
            <div>
              <h1 className="text-3xl font-bold text-white">
                Painel de Administração
              </h1>
              <p className="text-slate-400 mt-1">
                Gerencie as clínicas/empresas e seus usuários.
              </p>
            </div>
          </header>

          <AdminPanelClient initialTenants={tenants} initialUsers={safeUsers} />
        </div>
      </div>
    </div>
  );
}
