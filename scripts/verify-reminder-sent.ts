import { db } from "../src/lib/db";

async function verifyReminderSent() {
  console.log("🔍 Checking test booking...\n");

  const booking = await db.booking.findFirst({
    where: {
      customerName: "Test Client (Reminder Demo)",
      date: "2026-01-10",
    },
  });

  if (!booking) {
    console.error("❌ Test booking not found");
    process.exit(1);
  }

  console.log(`Booking ID: ${booking.id}`);
  console.log(`Customer: ${booking.customerName}`);
  console.log(`Phone: ${booking.customerPhone}`);
  console.log(`Date: ${booking.date} at ${booking.time}`);
  console.log(`Service: ${booking.service}`);
  console.log(`Status: ${booking.status}`);
  console.log(`\n📨 Reminder Status:`);
  console.log(`   Sent: ${booking.reminderSent ? "✅ YES" : "❌ NO"}`);
  console.log(`   Sent At: ${booking.reminderSentAt ? booking.reminderSentAt.toISOString() : "N/A"}`);

  if (booking.reminderSent && booking.reminderSentAt) {
    console.log(`\n✅ SUCCESS! Reminder was sent and tracked correctly.`);
  } else {
    console.log(`\n❌ ERROR! Reminder flag not set in database.`);
  }

  await db.$disconnect();
}

verifyReminderSent().catch((error) => {
  console.error("❌ Error:", error);
  process.exit(1);
});
