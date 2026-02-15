import dotenv from "dotenv";
dotenv.config();

import bcrypt from "bcrypt";
import prisma from "./lib/prisma";

/**
 * Seed script: creates the default admin user if it doesn't exist.
 * Run with: npm run seed
 */
async function main() {
  const existing = await prisma.user.findUnique({
    where: { username: "admin" },
  });

  if (existing) {
    console.log("[Seed] Admin user already exists, skipping.");
    return;
  }

  const passwordHash = await bcrypt.hash("admin123", 12);

  await prisma.user.create({
    data: {
      username: "admin",
      passwordHash,
      role: "ADMIN",
    },
  });

  console.log("[Seed] Created default admin user:");
  console.log("  Username: admin");
  console.log("  Password: admin123");
  console.log("  ⚠️  CHANGE THIS PASSWORD IMMEDIATELY!");
}

main()
  .catch((e) => {
    console.error("[Seed] Error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
