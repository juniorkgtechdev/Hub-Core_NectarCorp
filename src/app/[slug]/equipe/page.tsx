import { PrismaClient } from "@prisma/client";
import { notFound } from "next/navigation";
import EquipeClient from "./EquipeClient";

const prisma = new PrismaClient();

export default async function EquipePage({
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

  return <EquipeClient tenant={tenant} />;
}
