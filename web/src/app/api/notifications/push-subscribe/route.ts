import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { PushNotificationService } from "@/lib/notifications/push-service";
import { NotificationSubscription, UpdateNotificationPreferences } from "@/lib/types/notification";

// Validation schemas
const subscriptionSchema = z.object({
  subscription: z.object({
    endpoint: z.string().url(),
    keys: z.object({
      p256dh: z.string(),
      auth: z.string(),
    }),
  }),
  preferences: z
    .object({
      enabled: z.boolean().optional(),
      priorities: z
        .object({
          LOW: z.boolean().optional(),
          MEDIUM: z.boolean().optional(),
          HIGH: z.boolean().optional(),
          CRITICAL: z.boolean().optional(),
        })
        .optional(),
      types: z
        .object({
          LMRA_STOP_WORK: z.boolean().optional(),
          LMRA_COMPLETED: z.boolean().optional(),
          TRA_APPROVED: z.boolean().optional(),
          TRA_REJECTED: z.boolean().optional(),
          TRA_OVERDUE: z.boolean().optional(),
          SAFETY_INCIDENT: z.boolean().optional(),
          EQUIPMENT_ISSUE: z.boolean().optional(),
          WEATHER_ALERT: z.boolean().optional(),
          SYSTEM_ALERT: z.boolean().optional(),
        })
        .optional(),
      quietHours: z
        .object({
          enabled: z.boolean().optional(),
          start: z
            .string()
            .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
            .optional(),
          end: z
            .string()
            .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
            .optional(),
        })
        .optional(),
      channels: z
        .object({
          push: z.boolean().optional(),
          email: z.boolean().optional(),
          sms: z.boolean().optional(),
        })
        .optional(),
    })
    .optional(),
});

const unsubscribeSchema = z.object({
  subscriptionId: z.string(),
});

// Initialize push notification service only if valid VAPID keys are configured
// Note: In production, these keys MUST come from environment variables
const VAPID_KEYS =
  process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY
    ? {
        publicKey: process.env.VAPID_PUBLIC_KEY,
        privateKey: process.env.VAPID_PRIVATE_KEY,
      }
    : null;

const pushService = VAPID_KEYS ? new PushNotificationService(VAPID_KEYS) : null;

/**
 * POST /api/notifications/push-subscribe
 * Subscribe user for push notifications
 */
