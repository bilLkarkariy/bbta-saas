import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { Webhook } from "svix";
import { db } from "@/lib/db";

// Clerk webhook event types
interface ClerkUserCreatedEvent {
  type: "user.created";
  data: {
    id: string;
    email_addresses: Array<{ email_address: string }>;
    first_name: string | null;
    last_name: string | null;
  };
}

interface ClerkUserDeletedEvent {
  type: "user.deleted";
  data: {
    id: string;
  };
}

type ClerkWebhookEvent = ClerkUserCreatedEvent | ClerkUserDeletedEvent;

export async function POST(req: Request) {
  // Get headers
  const headerPayload = await headers();
  const svixId = headerPayload.get("svix-id");
  const svixTimestamp = headerPayload.get("svix-timestamp");
  const svixSignature = headerPayload.get("svix-signature");

  // Validate headers exist
  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json(
      { error: "Missing svix headers" },
      { status: 400 }
    );
  }

  // Get body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Verify webhook signature
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("CLERK_WEBHOOK_SECRET is not set");
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 }
    );
  }

  const wh = new Webhook(webhookSecret);

  let evt: ClerkWebhookEvent;
  try {
    evt = wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as ClerkWebhookEvent;
  } catch (err) {
    console.error("Webhook verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Handle events
  const eventType = evt.type;

  if (eventType === "user.created") {
    const { id, email_addresses, first_name, last_name } = evt.data;
    const email = email_addresses[0]?.email_address;

    if (!email) {
      return NextResponse.json(
        { error: "No email address found" },
        { status: 400 }
      );
    }

    // Generate unique slug
    const baseSlug = (first_name || "business")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");
    const slug = `${baseSlug}-${id.slice(0, 8)}`;

    try {
      // Create tenant and user in a transaction
      await db.tenant.create({
        data: {
          name: first_name ? `${first_name}'s Business` : "Mon Business",
          slug,
          businessType: "service",
          status: "trial",
          trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days trial
          users: {
            create: {
              clerkId: id,
              email,
              name: [first_name, last_name].filter(Boolean).join(" ") || null,
              role: "owner",
            },
          },
        },
      });
    } catch (error) {
      console.error("Failed to create tenant:", error);
      return NextResponse.json(
        { error: "Failed to create tenant" },
        { status: 500 }
      );
    }
  }

  if (eventType === "user.deleted") {
    const { id } = evt.data;

    try {
      // Find and delete user (tenant will cascade if this is the only user)
      const user = await db.user.findUnique({
        where: { clerkId: id },
      });

      if (user) {
        // Check if this is the only user in the tenant
        const tenantUsers = await db.user.count({
          where: { tenantId: user.tenantId },
        });

        if (tenantUsers === 1) {
          // Delete the entire tenant (cascades to user)
          await db.tenant.delete({
            where: { id: user.tenantId },
          });
        } else {
          // Just delete the user
          await db.user.delete({
            where: { clerkId: id },
          });
        }
      }
    } catch (error) {
      console.error("Failed to delete user:", error);
      // Don't return error - user might already be deleted
    }
  }

  return NextResponse.json({ received: true });
}
