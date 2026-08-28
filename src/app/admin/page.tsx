import { PrismaClient } from "@prisma/client";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import AdminPanelClient from "./AdminPanelClient";

const prisma = new PrismaClient();

export default async function AdminPage() {
  const session = await auth();

  // Redirect if not logged in
  if (!session) {
    redirect("/login");
  }

  // Se você quiser restringir por Role:
  // Se 'role' estiver disponível na sessão, verifique:
  // if (session.user.role !== 'SUPERADMIN' && session.user.role !== 'ADMIN') {
  //   redirect("/dashboard");
  // }

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
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans p-6 md:p-12">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
              Painel de Administração
            </h1>
            <p className="text-gray-500 mt-1">
              Gerencie as clínicas/empresas e seus usuários.
            </p>
          </div>
          <a
            href="/dashboard"
            className="mt-4 md:mt-0 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
          >
            ← Voltar para o Dashboard
          </a>
        </header>

        <AdminPanelClient initialTenants={tenants} initialUsers={safeUsers} />
      </div>
    </div>
  );
}
