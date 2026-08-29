import { PrismaClient } from "@prisma/client";
import { notFound } from "next/navigation";
import TenantLoginForm from "./TenantLoginForm";

const prisma = new PrismaClient();

export default async function TenantLoginPage({
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

  return <TenantLoginForm tenant={tenant} />;
}
