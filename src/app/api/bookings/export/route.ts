import { NextResponse } from "next/server";
import { getCurrentTenant } from "@/lib/auth";
import { getBookings } from "@/lib/queries/bookings";

/**
 * GET /api/bookings/export
 * Export bookings as CSV
 */
export async function GET(request: Request) {
  try {
    const { tenantId } = await getCurrentTenant();
    const { searchParams } = new URL(request.url);

    // Get filters from query params
    const status = searchParams.get("status") || undefined;
    const paymentStatus = searchParams.get("paymentStatus") || undefined;
    const dateFrom = searchParams.get("dateFrom") || undefined;
    const dateTo = searchParams.get("dateTo") || undefined;
    const search = searchParams.get("search") || undefined;

    // Fetch all matching bookings (no limit for export)
    const { bookings } = await getBookings(tenantId, {
      status: status as any,
      paymentStatus: paymentStatus as any,
      dateFrom,
      dateTo,
      search,
      limit: 10000, // Large limit for export
    });

    // Generate CSV
    const headers = [
      "Date",
      "Heure",
      "Client",
      "Téléphone",
      "Service",
      "Statut",
      "Ressource",
      "Montant",
      "Devise",
      "Statut paiement",
      "Moyen de paiement",
      "Rappel envoyé",
      "Notes",
      "Créé le",
    ];

    const rows = bookings.map((booking) => [
      booking.date,
      booking.time,
      booking.customerName || "",
      booking.customerPhone,
      booking.service,
      booking.status,
      booking.resourceId || "",
      booking.amount ? booking.amount.toString() : "",
      booking.currency || "",
      booking.paymentStatus || "unpaid",
      booking.paymentMethod || "",
      booking.reminderSent ? "Oui" : "Non",
      booking.notes ? booking.notes.replace(/[\r\n]+/g, " ") : "",
      new Date(booking.createdAt).toISOString(),
    ]);

    // Convert to CSV format
    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row
          .map((cell) => {
            // Escape quotes and wrap in quotes if contains comma or quote
            const cellStr = String(cell);
            if (cellStr.includes(",") || cellStr.includes('"') || cellStr.includes("\n")) {
              return `"${cellStr.replace(/"/g, '""')}"`;
            }
            return cellStr;
          })
          .join(",")
      ),
    ].join("\n");

    // Return CSV file
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="reservations-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (error: any) {
    console.error("Error exporting bookings:", error);
    return NextResponse.json(
      { error: error.message || "Failed to export bookings" },
      { status: 500 }
    );
  }
}
