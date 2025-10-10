import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Authorization token required", code: "AUTH_ERROR" },
        { status: 401 }
      );
    }

    // For load testing, we'll simulate logout
    // In a real implementation, this would invalidate the token
    if (authHeader) {
      return NextResponse.json({
        message: "Logout successful",
      });
    }

    return NextResponse.json({ error: "Logout failed", code: "LOGOUT_ERROR" }, { status: 400 });
  } catch (error) {
    console.error("Logout error:", error);

    return NextResponse.json(
      { error: "Internal server error", code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
