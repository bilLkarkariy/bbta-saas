import { NextRequest, NextResponse } from "next/server";
import { getCurrentTenant } from "@/lib/auth";
import { db } from "@/lib/db";
import { format } from "date-fns";

// UTF-8 BOM for Excel compatibility
const UTF8_BOM = "\uFEFF";

interface ContactExportRow {
  phone: string;
  name: string | null;
  email: string | null;
  company: string | null;
  source: string;
  tags: string;
  messageCount: number;
  lastContactAt: string | null;
  isOptedOut: boolean;
  createdAt: string;
}

function generateCSV(data: ContactExportRow[]): string {
  const headers = [
    "Téléphone",
    "Nom",
    "Email",
    "Entreprise",
    "Source",
    "Tags",
    "Messages",
    "Dernier contact",
    "Désinscrit",
    "Créé le",
  ];

  const rows = data.map((row) => [
    row.phone,
    row.name || "",
    row.email || "",
    row.company || "",
    row.source,
    row.tags,
    row.messageCount.toString(),
    row.lastContactAt || "",
    row.isOptedOut ? "Oui" : "Non",
    row.createdAt,
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
    const tagFilter = searchParams.get("tag");
    const sourceFilter = searchParams.get("source");

    if (formatParam !== "csv" && formatParam !== "json") {
      return NextResponse.json(
        { error: "Format must be csv or json" },
        { status: 400 }
      );
    }

    // Build query filters
    const where: Record<string, unknown> = {
      tenantId: tenant.id,
    };

    if (sourceFilter) {
      where.source = sourceFilter;
    }

    // Fetch contacts with tags
    const contacts = await db.contact.findMany({
      where,
      include: {
        tags: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Filter by tag if specified
    let filteredContacts = contacts;
    if (tagFilter) {
      filteredContacts = contacts.filter((c) =>
        c.tags.some((t) => t.name === tagFilter)
      );
    }

    // Transform to export format
    const data: ContactExportRow[] = filteredContacts.map((contact) => ({
      phone: contact.phone,
      name: contact.name,
      email: contact.email,
      company: contact.company,
      source: contact.source,
      tags: contact.tags.map((t) => t.name).join(", "),
      messageCount: contact.messageCount,
      lastContactAt: contact.lastContactAt
        ? format(contact.lastContactAt, "yyyy-MM-dd HH:mm")
        : null,
      isOptedOut: contact.isOptedOut,
      createdAt: format(contact.createdAt, "yyyy-MM-dd HH:mm"),
    }));

    if (formatParam === "json") {
      return NextResponse.json(data, {
        headers: {
          "Content-Disposition": `attachment; filename="contacts_${format(new Date(), "yyyy-MM-dd")}.json"`,
        },
      });
    }

    // CSV format
    const csv = generateCSV(data);
    const filename = `contacts_${tenant.slug}_${format(new Date(), "yyyy-MM-dd")}.csv`;

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
    console.error("Contact export error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
