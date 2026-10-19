import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { organizations, meetings, actionItems, meetingDecisions, openQuestions } from "./schema";

async function runSeed() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.log("No DATABASE_URL configured. Skipping PostgreSQL seed.");
    return;
  }

  console.log("Connecting to PostgreSQL...");
  const pool = new Pool({ connectionString: databaseUrl });
  const db = drizzle(pool);

  try {
    const orgId = crypto.randomUUID();
    await db.insert(organizations).values({
      id: orgId,
      name: "SWUdevs Student Organization",
      slug: "swudevs",
    });

    const meetingId = crypto.randomUUID();
    await db.insert(meetings).values({
      id: meetingId,
      organizationId: orgId,
      title: "Hackathon Strategy and Logistics Meeting",
      description: "Planning roles, poster deadlines, and food sponsors",
      meetingDate: "2026-10-23",
      timezone: "Asia/Manila",
      rawTranscript: "Seed meeting transcript...",
      summary: "Team coordinated hackathon roles and postponed merch orders.",
    });

    console.log("✓ Database seeded successfully.");
  } catch (err: any) {
    console.warn("Seed notice:", err.message);
  } finally {
    await pool.end();
  }
}

runSeed();
