import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    // For load testing, we'll simulate authentication
    // In a real implementation, this would validate against Firebase Auth
    if (email && password) {
      // Generate a mock token for load testing
      const mockToken = Buffer.from(
        JSON.stringify({
          uid: `user_${Date.now()}`,
          email,
          role: email.includes("admin") ? "admin" : "field_worker",
          orgId: "test-org-id",
        })
      ).toString("base64");

      return NextResponse.json({
        token: mockToken,
        user: {
          uid: `user_${Date.now()}`,
          email,
          displayName: email.split("@")[0],
          role: email.includes("admin") ? "admin" : "field_worker",
        },
      });
    }

    return NextResponse.json({ error: "Invalid credentials", code: "AUTH_ERROR" }, { status: 401 });
  } catch (error) {
    console.error("Login error:", error);

    return NextResponse.json(
      { error: "Internal server error", code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
