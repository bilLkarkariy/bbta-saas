import { db } from "../src/lib/db";
import { addDays, format } from "date-fns";

async function createTestBooking() {
  console.log("🔍 Finding tenant...");

  // Find first tenant with WhatsApp configured
  const tenant = await db.tenant.findFirst({
    where: {
      whatsappNumber: { not: null },
    },
    select: {
      id: true,
      name: true,
      whatsappNumber: true,
      ownerPhone: true,
    },
  });

  if (!tenant) {
    console.error("❌ No tenant found with WhatsApp number configured");
    process.exit(1);
  }

  console.log(`✅ Found tenant: ${tenant.name} (${tenant.id})`);
  console.log(`   WhatsApp: ${tenant.whatsappNumber}`);
  console.log(`   Owner: ${tenant.ownerPhone || "Not configured"}`);

  // Tomorrow's date
  const tomorrow = format(addDays(new Date(), 1), "yyyy-MM-dd");
  console.log(`\n📅 Creating booking for: ${tomorrow}`);

  // Create test booking
  const booking = await db.booking.create({
    data: {
      tenantId: tenant.id,
      customerPhone: tenant.ownerPhone || "+33612345678", // Use owner phone or dummy
      customerName: "Test Client (Reminder Demo)",
      service: "Test - Pose Gel",
      date: tomorrow,
      time: "14:30",
      status: "confirmed",
      reminderSent: false,
      notes: "Test booking created for reminder verification",
    },
  });

  console.log(`\n✅ Test booking created successfully!`);
  console.log(`   ID: ${booking.id}`);
  console.log(`   Customer: ${booking.customerName}`);
  console.log(`   Phone: ${booking.customerPhone}`);
  console.log(`   Service: ${booking.service}`);
  console.log(`   Date: ${booking.date} at ${booking.time}`);
  console.log(`   Status: ${booking.status}`);
  console.log(`   Reminder sent: ${booking.reminderSent}`);

  console.log(`\n📝 Next steps:`);
  console.log(`   1. Trigger reminder manually: curl the /api/cron/booking-reminders endpoint`);
  console.log(`   2. Check WhatsApp on ${booking.customerPhone}`);
  console.log(`   3. Verify booking.reminderSent is set to true`);

  await db.$disconnect();
}

createTestBooking().catch((error) => {
  console.error("❌ Error:", error);
  process.exit(1);
});
