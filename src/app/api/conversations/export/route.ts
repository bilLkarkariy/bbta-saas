import { NextRequest, NextResponse } from "next/server";
import { getCurrentTenant } from "@/lib/auth";
import { db } from "@/lib/db";
import { format, subDays } from "date-fns";

// UTF-8 BOM for Excel compatibility
const UTF8_BOM = "\uFEFF";

interface ConversationExportRow {
  id: string;
  customerPhone: string;
  customerName: string | null;
  status: string;
  priority: string;
  messageCount: number;
  leadScore: number | null;
  leadStatus: string | null;
  assignedTo: string | null;
  lastMessageAt: string;
  createdAt: string;
  tags: string;
}

function generateCSV(data: ConversationExportRow[]): string {
  const headers = [
    "ID",
    "Téléphone",
    "Nom",
    "Statut",
    "Priorité",
    "Messages",
    "Score Lead",
    "Statut Lead",
    "Assigné à",
    "Dernier message",
    "Créé le",
    "Tags",
  ];

  const rows = data.map((row) => [
    row.id,
    row.customerPhone,
    row.customerName || "",
    row.status,
    row.priority,
    row.messageCount.toString(),
    row.leadScore?.toString() || "",
    row.leadStatus || "",
    row.assignedTo || "",
    row.lastMessageAt,
    row.createdAt,
    row.tags,
  ]);

  const escapeCsvValue = (value: string): string => {
    if (value.includes(",") || value.includes('"') || value.includes("\n")) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  };

  const headerLine = headers.map(escapeCsvValue).join(",");
  const dataLines = rows.map((row) => row.map(escapeCsvValue).join(","));

  return UTF8_BOM + [headerLine, ...dataLines].join("\n");
}

export async function GET(request: NextRequest) {
  try {
    const { tenant } = await getCurrentTenant();
    const { searchParams } = new URL(request.url);

    const formatParam = searchParams.get("format") || "csv";
    const days = parseInt(searchParams.get("days") || "30", 10);
    const statusFilter = searchParams.get("status");

    if (formatParam !== "csv" && formatParam !== "json") {
      return NextResponse.json(
        { error: "Format must be csv or json" },
        { status: 400 }
      );
    }

    if (isNaN(days) || days < 1 || days > 365) {
      return NextResponse.json(
        { error: "Days must be between 1 and 365" },
        { status: 400 }
      );
    }

    const startDate = subDays(new Date(), days);

    // Build query filters
    const where: Record<string, unknown> = {
      tenantId: tenant.id,
      createdAt: { gte: startDate },
    };

    if (statusFilter) {
      where.status = statusFilter;
    }

    // Fetch conversations with messages count and assignment
    const conversations = await db.conversation.findMany({
      where,
      include: {
        assignedTo: {
          select: { name: true, email: true },
        },
        messages: {
          select: { id: true },
        },
      },
      orderBy: { lastMessageAt: "desc" },
    });

    // Transform to export format
    const data: ConversationExportRow[] = conversations.map((conv) => ({
      id: conv.id,
      customerPhone: conv.customerPhone,
      customerName: conv.customerName,
      status: conv.status,
      priority: conv.priority,
      messageCount: conv.messages.length,
      leadScore: conv.leadScore,
      leadStatus: conv.leadStatus,
      assignedTo: conv.assignedTo?.name || conv.assignedTo?.email || null,
      lastMessageAt: format(conv.lastMessageAt, "yyyy-MM-dd HH:mm"),
      createdAt: format(conv.createdAt, "yyyy-MM-dd HH:mm"),
      tags: conv.tags.join(", "),
    }));

    if (formatParam === "json") {
      return NextResponse.json(data, {
        headers: {
          "Content-Disposition": `attachment; filename="conversations_${format(new Date(), "yyyy-MM-dd")}.json"`,
        },
      });
    }

    // CSV format
    const csv = generateCSV(data);
    const filename = `conversations_${tenant.slug}_${format(new Date(), "yyyy-MM-dd")}.csv`;

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "User not found") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Conversation export error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
