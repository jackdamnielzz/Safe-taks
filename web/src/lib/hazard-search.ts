import { HAZARDS } from "./data/hazards";
import type { Hazard } from "./types/hazard";

type Filters = { industry?: string; category?: string; severity?: string };

function matchText(h: Hazard, q: string): boolean {
  const s = q.trim().toLowerCase();
  if (!s) return true;
  if (h.title.toLowerCase().includes(s)) return true;
  if (h.description.toLowerCase().includes(s)) return true;
  if (h.keywords.some((k) => k.toLowerCase().includes(s))) return true;
  return false;
}

export function searchHazards(query: string, filters?: Filters): Hazard[] {
  const q = (query || "").trim().toLowerCase();
  const results: Hazard[] = [];

  for (const h of HAZARDS) {
    if (filters?.industry && filters.industry.toLowerCase() !== h.industry.toLowerCase()) {
      continue;
    }
    if (filters?.category) {
      const cat = filters.category.toLowerCase();
      if (!h.categories.some((c) => c.toLowerCase() === cat)) continue;
    }
    if (filters?.severity) {
      if (h.severity !== (filters.severity as Hazard["severity"])) continue;
    }

    if (q === "" || matchText(h, q)) {
      results.push(h);
      if (results.length >= 200) break;
    }
  }

  return results;
}
