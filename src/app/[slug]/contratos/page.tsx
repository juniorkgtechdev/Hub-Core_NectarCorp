import { PrismaClient } from "@prisma/client";
import { notFound, redirect } from "next/navigation";
import DashboardClient from "./DashboardClient";

const prisma = new PrismaClient();

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  
  const tenant = await prisma.tenant.findUnique({
    where: { slug },
  });

  if (!tenant) {
    notFound();
  }

  if (!tenant.moduleContracts) {
    redirect(`/${slug}/dashboard`);
  }

  return <DashboardClient tenant={tenant} />;
}
