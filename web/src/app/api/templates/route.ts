import { NextResponse } from "next/server";
import { getAllTemplates } from "@/lib/templates/load-templates";

/**
 * API route to return available TRA templates.
 * This provides a reliable client-side fetch endpoint so the UI doesn't depend on bundler JSON import behavior.
 */
export async function GET() {
  try {
    const templates = getAllTemplates();
    return NextResponse.json({ templates }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: (error as any)?.message || String(error) }, { status: 500 });
  }
}
