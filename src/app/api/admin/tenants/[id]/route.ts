import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSuperAdmin();
    const { id } = await params;

    const tenant = await db.tenant.findUnique({
      where: { id },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        faqs: {
          take: 10,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            question: true,
            answer: true,
            isActive: true,
          },
        },
        conversations: {
          take: 10,
          orderBy: { lastMessageAt: "desc" },
          select: {
            id: true,
            customerPhone: true,
            customerName: true,
            status: true,
            lastMessageAt: true,
            _count: { select: { messages: true } },
          },
        },
        bookings: {
          take: 10,
          orderBy: { date: "desc" },
          select: {
            id: true,
            customerName: true,
            service: true,
            date: true,
            status: true,
          },
        },
        _count: {
          select: {
            conversations: true,
            faqs: true,
            bookings: true,
            contacts: true,
          },
        },
      },
    });

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    return NextResponse.json(tenant);
  } catch (error) {
    console.error("Failed to fetch tenant:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unauthorized" },
      { status: 401 }
    );
  }
}
