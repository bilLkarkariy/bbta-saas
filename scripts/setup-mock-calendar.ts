/**
 * Setup Mock Calendar for WhatsApp Booking Tests
 *
 * This script creates test bookings in the database to simulate
 * a realistic calendar with some slots already booked.
 *
 * Run with: npx tsx scripts/setup-mock-calendar.ts
 */

import { db } from "../src/lib/db";
import { addDays, format } from "date-fns";

interface MockBooking {
  date: string;
  time: string;
  customerName: string;
  service: string;
  status: "confirmed" | "pending";
}

// Mock bookings for the next 3 days
const mockBookings: MockBooking[] = [
  // Tomorrow
  {
    date: format(addDays(new Date(), 1), "yyyy-MM-dd"),
    time: "10:00",
    customerName: "Marie Dupont",
    service: "Coupe + Brushing",
    status: "confirmed",
  },
  {
    date: format(addDays(new Date(), 1), "yyyy-MM-dd"),
    time: "15:00",
    customerName: "Jean Martin",
    service: "Coloration",
    status: "confirmed",
  },
  // Day after tomorrow
  {
    date: format(addDays(new Date(), 2), "yyyy-MM-dd"),
    time: "14:00",
    customerName: "Sophie Laurent",
    service: "Soin Profond",
    status: "confirmed",
  },
  {
    date: format(addDays(new Date(), 2), "yyyy-MM-dd"),
    time: "10:30",
    customerName: "Pierre Dubois",
    service: "Coupe Homme",
    status: "pending",
  },
  // Day 3
  {
    date: format(addDays(new Date(), 3), "yyyy-MM-dd"),
    time: "09:00",
    customerName: "Amélie Bernard",
    service: "Mèches",
    status: "confirmed",
  },
  {
    date: format(addDays(new Date(), 3), "yyyy-MM-dd"),
    time: "16:00",
    customerName: "Thomas Petit",
    service: "Barbe",
    status: "confirmed",
  },
];

async function setupMockCalendar() {
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
    console.error("❌ No tenant found with WhatsApp configured");
    process.exit(1);
  }

  console.log(`✅ Found tenant: ${tenant.name}`);
  console.log(`   WhatsApp: ${tenant.whatsappNumber}`);

  console.log("\n🗑️  Cleaning up old mock bookings...");

  // Delete previous mock bookings
  const deleted = await db.booking.deleteMany({
    where: {
      tenantId: tenant.id,
      customerName: {
        in: mockBookings.map((b) => b.customerName),
      },
    },
  });

  console.log(`   Deleted ${deleted.count} old mock bookings`);

  console.log("\n📅 Creating mock calendar...");

  for (const booking of mockBookings) {
    const created = await db.booking.create({
      data: {
        tenantId: tenant.id,
        customerPhone: `+336${Math.floor(10000000 + Math.random() * 90000000)}`,
        customerName: booking.customerName,
        service: booking.service,
        date: booking.date,
        time: booking.time,
        status: booking.status,
        notes: "Mock booking for testing",
      },
    });

    console.log(`   ✅ ${booking.date} at ${booking.time}: ${booking.customerName} - ${booking.service}`);
  }

  console.log("\n📊 Calendar Overview:");
  console.log("=".repeat(60));

  // Group by date
  const bookingsByDate = mockBookings.reduce((acc, booking) => {
    if (!acc[booking.date]) {
      acc[booking.date] = [];
    }
    acc[booking.date].push(booking);
    return acc;
  }, {} as Record<string, MockBooking[]>);

  for (const [date, bookings] of Object.entries(bookingsByDate)) {
    console.log(`\n📅 ${date}:`);
    const allSlots = ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00"];

    allSlots.forEach((slot) => {
      const booking = bookings.find((b) => b.time === slot);
      if (booking) {
        console.log(`   ${slot}: ❌ Booked - ${booking.customerName} (${booking.service})`);
      } else {
        console.log(`   ${slot}: ✅ Available`);
      }
    });
  }

  console.log("\n" + "=".repeat(60));
  console.log("\n✅ Mock calendar created successfully!");
  console.log("\n📝 Next steps:");
  console.log("   1. Run: npx tsx scripts/test-whatsapp-conversation.ts +33XXXXXXXXX");
  console.log("   2. Send a WhatsApp message to start booking");
  console.log("   3. The AI agent will show available slots based on this calendar");

  await db.$disconnect();
}

setupMockCalendar().catch((error) => {
  console.error("❌ Error:", error);
  process.exit(1);
});
