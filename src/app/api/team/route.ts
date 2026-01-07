import { NextRequest, NextResponse } from "next/server";
import { getCurrentTenant } from "@/lib/auth";
import { db } from "@/lib/db";
import { getCacheHeaders } from "@/lib/fetcher";
import { z } from "zod";

// List team members
export async function GET() {
  try {
    const { tenant, user } = await getCurrentTenant();

    // Only OWNER and ADMIN can view team
    if (user.role !== "OWNER" && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const members = await db.user.findMany({
      where: { tenantId: tenant.id },
      select: {
        id: true,
        clerkId: true,
        email: true,
        name: true,
        role: true,
        isAvailable: true,
        maxConversations: true,
        createdAt: true,
        _count: {
          select: {
            assignedConversations: {
              where: { status: "active" },
            },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    const formatted = members.map((m) => ({
      id: m.id,
      clerkId: m.clerkId,
      email: m.email,
      name: m.name,
      role: m.role,
      isAvailable: m.isAvailable,
      maxConversations: m.maxConversations,
      activeConversations: m._count.assignedConversations,
      createdAt: m.createdAt.toISOString(),
    }));

    // Cache team data for 30s client, 60s CDN
    const cacheHeaders = getCacheHeaders({
      type: "revalidate",
      maxAge: 30,
      sMaxAge: 60,
      staleWhileRevalidate: 300,
    });

    return NextResponse.json(formatted, { headers: cacheHeaders });
  } catch (error) {
    if (error instanceof Error && error.message === "User not found") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Team API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(["ADMIN", "AGENT", "VIEWER"]),
});

// Invite team member
export async function POST(request: NextRequest) {
  try {
    const { tenant, user } = await getCurrentTenant();

    // Only OWNER can invite
    if (user.role !== "OWNER") {
      return NextResponse.json({ error: "Only owners can invite team members" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = inviteSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { email, role } = parsed.data;

    // Check if user already exists
    const existing = await db.user.findUnique({
      where: { email },
    });

    if (existing) {
      if (existing.tenantId === tenant.id) {
        return NextResponse.json(
          { error: "User is already a team member" },
          { status: 400 }
        );
      } else {
        return NextResponse.json(
          { error: "User belongs to another organization" },
          { status: 400 }
        );
      }
    }

    // Create pending invitation (user will be created when they sign up via Clerk)
    // For now, we'll create a placeholder user that will be linked when they sign up
    // TODO: Implement proper invitation flow with Clerk organizations

    return NextResponse.json({
      message: "Invitation flow not yet implemented. User will be added when they sign up with Clerk.",
      email,
      role,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "User not found") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Team invite error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
