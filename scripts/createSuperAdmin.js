const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const email = 'ilsonktjunior@hotmail.com';
  const password = 'Kgtech@2026!';
  
  // Hash the password
  const passwordHash = await bcrypt.hash(password, 10);
  
  // Create or update the super admin user
  const user = await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash,
      role: 'SUPERADMIN'
    },
    create: {
      email,
      name: 'Ilson Junior',
      passwordHash,
      role: 'SUPERADMIN'
    }
  });

  console.log('✅ Super Admin criado com sucesso!');
  console.log('Email:', user.email);
  console.log('Role:', user.role);
}

main()
  .catch((e) => {
    console.error('❌ Erro ao criar Super Admin:');
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