export async function POST(request: NextRequest) {
  try {
    // Check if push service is configured
    if (!pushService || !VAPID_KEYS) {
      return NextResponse.json(
        {
          error:
            "Push notifications not configured. Please set VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY environment variables.",
        },
        { status: 503 }
      );
    }

    // TODO: Add proper authentication when auth system is implemented
    // For now, using mock user for development
    const userId = "mock-user-id";
    const body = await request.json();

    // Validate request body
    const validationResult = subscriptionSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Invalid request data",
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const { subscription, preferences } = validationResult.data;

    // Get user organization
    const userDoc = await getDoc(doc(db, "users", userId));
    if (!userDoc.exists()) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userData = userDoc.data();
    const organizationId = userData.organizationId;

    if (!organizationId) {
      return NextResponse.json({ error: "User not associated with organization" }, { status: 400 });
    }

    // Initialize user for push notifications
    const result = await pushService.initializeUser(
      userId,
      organizationId,
      preferences as UpdateNotificationPreferences
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to subscribe for notifications" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      subscriptionId: result.subscriptionId,
      vapidPublicKey: VAPID_KEYS.publicKey,
    });
  } catch (error) {
    console.error("Error in push subscription API:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * GET /api/notifications/push-subscribe
 * Get current subscription status and preferences
 */
export async function GET(_request: NextRequest) {
  try {
    // TODO: Add proper authentication when auth system is implemented
    // For now, using mock user for development
    const userId = "mock-user-id";
    const organizationId = "mock-organization-id";

    // Get user subscription
    const subscriptionQuery = query(
      collection(db, "notificationSubscriptions"),
      where("userId", "==", userId),
      where("organizationId", "==", organizationId),
      where("isActive", "==", true)
    );

    const subscriptionSnapshot = await getDocs(subscriptionQuery);

    if (subscriptionSnapshot.empty) {
      return NextResponse.json({
        subscribed: false,
        preferences: null,
      });
    }

    const subscriptionData = subscriptionSnapshot.docs[0].data() as NotificationSubscription;

    return NextResponse.json({
      subscribed: true,
      subscriptionId: subscriptionData.id,
      preferences: subscriptionData.preferences,
      deviceInfo: subscriptionData.deviceInfo,
      createdAt: subscriptionData.createdAt,
      updatedAt: subscriptionData.updatedAt,
    });
  } catch (error) {
    console.error("Error getting subscription status:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * PATCH /api/notifications/push-subscribe
 * Update notification preferences
 */
export async function PATCH(request: NextRequest) {
  try {
    // Check if push service is configured
    if (!pushService) {
      return NextResponse.json({ error: "Push notifications not configured" }, { status: 503 });
    }

    // TODO: Add proper authentication when auth system is implemented
    // For now, using mock user for development
    const userId = "mock-user-id";
    const body = await request.json();

    // Validate preferences update
    const preferencesValidation = z
      .object({
        preferences: z.object({
          enabled: z.boolean().optional(),
          priorities: z
            .object({
              LOW: z.boolean().optional(),
              MEDIUM: z.boolean().optional(),
              HIGH: z.boolean().optional(),
              CRITICAL: z.boolean().optional(),
            })
            .optional(),
          types: z
            .object({
              LMRA_STOP_WORK: z.boolean().optional(),
              LMRA_COMPLETED: z.boolean().optional(),
              TRA_APPROVED: z.boolean().optional(),
              TRA_REJECTED: z.boolean().optional(),
              TRA_OVERDUE: z.boolean().optional(),
              SAFETY_INCIDENT: z.boolean().optional(),
              EQUIPMENT_ISSUE: z.boolean().optional(),
              WEATHER_ALERT: z.boolean().optional(),
              SYSTEM_ALERT: z.boolean().optional(),
            })
            .optional(),
          quietHours: z
            .object({
              enabled: z.boolean().optional(),
              start: z
                .string()
                .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
                .optional(),
              end: z
                .string()
                .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
                .optional(),
            })
            .optional(),
          channels: z
            .object({
              push: z.boolean().optional(),
              email: z.boolean().optional(),
              sms: z.boolean().optional(),
            })
            .optional(),
        }),
      })
      .safeParse(body);

    if (!preferencesValidation.success) {
      return NextResponse.json(
        {
          error: "Invalid preferences data",
          details: preferencesValidation.error.issues,
        },
        { status: 400 }
      );
    }

    const { preferences } = preferencesValidation.data;

    // TODO: Get user organization when auth system is implemented
    // For now, using mock organization for development
    const organizationId = "mock-organization-id";

    // Update preferences
    const result = await pushService.updatePreferences(
      userId,
      organizationId,
      preferences as UpdateNotificationPreferences
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to update preferences" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Preferences updated successfully",
    });
  } catch (error) {
    console.error("Error updating notification preferences:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * DELETE /api/notifications/push-subscribe
 * Unsubscribe from push notifications
 */
export async function DELETE(request: NextRequest) {
  try {
    // Check if push service is configured
    if (!pushService) {
      return NextResponse.json({ error: "Push notifications not configured" }, { status: 503 });
    }

    // TODO: Add proper authentication when auth system is implemented
    // For now, using mock user for development
    const userId = "mock-user-id";
    const body = await request.json();

    // Validate request body
    const validationResult = unsubscribeSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Invalid request data",
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const { subscriptionId } = validationResult.data;

    // Get user organization
    const userDoc = await getDoc(doc(db, "users", userId));
    if (!userDoc.exists()) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userData = userDoc.data();
    const organizationId = userData.organizationId;

    if (!organizationId) {
      return NextResponse.json({ error: "User not associated with organization" }, { status: 400 });
    }

    // Unsubscribe user
    const result = await pushService.unsubscribeUser(userId, organizationId);

    if (!result.success) {
      return NextResponse.json({ error: result.error || "Failed to unsubscribe" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Successfully unsubscribed from push notifications",
    });
  } catch (error) {
    console.error("Error unsubscribing from push notifications:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
