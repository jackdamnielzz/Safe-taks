import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Authorization token required", code: "AUTH_ERROR" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    if (!token) {
      return NextResponse.json({ error: "Invalid token", code: "AUTH_ERROR" }, { status: 401 });
    }

    // For load testing, we'll simulate profile retrieval
    // In a real implementation, this would verify the JWT token
    try {
      const decodedToken = JSON.parse(Buffer.from(token, "base64").toString());

      return NextResponse.json({
        uid: decodedToken.uid,
        email: decodedToken.email,
        displayName: decodedToken.email?.split("@")[0] || "User",
        role: decodedToken.role || "field_worker",
        orgId: decodedToken.orgId || "test-org-id",
        emailVerified: true,
        createdAt: new Date().toISOString(),
      });
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid token format", code: "AUTH_ERROR" },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error("Profile retrieval error:", error);

    return NextResponse.json(
      { error: "Internal server error", code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
