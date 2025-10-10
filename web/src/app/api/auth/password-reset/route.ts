import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    // For load testing, we'll simulate password reset
    // In a real implementation, this would send a password reset email
    if (email) {
      // Simulate successful password reset email sent
      return NextResponse.json({
        message: "Password reset email sent successfully",
      });
    }

    return NextResponse.json(
      { error: "Password reset failed", code: "RESET_ERROR" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Password reset error:", error);

    return NextResponse.json(
      { error: "Internal server error", code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
