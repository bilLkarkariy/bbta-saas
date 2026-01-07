import "dotenv/config";
import { db as prisma } from "../src/lib/db";

async function main() {
  const email = process.argv[2];

  if (!email) {
    console.log("Usage: npx tsx scripts/make-super-admin.ts <email>");
    console.log("\nAvailable users:");
    const users = await prisma.user.findMany({
      select: { email: true, name: true, superAdmin: true },
    });
    users.forEach((u) => {
      console.log(`  ${u.email} ${u.name ? `(${u.name})` : ""} ${u.superAdmin ? "[SUPER ADMIN]" : ""}`);
    });
    process.exit(1);
  }

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    console.error(`User not found: ${email}`);
    process.exit(1);
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { superAdmin: true },
  });

  console.log(`✅ ${email} is now a super admin!`);
}

main()
  .catch(console.error)
  .finally(() => process.exit(0));
