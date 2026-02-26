import { db } from "../src/lib/db";
import { addDays, format } from "date-fns";

async function createRealTestBooking() {
  console.log("🔍 Finding tenant...");

  const tenant = await db.tenant.findFirst({
    where: {
      whatsappNumber: { not: null },
    },
    select: {
      id: true,
      name: true,
      whatsappNumber: true,
    },
  });

  if (!tenant) {
    console.error("❌ No tenant found");
    process.exit(1);
  }

  console.log(`✅ Found tenant: ${tenant.name}`);
  console.log(`   WhatsApp FROM: ${tenant.whatsappNumber}`);

  // Tomorrow's date
  const tomorrow = format(addDays(new Date(), 1), "yyyy-MM-dd");

  const realPhone = process.argv[2] || process.env.REAL_TEST_PHONE;
  if (!realPhone) {
    throw new Error("Missing target phone. Use: npx tsx scripts/create-real-test-booking.ts <E164_PHONE> or set REAL_TEST_PHONE");
  }

  console.log(`\n📅 Creating booking for: ${tomorrow}`);
  console.log(`📱 Sending reminder TO: ${realPhone}`);

  const booking = await db.booking.create({
    data: {
      tenantId: tenant.id,
      customerPhone: realPhone, // REAL NUMBER
      customerName: "Test Client (REAL)",
      service: "Pose Gel Test",
      date: tomorrow,
      time: "14:30",
      status: "confirmed",
      reminderSent: false,
      notes: "Real test booking - verify WhatsApp received on " + realPhone,
    },
  });

  console.log(`\n✅ REAL test booking created!`);
  console.log(`   ID: ${booking.id}`);
  console.log(`   Customer: ${booking.customerName}`);
  console.log(`   Phone: ${booking.customerPhone} ⬅️  CHECK THIS NUMBER`);
  console.log(`   Date: ${booking.date} at ${booking.time}`);
  console.log(`\n📨 Next: Trigger reminder and CHECK WHATSAPP on ${realPhone}`);

  await db.$disconnect();
}

createRealTestBooking().catch((error) => {
  console.error("❌ Error:", error);
  process.exit(1);
});
