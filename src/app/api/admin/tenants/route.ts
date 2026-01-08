import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    await requireSuperAdmin();

    const body = await req.json();
    const {
      name,
      slug,
      businessName,
      businessType,
      plan,
      status,
      phone,
      address,
      city,
      timezone,
      services,
      pricing,
      ownerEmail,
      ownerName,
    } = body;

    // Validate required fields
    if (!name || !slug || !ownerEmail) {
      return NextResponse.json(
        { error: "Name, slug, and owner email are required" },
        { status: 400 }
      );
    }

    // Check if slug is unique
    const existingTenant = await db.tenant.findUnique({
      where: { slug },
    });

    if (existingTenant) {
      return NextResponse.json(
        { error: "A tenant with this slug already exists" },
        { status: 400 }
      );
    }

    // Check if owner email is already used
    const existingUser = await db.user.findUnique({
      where: { email: ownerEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "A user with this email already exists" },
        { status: 400 }
      );
    }

    // Create tenant and owner user in a transaction
    const tenant = await db.$transaction(async (tx) => {
      // Create tenant
      const newTenant = await tx.tenant.create({
        data: {
          name,
          slug,
          businessName: businessName || null,
          businessType: businessType || "services",
          plan: plan || "starter",
          status: status || "trial",
          phone: phone || null,
          address: address || null,
          city: city || null,
          timezone: timezone || "Europe/Paris",
          services: services || [],
          pricing: pricing || null,
          trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days trial
        },
      });

      // Create owner user (without clerkId - will be linked when they sign up)
      // For now, we'll use a placeholder clerkId that will be updated
      await tx.user.create({
        data: {
          clerkId: `pending_${Date.now()}_${Math.random().toString(36).slice(2)}`,
          email: ownerEmail,
          name: ownerName || null,
          role: "OWNER",
          tenantId: newTenant.id,
        },
      });

      return newTenant;
    });

    return NextResponse.json(tenant, { status: 201 });
  } catch (error) {
    console.error("Failed to create tenant:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create tenant" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    await requireSuperAdmin();

    const tenants = await db.tenant.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: {
            users: true,
            conversations: true,
            faqs: true,
            bookings: true,
          },
        },
        integrations: {
          where: { type: "twilio" },
          select: { status: true },
        },
      },
    });

    return NextResponse.json(tenants);
  } catch (error) {
    console.error("Failed to fetch tenants:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unauthorized" },
      { status: 401 }
    );
  }
}
