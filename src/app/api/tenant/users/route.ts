import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { generatePasswordResetToken } from '@/lib/tokens';
import { sendPasswordResetEmail } from '@/lib/mail';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const role = session.user.role;
    // Apenas ADMIN ou SUPERADMIN podem listar a equipe
    if (role !== 'ADMIN' && role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Permissão negada' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const querySlug = searchParams.get('slug') || searchParams.get('tenantSlug');
    const queryTenantId = searchParams.get('tenantId');
    const sessionSlug = (session.user as any).tenantSlug;
    const sessionTenantId = (session.user as any).tenantId;

    let tenant = null;

    if (queryTenantId) {
      tenant = await prisma.tenant.findUnique({ where: { id: queryTenantId } });
    } else if (querySlug) {
      tenant = await prisma.tenant.findUnique({ where: { slug: querySlug } });
    } else if (sessionTenantId) {
      tenant = await prisma.tenant.findUnique({ where: { id: sessionTenantId } });
    } else if (sessionSlug) {
      tenant = await prisma.tenant.findUnique({ where: { slug: sessionSlug } });
    }

    if (!tenant) {
      return NextResponse.json({ error: 'Empresa não encontrada' }, { status: 404 });
    }

    // Se for ADMIN comum, garantir que está acessando seu próprio tenant
    if (role === 'ADMIN' && sessionTenantId && sessionTenantId !== tenant.id) {
      return NextResponse.json({ error: 'Permissão negada para esta empresa' }, { status: 403 });
    }

    // Listar usuários do tenant
    const users = await prisma.user.findMany({
      where: { tenantId: tenant.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Erro ao buscar usuários' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const role = session.user.role;
    if (role !== 'ADMIN' && role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Permissão negada' }, { status: 403 });
    }

    const body = await req.json();
    const { name, email, password, newRole, tenantId: bodyTenantId, tenantSlug: bodySlug } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email é obrigatório' }, { status: 400 });
    }

    const sessionSlug = (session.user as any).tenantSlug;
    const sessionTenantId = (session.user as any).tenantId;

    let tenant = null;
    if (bodyTenantId) {
      tenant = await prisma.tenant.findUnique({ where: { id: bodyTenantId } });
    } else if (bodySlug) {
      tenant = await prisma.tenant.findUnique({ where: { slug: bodySlug } });
    } else if (sessionTenantId) {
      tenant = await prisma.tenant.findUnique({ where: { id: sessionTenantId } });
    } else if (sessionSlug) {
      tenant = await prisma.tenant.findUnique({ where: { slug: sessionSlug } });
    }

    if (!tenant) {
      return NextResponse.json({ error: 'Empresa não encontrada' }, { status: 404 });
    }

    if (role === 'ADMIN' && sessionTenantId && sessionTenantId !== tenant.id) {
      return NextResponse.json({ error: 'Permissão negada para esta empresa' }, { status: 403 });
    }

    // ADMINs só podem criar 'USER' ou 'ADMIN'
    const allowedRoles = ['USER', 'ADMIN'];
    const finalRole = allowedRoles.includes(newRole) ? newRole : 'USER';

    // Verifica se usuário já existe
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json({ error: 'Email já cadastrado' }, { status: 400 });
    }

    // Gera uma senha aleatória caso não seja fornecida (o usuário vai definir depois via e-mail)
    const finalPassword = password || uuidv4();
    const passwordHash = await bcrypt.hash(finalPassword, 10);

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: finalRole,
        tenantId: tenant.id
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      }
    });

    // Se o usuário foi criado sem senha (ou mesmo com, por segurança), enviamos o e-mail para ele confirmar
    if (!password) {
      const origin = req.headers.get("origin") || req.headers.get("referer")?.replace(/\/$/, '') || process.env.NEXT_PUBLIC_APP_URL || undefined;
      const resetToken = await generatePasswordResetToken(email);
      sendPasswordResetEmail(email, resetToken.token, origin).catch(console.error);
    }

    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({ error: 'Erro ao criar usuário' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const role = session.user.role;
    if (role !== 'ADMIN' && role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Permissão negada' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('id');

    if (!userId) {
      return NextResponse.json({ error: 'ID do usuário é obrigatório' }, { status: 400 });
    }

    // Prevenir auto-exclusão
    if (userId === session.user.id) {
      return NextResponse.json({ error: 'Não é possível excluir o próprio usuário' }, { status: 400 });
    }

    const sessionTenantId = (session.user as any).tenantId;

    const userToDelete = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!userToDelete) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    if (role === 'ADMIN' && sessionTenantId && userToDelete.tenantId !== sessionTenantId) {
      return NextResponse.json({ error: 'Usuário não encontrado nesta empresa' }, { status: 403 });
    }

    // Excluir usuário
    await prisma.user.delete({
      where: { id: userId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'Erro ao excluir usuário' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const role = session.user.role;
    if (role !== 'ADMIN' && role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Permissão negada' }, { status: 403 });
    }

    const { id, name, email, password, newRole } = await req.json();

    if (!id || !email) {
      return NextResponse.json({ error: 'ID e Email são obrigatórios' }, { status: 400 });
    }

    const sessionTenantId = (session.user as any).tenantId;

    const userToEdit = await prisma.user.findUnique({
      where: { id }
    });

    if (!userToEdit) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    if (role === 'ADMIN' && sessionTenantId && userToEdit.tenantId !== sessionTenantId) {
      return NextResponse.json({ error: 'Usuário não encontrado nesta empresa' }, { status: 403 });
    }

    const allowedRoles = ['USER', 'ADMIN'];
    const finalRole = allowedRoles.includes(newRole) ? newRole : undefined;

    const updateData: any = { name, email };
    
    if (finalRole) {
      updateData.role = finalRole;
    }

    if (password && password.trim() !== '') {
      updateData.passwordHash = await bcrypt.hash(password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      }
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Erro ao atualizar usuário' }, { status: 500 });
  }
}
