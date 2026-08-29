import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
  const email = 'ilsonktjunior@hotmail.com';
  
  // Create dummy user
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (!existingUser) {
    await prisma.user.create({
      data: {
        email,
        name: 'Test User',
        passwordHash: 'dummy',
        role: 'USER'
      }
    });
    console.log("Created test user");
  }

  const res = await fetch('https://specifics-separated-matching-kitty.trycloudflare.com/api/auth/reset', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });
  const text = await res.text();
  console.log("STATUS:", res.status);
  console.log("RESPONSE:", text);
}
run();
