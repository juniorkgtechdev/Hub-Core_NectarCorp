import { PrismaClient } from '@prisma/client';
import nodemailer from 'nodemailer';
import fs from 'fs';

const envFile = fs.readFileSync('.env', 'utf-8');
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)="?(.*?)"?$/);
  if (match) {
    process.env[match[1]] = match[2];
  }
});

const prisma = new PrismaClient();

async function run() {
  const email = 'gfsantos2303@outlook.com';

  console.log(`Verificando se o usuário ${email} existe no banco de dados...`);
  const user = await prisma.user.findUnique({ where: { email } });
  
  if (!user) {
    console.log("❌ O USUÁRIO NÃO EXISTE NO BANCO DE DADOS! É por isso que ele não recebe o e-mail.");
  } else {
    console.log("✅ O usuário EXISTE no banco de dados.");
  }

  console.log("\nEnviando um e-mail de teste direto para o Outlook...");
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  try {
    const info = await transporter.sendMail({
      from: `"Equipe Nectar It Solutions" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Teste SMTP para Outlook",
      text: "Se você recebeu este e-mail, o SMTP está conseguindo enviar para a Microsoft.",
    });
    console.log("✅ E-mail enviado com sucesso. ID:", info.messageId);
    console.log("   Resposta SMTP:", info.response);
  } catch (error) {
    console.error("❌ Falha ao enviar para o Outlook:", error);
  }
}

run().finally(() => prisma.$disconnect());
