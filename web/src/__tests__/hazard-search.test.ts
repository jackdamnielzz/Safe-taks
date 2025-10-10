import { searchHazards } from "@/lib/hazard-search";
import { HAZARDS } from "@/lib/data/hazards";

describe("hazard-search", () => {
  test("returns results for simple query matching title/description/keywords", () => {
    const res = searchHazards("electrical");
    if (!(res.length > 0)) throw new Error('Expected at least one result for "electrical"');
    const hasMatch = res.some(
      (h) =>
        h.title.toLowerCase().includes("electrical") ||
        h.description.toLowerCase().includes("electrical") ||
        h.keywords.some((k) => k.toLowerCase().includes("electrical"))
    );
    if (!hasMatch) throw new Error('Expected at least one result to match "electrical" in text');
  });

  test("applies industry filter correctly", () => {
    const res = searchHazards("", { industry: "construction" });
    if (!(res.length > 0)) throw new Error("Expected construction results");
    if (!res.every((h) => h.industry.toLowerCase() === "construction"))
      throw new Error("Industry filter failed");
  });

  test("applies category filter correctly", () => {
    const res = searchHazards("", { category: "chemical" });
    if (!(res.length > 0)) throw new Error("Expected chemical category results");
    if (!res.every((h) => h.categories.map((c) => c.toLowerCase()).includes("chemical")))
      throw new Error("Category filter failed");
  });

  test("applies severity filter correctly", () => {
    const res = searchHazards("", { severity: "high" });
    if (!(res.length > 0)) throw new Error("Expected high severity results");
    if (!res.every((h) => h.severity === "high")) throw new Error("Severity filter failed");
  });

  test("returns at most 200 results and source has >=100 hazards", () => {
    const res = searchHazards("");
    if (!(res.length <= 200)) throw new Error("Expected max 200 results");
    if (!(HAZARDS.length >= 100))
      throw new Error("Expected source hazards to have at least 100 items");
  });
});
