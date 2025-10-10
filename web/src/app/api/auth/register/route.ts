import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { email, password, displayName } = await request.json();

    if (!email || !password || !displayName) {
      return NextResponse.json(
        { error: "Email, password, and display name are required", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    // For load testing, we'll simulate user registration
    // In a real implementation, this would create a Firebase Auth user
    if (email && password && displayName) {
      return NextResponse.json(
        {
          user: {
            uid: `user_${Date.now()}`,
            email,
            displayName,
            role: "field_worker",
            createdAt: new Date().toISOString(),
          },
        },
        { status: 201 }
      );
    }

    return NextResponse.json(
      { error: "Registration failed", code: "REGISTRATION_ERROR" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Registration error:", error);

    return NextResponse.json(
      { error: "Internal server error", code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
