import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const users = [
    { username: "rade", password: "SEF@borjak25", level: Role.ADMIN, prodavnica: 1 },
    { username: "kancelarija", password: "papiraBEZ@25", level: Role.ADMIN },
    { username: "joksa", password: "theDEV@25", level: Role.ADMIN },
    { username: "borjak1", password: "borjak.10!25", level: Role.USER, prodavnica: 1 },
    { username: "borjak2", password: "borjak.10!25", level: Role.USER, prodavnica: 2 },
    { username: "borjak3", password: "borjak.10!25", level: Role.USER, prodavnica: 3 },
    { username: "borjak4", password: "borjak.10!25", level: Role.USER, prodavnica: 4 },
    { username: "borjak5", password: "borjak.10!25", level: Role.USER, prodavnica: 5 },
    { username: "borjak6", password: "borjak.10!25", level: Role.USER, prodavnica: 6 },
    { username: "borjak7", password: "borjak.10!25", level: Role.USER, prodavnica: 7 },
    { username: "borjak8", password: "borjak.10!25", level: Role.USER, prodavnica: 8 },
    { username: "borjak9", password: "borjak.10!25", level: Role.USER, prodavnica: 9 },
    { username: "borjak10", password: "borjak.10!25", level: Role.USER, prodavnica: 10 },
    { username: "borjak20", password: "borjak.10!25", level: Role.USER, prodavnica: 20 },
    { username: "borjak21", password: "borjak.10!25", level: Role.USER, prodavnica: 21 },
    { username: "borjak22", password: "borjak.10!25", level: Role.USER, prodavnica: 22 },
    { username: "borjak23", password: "borjak.10!25", level: Role.USER, prodavnica: 23 },
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
          level: user.level,
        },
      });
    } else {
      console.log(`Creating new user: ${user.username}`);
      await prisma.korisnici.create({
        data: {
          username: user.username,
          password: hashedPassword,
          active: true,
          level: user.level,
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
