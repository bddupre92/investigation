import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import bcrypt from "bcryptjs"
import "dotenv/config"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log("🌱 Seeding database...")

  const passwordHash = await bcrypt.hash("Admin1234!", 10)

  // Admin user
  const admin = await prisma.user.upsert({
    where: { email: "admin@investigationiq.com" },
    update: {},
    create: {
      email: "admin@investigationiq.com",
      name: "Admin User",
      passwordHash,
      role: "ADMIN",
      department: "Quality Assurance",
    },
  })

  // Investigator
  const investigator = await prisma.user.upsert({
    where: { email: "investigator@investigationiq.com" },
    update: {},
    create: {
      email: "investigator@investigationiq.com",
      name: "Jane Investigator",
      passwordHash: await bcrypt.hash("Invest123!", 10),
      role: "INVESTIGATOR",
      department: "Manufacturing",
    },
  })

  // Reviewer
  await prisma.user.upsert({
    where: { email: "reviewer@investigationiq.com" },
    update: {},
    create: {
      email: "reviewer@investigationiq.com",
      name: "Bob Reviewer",
      passwordHash: await bcrypt.hash("Review123!", 10),
      role: "REVIEWER",
      department: "Quality Control",
    },
  })

  console.log("✅ Seed complete!")
  console.log("")
  console.log("📋 Demo credentials:")
  console.log("  Admin:       admin@investigationiq.com / Admin1234!")
  console.log("  Investigator: investigator@investigationiq.com / Invest123!")
  console.log("  Reviewer:    reviewer@investigationiq.com / Review123!")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
