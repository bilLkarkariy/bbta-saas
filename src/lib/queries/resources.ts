import { db } from "@/lib/db";

export interface Resource {
  id: string;
  tenantId: string;
  name: string;
  type: string;
  color: string | null;
  isActive: boolean;
  workingHours: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateResourceInput {
  name: string;
  type: "staff" | "room" | "equipment";
  color?: string;
  workingHours?: any;
}

export interface UpdateResourceInput {
  name?: string;
  type?: "staff" | "room" | "equipment";
  color?: string;
  isActive?: boolean;
  workingHours?: any;
}

/**
 * Get all resources for a tenant
 */
export async function getResources(tenantId: string, type?: string) {
  return db.resource.findMany({
    where: {
      tenantId,
      ...(type && { type }),
    },
    orderBy: [
      { isActive: "desc" },
      { name: "asc" },
    ],
  });
}

/**
 * Get resource by ID
 */
export async function getResourceById(id: string, tenantId: string) {
  return db.resource.findFirst({
    where: {
      id,
      tenantId,
    },
  });
}

/**
 * Create a new resource
 */
export async function createResource(
  tenantId: string,
  data: CreateResourceInput
) {
  return db.resource.create({
    data: {
      tenantId,
      name: data.name,
      type: data.type,
      color: data.color || null,
      workingHours: data.workingHours || null,
      isActive: true,
    },
  });
}

/**
 * Update a resource
 */
export async function updateResource(
  id: string,
  tenantId: string,
  data: UpdateResourceInput
) {
  // Verify resource belongs to tenant
  const resource = await getResourceById(id, tenantId);
  if (!resource) {
    throw new Error("Resource not found");
  }

  return db.resource.update({
    where: { id },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.type && { type: data.type }),
      ...(data.color !== undefined && { color: data.color }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
      ...(data.workingHours !== undefined && { workingHours: data.workingHours }),
    },
  });
}

/**
 * Delete a resource
 */
export async function deleteResource(id: string, tenantId: string) {
  // Verify resource belongs to tenant
  const resource = await getResourceById(id, tenantId);
  if (!resource) {
    throw new Error("Resource not found");
  }

  // Check if resource is used in any bookings
  const bookingCount = await db.booking.count({
    where: {
      resourceId: id,
    },
  });

  if (bookingCount > 0) {
    throw new Error(
      `Cannot delete resource. It is assigned to ${bookingCount} booking(s). Please unassign or delete those bookings first.`
    );
  }

  return db.resource.delete({
    where: { id },
  });
}

/**
 * Get resource availability for a specific date
 */
export async function getResourceAvailability(
  resourceId: string,
  tenantId: string,
  date: string
) {
  const resource = await getResourceById(resourceId, tenantId);
  if (!resource || !resource.isActive) {
    return { available: false, bookings: [] };
  }

  // Get all bookings for this resource on this date
  const bookings = await db.booking.findMany({
    where: {
      tenantId,
      resourceId,
      date,
      status: {
        in: ["pending", "confirmed"],
      },
    },
    orderBy: {
      time: "asc",
    },
  });

  return {
    available: true,
    bookings,
    workingHours: resource.workingHours,
  };
}
