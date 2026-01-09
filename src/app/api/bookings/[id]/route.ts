import { NextResponse } from "next/server";
import { getCurrentTenant } from "@/lib/auth";
import { getBookingById, updateBooking, deleteBooking } from "@/lib/queries/bookings";
import { notifyBookingCancelled, notifyBookingUpdated, notifyNoShow } from "@/lib/notifications";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/bookings/[id]
 * Get single booking details with conversation
 */
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { tenantId } = await getCurrentTenant();
    const { id } = await params;

    const booking = await getBookingById(id, tenantId);

    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ booking });
  } catch (error) {
    console.error("Error fetching booking:", error);
    return NextResponse.json(
      { error: "Failed to fetch booking" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/bookings/[id]
 * Update booking details or status
 */
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { tenantId } = await getCurrentTenant();
    const { id } = await params;
    const body = await request.json();

    // Validate status if provided
    const validStatuses = ["pending", "confirmed", "cancelled", "completed", "no_show"];
    if (body.status && !validStatuses.includes(body.status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` },
        { status: 400 }
      );
    }

    // Validate payment fields if provided
    if (body.amount !== undefined) {
      if (typeof body.amount !== 'number' || body.amount < 0 || isNaN(body.amount)) {
        return NextResponse.json(
          { error: "Invalid amount. Must be a positive number." },
          { status: 400 }
        );
      }
      if (body.amount > 1000000) {
        return NextResponse.json(
          { error: "Amount exceeds maximum allowed value." },
          { status: 400 }
        );
      }
    }

    const validCurrencies = ["EUR", "USD", "GBP", "CHF"];
    if (body.currency && !validCurrencies.includes(body.currency)) {
      return NextResponse.json(
        { error: `Invalid currency. Must be one of: ${validCurrencies.join(", ")}` },
        { status: 400 }
      );
    }

    const validPaymentStatuses = ["unpaid", "deposit", "paid"];
    if (body.paymentStatus && !validPaymentStatuses.includes(body.paymentStatus)) {
      return NextResponse.json(
        { error: `Invalid payment status. Must be one of: ${validPaymentStatuses.join(", ")}` },
        { status: 400 }
      );
    }

    const validPaymentMethods = ["cash", "card", "transfer", "online"];
    if (body.paymentMethod && !validPaymentMethods.includes(body.paymentMethod)) {
      return NextResponse.json(
        { error: `Invalid payment method. Must be one of: ${validPaymentMethods.join(", ")}` },
        { status: 400 }
      );
    }

    // Extract allowed fields
    const updateData: any = {};
    if (body.status) updateData.status = body.status;
    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.date) updateData.date = body.date;
    if (body.time) updateData.time = body.time;
    if (body.service) updateData.service = body.service;
    if (body.customerName !== undefined) updateData.customerName = body.customerName;

    // Payment fields (already validated above)
    if (body.amount !== undefined) updateData.amount = body.amount;
    if (body.currency) updateData.currency = body.currency;
    if (body.paymentStatus) updateData.paymentStatus = body.paymentStatus;
    if (body.paymentMethod) updateData.paymentMethod = body.paymentMethod;
    if (body.paidAt) updateData.paidAt = new Date(body.paidAt);

    const booking = await updateBooking(id, tenantId, updateData);

    // Emit notifications based on changes
    try {
      if (body.status === "cancelled") {
        await notifyBookingCancelled(tenantId, booking);
      } else if (body.status === "no_show") {
        await notifyNoShow(tenantId, booking);
      } else if (body.date || body.time || body.service) {
        const changes = [];
        if (body.date) changes.push("date");
        if (body.time) changes.push("heure");
        if (body.service) changes.push("service");
        await notifyBookingUpdated(tenantId, booking, changes.join(", "));
      }
    } catch (error) {
      console.error("Failed to create notification:", error);
    }

    return NextResponse.json({ success: true, booking });
  } catch (error: any) {
    console.error("Error updating booking:", error);

    // Handle not found error
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update booking" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/bookings/[id]
 * Delete a booking
 */
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { tenantId } = await getCurrentTenant();
    const { id } = await params;

    await deleteBooking(id, tenantId);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting booking:", error);

    // Handle not found error
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Failed to delete booking" },
      { status: 500 }
    );
  }
}
