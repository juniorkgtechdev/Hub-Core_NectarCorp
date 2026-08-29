import { PrismaClient } from '@prisma/client';
import nodemailer from 'nodemailer';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';

const envFile = fs.readFileSync('.env', 'utf-8');
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)="?(.*?)"?$/);
  if (match) {
    process.env[match[1]] = match[2];
  }
});

const prisma = new PrismaClient();

async function main() {
  console.log("Testando DB...");
  try {
    const email = "test@example.com";
    const token = uuidv4();
    const expires = new Date(new Date().getTime() + 3600 * 1000);

    const passwordResetToken = await prisma.passwordResetToken.create({
      data: {
        email,
        token,
        expires,
      }
    });
    console.log("Token gerado no DB com sucesso:", passwordResetToken.id);
  } catch (error) {
    console.error("Erro no DB:", error);
  }

  console.log("\nTestando SMTP...");
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const info = await transporter.sendMail({
      from: `"Equipe Global Nectar" <${process.env.SMTP_USER}>`,
      to: "ilsonktjunior@hotmail.com",
      subject: "Teste SMTP Direto",
      text: "Este é um teste do servidor SMTP do sistema Nectar Corp.",
    });
    console.log("E-mail enviado com sucesso. ID da mensagem:", info.messageId);
    console.log("Resposta do servidor SMTP:", info.response);
  } catch (error) {
    console.error("Erro no SMTP:", error);
  }
}

main().finally(async () => {
  await prisma.$disconnect();
});
