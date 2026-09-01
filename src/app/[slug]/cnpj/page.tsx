import { PrismaClient } from "@prisma/client";
import { notFound, redirect } from "next/navigation";
import CnpjClient from "./CnpjClient";

const prisma = new PrismaClient();

export default async function CnpjPage({
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

  return <CnpjClient tenant={tenant} />;
}
