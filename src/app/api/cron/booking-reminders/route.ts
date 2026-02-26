import { NextResponse } from "next/server";
import { sendBookingReminders } from "@/lib/jobs/booking-reminders";

// Cron endpoint for sending daily booking reminders
export async function GET(req: Request) {
  // Fail closed when the server is misconfigured.
  if (!process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Cron secret is not configured" }, { status: 503 });
  }

  // Verify authorization
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await sendBookingReminders();
    return NextResponse.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Booking reminder cron failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
