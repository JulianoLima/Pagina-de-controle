import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL ?? "juliano.lima@sebrae.com.br";
  const name = process.env.SEED_ADMIN_NAME ?? "Juliano Lima";
  const password = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe@123";

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.upsert({
    where: { email },
    update: { name, role: "ADMIN", active: true },
    create: { email, name, passwordHash, role: "ADMIN", active: true },
  });

  console.log(`Admin pronto: ${user.email} (senha inicial: ${password})`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
