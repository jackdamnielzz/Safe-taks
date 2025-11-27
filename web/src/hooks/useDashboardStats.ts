import { useState, useEffect } from "react";
import { collection, query, where, getDocs, orderBy, limit, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/components/AuthProvider";

export interface DashboardStats {
  activeTras: number;
  completedLmras: number;
  inReview: number;
  actionRequired: number;
  recentActivity: ActivityItem[];
  trends: {
    tra: number;
    lmra: number;
    review: number;
    action: number;
  };
  chartData: {
    tra: { value: number }[];
    lmra: { value: number }[];
    review: { value: number }[];
    action: { value: number }[];
  };
}

export interface ActivityItem {
  id: string;
  type: "tra_approved" | "lmra_completed" | "tra_created" | "incident_reported";
  title: string;
  description: string;
  timestamp: string;
  user: string;
  rawTimestamp: Date;
}

export function useDashboardStats() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      // @ts-expect-error - organizationId exists on user object but type definition might be missing
      if (!user?.organizationId) {
        // Defensive: avoid leaving the hook in a perpetual loading state when orgId is missing.
        console.warn("useDashboardStats: missing organizationId on user, skipping stats fetch", { user });
        setLoading(false);
        return;
      }

      try {
        // @ts-expect-error - organizationId exists on user object but type definition might be missing
        const orgId = user.organizationId;
        const now = new Date();
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        // 1. Active TRAs
        const activeTrasQuery = query(
          collection(db, "tras"),
          where("organizationId", "==", orgId),
          where("status", "in", ["draft", "submitted"])
        );
        const activeTrasSnapshot = await getDocs(activeTrasQuery);
        const activeTrasCount = activeTrasSnapshot.size;

        // 2. Completed LMRAs (Last 7 days)
        const completedLmrasQuery = query(
          collection(db, "lmras"),
          where("organizationId", "==", orgId),
          where("status", "==", "completed"),
          where("completedAt", ">=", Timestamp.fromDate(sevenDaysAgo))
        );
        const completedLmrasSnapshot = await getDocs(completedLmrasQuery);
        const completedLmrasCount = completedLmrasSnapshot.size;

        // 3. In Review
        const inReviewQuery = query(
          collection(db, "tras"),
          where("organizationId", "==", orgId),
          where("status", "==", "submitted")
        );
        const inReviewSnapshot = await getDocs(inReviewQuery);
        const inReviewCount = inReviewSnapshot.size;

        // 4. Action Required (e.g., rejected TRAs or high-risk items - simplified for now)
        const actionRequiredQuery = query(
          collection(db, "tras"),
          where("organizationId", "==", orgId),
          where("status", "==", "rejected")
        );
        const actionRequiredSnapshot = await getDocs(actionRequiredQuery);
        const actionRequiredCount = actionRequiredSnapshot.size;

        // 5. Recent Activity (Mocked for now, replace with real Audit Logs later)
        // In a real app, you'd query a dedicated 'activities' or 'audit_logs' collection
        const mockActivity: ActivityItem[] = [
          {
            id: "1",
            type: "tra_approved",
            title: "TRA Goedgekeurd",
            description: "TRA-001 'Dakwerkzaamheden' is goedgekeurd",
            timestamp: "2 uur geleden",
            user: "Jan Jansen",
            rawTimestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
          },
          {
            id: "2",
            type: "lmra_completed",
            title: "LMRA Voltooid",
            description: "LMRA uitgevoerd voor Project Alpha",
            timestamp: "4 uur geleden",
            user: "Piet Pietersen",
            rawTimestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
          },
        ];

        // 6. Chart Data (Mocked for now to show sparklines)
        // In production, you'd aggregate this via a Cloud Function or specialized query
        const mockChartData = {
          tra: Array.from({ length: 7 }, () => ({ value: Math.floor(Math.random() * 20) })),
          lmra: Array.from({ length: 7 }, () => ({ value: Math.floor(Math.random() * 15) })),
          review: Array.from({ length: 7 }, () => ({ value: Math.floor(Math.random() * 5) })),
          action: Array.from({ length: 7 }, () => ({ value: Math.floor(Math.random() * 3) })),
        };

        setStats({
          activeTras: activeTrasCount,
          completedLmras: completedLmrasCount,
          inReview: inReviewCount,
          actionRequired: actionRequiredCount,
          recentActivity: mockActivity,
          trends: {
            tra: 12, // Mock trend percentage
            lmra: 8,
            review: -5,
            action: 0,
          },
          chartData: mockChartData,
        });
      } catch (err) {
        console.error("Error fetching dashboard stats:", err);
        setError("Kon dashboard statistieken niet laden");
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, [user]);

  return { stats, loading, error };
}