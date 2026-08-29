import nodemailer from 'nodemailer';

// Cria o transportador de e-mail genérico (pode ser configurado no .env)
export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com', // Ex: smtp.hostinger.com
  port: parseInt(process.env.SMTP_PORT || '587'), // Ex: 465 ou 587
  secure: process.env.SMTP_SECURE === 'true', // true para 465, false para outras portas
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendPasswordResetEmail = async (email: string, token: string, appUrl?: string) => {
  const domain = appUrl || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const resetLink = `${domain}/auth/new-password?token=${token}`;

  const mailOptions = {
    from: `"Equipe Nectar It Solutions" <${process.env.SMTP_USER}>`,
    to: email,
    subject: "Redefinição de Senha / Acesso ao Sistema",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; padding: 20px; border-radius: 10px;">
        <h2 style="color: #333;">Olá!</h2>
        <p style="color: #555; font-size: 16px;">Você solicitou a criação ou redefinição de senha para sua conta na Global Nectar.</p>
        <p style="color: #555; font-size: 16px;">Clique no botão abaixo para definir sua senha segura:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" style="background-color: #D9AE55; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">Definir Minha Senha</a>
        </div>
        <p style="color: #777; font-size: 14px;">Se você não solicitou este e-mail, pode ignorá-lo com segurança.</p>
        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;" />
        <p style="color: #aaa; font-size: 12px; text-align: center;">Este é um e-mail automático, por favor não responda.</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`E-mail de recuperação enviado para ${email}`);
  } catch (error) {
    console.error("Erro ao enviar e-mail de recuperação:", error);
    throw error;
    // Em ambiente de desenvolvimento (localhost) e sem SMTP, apenas mostramos o link no console
    if (domain.includes('localhost')) {
      console.log('----------------------------------------------------')
      console.log(`[DEV MODE] Link de recuperação: ${resetLink}`)
      console.log('----------------------------------------------------')
    }
  }
};
