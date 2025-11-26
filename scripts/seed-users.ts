import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const users = [
    { username: "rade", password: "SEF@borjak25" },
    { username: "kancelarija", password: "papiraBEZ@25" },
    { username: "joksa", password: "theDEV@25" },
  ];

  console.log("Seeding users...");

  for (const user of users) {
    const hashedPassword = await bcrypt.hash(user.password, 10);
    
    // Check if user exists
    const existingUser = await prisma.korisnici.findUnique({
      where: { username: user.username },
    });

    if (existingUser) {
      console.log(`Updating existing user: ${user.username}`);
      await prisma.korisnici.update({
        where: { username: user.username },
        data: {
          password: hashedPassword,
          active: true,
        },
      });
    } else {
      console.log(`Creating new user: ${user.username}`);
      await prisma.korisnici.create({
        data: {
          username: user.username,
          password: hashedPassword,
          active: true,
        },
      });
    }
  }

  console.log("Seeding completed.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
