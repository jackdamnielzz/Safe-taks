import { NextResponse } from "next/server";
import { HAZARDS } from "@/lib/data/hazards";
import { searchHazards } from "@/lib/hazard-search";
import type { Hazard } from "@/lib/types/hazard";

function parseQueryParam(v: string | null) {
  return v === null || v === undefined ? undefined : v;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const searchParams = url.searchParams;

  const query = parseQueryParam(searchParams.get("query")) || "";
  const industry = parseQueryParam(searchParams.get("industry")) || undefined;
  const category = parseQueryParam(searchParams.get("category")) || undefined;
  const severity = parseQueryParam(searchParams.get("severity")) || undefined;

  const page = parseInt(searchParams.get("page") || "1", 10) || 1;
  const pageSize = Math.min(parseInt(searchParams.get("pageSize") || "50", 10) || 50, 200);

  // perform search using in-memory library
  const matches: Hazard[] = searchHazards(query, { industry, category, severity });

  const total = matches.length;
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const items = matches.slice(start, end);

  return NextResponse.json(
    {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    },
    { status: 200 }
  );
}
