import { NextResponse } from "next/server";
import { db } from "@/lib/db";

const startTime = Date.now();

export async function GET() {
  const uptime = Date.now() - startTime;

  try {
    // Check database connection
    await db.$queryRaw`SELECT 1`;

    return NextResponse.json(
      {
        status: "healthy",
        uptime,
        timestamp: new Date().toISOString(),
        checks: {
          database: "ok",
        },
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        status: "unhealthy",
        uptime,
        timestamp: new Date().toISOString(),
        checks: {
          database: "failed",
        },
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 503 }
    );
  }
}
