import { NextResponse } from "next/server";
import { RecommendationRequestSchema } from "../../../lib/validators/recommendation";
import { recommendForHazard } from "../../../lib/recommendations/recommender";

/**
 * POST /api/recommendations
 * Body: { hazardId, context?, maxResults? }
 */
export async function POST(request: Request) {
  try {
    const data = await request.json();
    const parsed = RecommendationRequestSchema.safeParse(data);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const req = parsed.data;
    const result = recommendForHazard(req);
    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: "Server error", details: String(err) }, { status: 500 });
  }
}
