import { getCurrentTenant } from "@/lib/auth";
import { db } from "@/lib/db";
import { TeamPage } from "@/components/dashboard/team";

export default async function TeamPageRoute() {
  const { tenant, user } = await getCurrentTenant();

  // Get all team members with conversation counts
  const members = await db.user.findMany({
    where: { tenantId: tenant.id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isAvailable: true,
      maxConversations: true,
      _count: {
        select: {
          assignedConversations: true,
        },
      },
    },
    orderBy: [
      { role: "asc" }, // OWNER first
      { name: "asc" },
    ],
  });

  return (
    <TeamPage
      members={members}
      currentUser={{
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isAvailable: user.isAvailable,
        maxConversations: user.maxConversations,
      }}
      assignmentStrategy={tenant.assignmentStrategy as "manual" | "round_robin" | "least_busy"}
      autoAssignOnInbound={tenant.autoAssignOnInbound}
    />
  );
}
