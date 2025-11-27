import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/firebase-admin';
import { cookies } from 'next/headers';

/**
 * API Route: Create Firebase Session Cookie
 * 
 * This endpoint creates an HTTP-only session cookie from a Firebase ID token.
 * This enables server-side authentication checks in middleware.
 * 
 * POST /api/auth/session
 * Body: { idToken: string }
 * 
 * The session cookie is stored as '__session' (Firebase convention for CDN compatibility)
 * and is validated by the middleware on each request.
 */

export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json();

    if (!idToken) {
      return NextResponse.json(
        { error: 'ID token is required' },
        { status: 400 }
      );
    }

    // Verify the ID token
    const decodedToken = await auth.verifyIdToken(idToken);
    
    // Create session cookie (expires in 14 days)
    const expiresIn = 60 * 60 * 24 * 14 * 1000; // 14 days in milliseconds
    const sessionCookie = await auth.createSessionCookie(idToken, { expiresIn });

    // Set the session cookie
    const cookieStore = await cookies();
    cookieStore.set('__session', sessionCookie, {
      maxAge: expiresIn / 1000, // maxAge is in seconds
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    console.log('✅ Session cookie created for user:', decodedToken.uid);

    return NextResponse.json({ 
      success: true,
      uid: decodedToken.uid 
    });
  } catch (error: any) {
    console.error('❌ Error creating session cookie:', error);
    
    // Handle specific Firebase errors
    if (error.code === 'auth/id-token-expired') {
      return NextResponse.json(
        { error: 'ID token has expired' },
        { status: 401 }
      );
    }
    
    if (error.code === 'auth/invalid-id-token') {
      return NextResponse.json(
        { error: 'Invalid ID token' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create session cookie', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/auth/session
 * Clear the session cookie on logout
 */
export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    
    // Remove the session cookie
    cookieStore.delete('__session');

    console.log('✅ Session cookie cleared');

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('❌ Error clearing session cookie:', error);
    return NextResponse.json(
      { error: 'Failed to clear session cookie' },
      { status: 500 }
    );
  }
}
