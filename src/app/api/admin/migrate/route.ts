import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function GET(req: Request) {
  // Keep this endpoint available for local/demo setup only.
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    // Run migrations
    console.log("Running migrations...");
    const { stdout: migrateOutput, stderr: migrateError } = await execAsync("npx prisma migrate deploy");
    console.log("Migration output:", migrateOutput);
    if (migrateError) console.error("Migration stderr:", migrateError);

    // Run seed
    console.log("Seeding BBTA data...");
    const { stdout: seedOutput, stderr: seedError } = await execAsync("npx tsx prisma/seed-bbta.ts");
    console.log("Seed output:", seedOutput);
    if (seedError) console.error("Seed stderr:", seedError);

    return NextResponse.json({
      success: true,
      migration: migrateOutput,
      seed: seedOutput,
    });
  } catch (error: any) {
    console.error("Migration/seed error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        stdout: error.stdout,
        stderr: error.stderr,
      },
      { status: 500 }
    );
  }
}
