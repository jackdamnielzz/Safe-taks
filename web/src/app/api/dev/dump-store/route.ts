import { NextResponse } from "next/server";

/**
 * Dev-only: GET /api/dev/dump-store
 * Returns the current in-memory store for debugging seeded data.
 * This endpoint is strictly for local dev and tests.
 */
export async function GET() {
  try {
    // Use dynamic import to avoid TypeScript named-export resolution issues with the CommonJS shim.
    const serverHelpers = await import("@/lib/server-helpers");
    const inMemoryStore =
      serverHelpers.__inMemoryStore ||
      (serverHelpers.default && serverHelpers.default.__inMemoryStore) ||
      {};
    // Return a shallow copy to avoid accidental mutation.
    return NextResponse.json({ store: inMemoryStore });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to read in-memory store" },
      { status: 500 }
    );
  }
}
