import { NextResponse } from "next/server";
import { getCurrentTenant } from "@/lib/auth";
import { getBookings } from "@/lib/queries/bookings";
import { db } from "@/lib/db";
import { notifyNewBooking } from "@/lib/notifications";

/**
 * GET /api/bookings
 * Fetch bookings with optional filters
 */
export async function GET(request: Request) {
  try {
    const { tenantId } = await getCurrentTenant();
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const filters = {
      status: searchParams.get("status") as any,
      paymentStatus: searchParams.get("paymentStatus") as any,
      dateFrom: searchParams.get("dateFrom") || undefined,
      dateTo: searchParams.get("dateTo") || undefined,
      search: searchParams.get("search") || undefined,
      limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
      offset: searchParams.get("offset") ? parseInt(searchParams.get("offset")!) : undefined,
    };

    const result = await getBookings(tenantId, filters);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching bookings:", error);
    return NextResponse.json(
      { error: "Failed to fetch bookings" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/bookings
 * Create a new booking manually
 */
export async function POST(request: Request) {
  try {
    const { tenantId } = await getCurrentTenant();
    const body = await request.json();

    // Validate required fields
    const { customerPhone, service, date, time } = body;
    if (!customerPhone || !service || !date || !time) {
      return NextResponse.json(
        { error: "Missing required fields: customerPhone, service, date, time" },
        { status: 400 }
      );
    }

    // Validate phone format (E.164 international format for WhatsApp compatibility)
    // E.164: +[country code][subscriber number] (e.g., +33612345678)
    const cleanPhone = customerPhone.replace(/[\s-]/g, '');
    const phoneRegex = /^\+[1-9]\d{1,14}$/;

    if (!phoneRegex.test(cleanPhone)) {
      return NextResponse.json(
        {
          error: "Format de téléphone invalide. Utilisez le format international: +33612345678",
          hint: "Le numéro doit commencer par + suivi du code pays et du numéro (8-15 chiffres au total)"
        },
        { status: 400 }
      );
    }

    // Validate time format (HH:MM)
    if (!/^\d{2}:\d{2}$/.test(time)) {
      return NextResponse.json(
        { error: "Invalid time format. Expected HH:MM" },
        { status: 400 }
      );
    }

    // Validate date not in the past
    const bookingDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (bookingDate < today) {
      return NextResponse.json(
        { error: "Cannot create booking in the past" },
        { status: 400 }
      );
    }

    // Check for existing booking at this time slot (prevent double booking)
    const existingBooking = await db.booking.findFirst({
      where: {
        tenantId,
        date,
        time,
        resourceId: body.resourceId || null,
        status: { notIn: ["cancelled"] }, // Ignore cancelled bookings
      },
    });

    if (existingBooking) {
      return NextResponse.json(
        { error: "Ce créneau est déjà réservé" },
        { status: 409 }
      );
    }

    // Create booking
    const booking = await db.booking.create({
      data: {
        tenantId,
        customerPhone: cleanPhone, // Use cleaned phone number
        customerName: body.customerName || null,
        service,
        date,
        time,
        resourceId: body.resourceId || null,
        status: body.status || "confirmed", // Manual bookings are confirmed by default
        notes: body.notes || null,
        conversationId: body.conversationId || null,
      },
    });

    // Emit notification
    try {
      await notifyNewBooking(tenantId, booking);
    } catch (error) {
      console.error("Failed to create notification:", error);
      // Don't fail the booking creation if notification fails
    }

    return NextResponse.json({ success: true, booking }, { status: 201 });
  } catch (error) {
    console.error("Error creating booking:", error);
    return NextResponse.json(
      { error: "Failed to create booking" },
      { status: 500 }
    );
  }
}
