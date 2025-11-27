"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, FileText, Calendar, User } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import ApprovalDecisionPanel from "@/components/approvals/ApprovalDecisionPanel";
import type { ApprovalRequest } from "@/types/approval";

function ApprovalDetailClient({ approvalId }: { approvalId: string }) {
  const [approval, setApproval] = useState<ApprovalRequest | null>(null);
  const [tra, setTra] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);

        // Fetch approval
        const approvalRes = await fetch(`/api/approvals/${approvalId}`);
        if (!approvalRes.ok) {
          if (approvalRes.status === 404) {
            throw new Error("Goedkeuring niet gevonden");
          }
          throw new Error("Fout bij ophalen goedkeuring");
        }
        const approvalData = await approvalRes.json();
        setApproval(approvalData);

        // Fetch associated TRA
        if (approvalData.traId) {
          const traRes = await fetch(`/api/tras/${approvalData.traId}`);
          if (traRes.ok) {
            const traData = await traRes.json();
            setTra(traData);
          }
        }
      } catch (e: any) {
        console.error("Error fetching approval:", e);
        setError(e?.message || "Onbekende fout");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [approvalId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !approval) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6">
        <p className="text-red-800">{error || "Goedkeuring niet gevonden"}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/approvals"
          className="mb-4 inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Terug naar goedkeuringen
        </Link>

        <h1 className="text-3xl font-bold text-gray-900">Goedkeuringsdetails</h1>
      </div>

      {/* TRA Information Card */}
      {tra && (
        <div className="rounded-lg border bg-white p-6">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{tra.title || "Geen titel"}</h2>
              <p className="mt-1 text-sm text-gray-600">{tra.description}</p>
            </div>
            <Link
              href={`/tras/${tra.id}`}
              className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm hover:bg-gray-50"
            >
              <FileText className="h-4 w-4" />
              Bekijk TRA
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-gray-500">Aangemaakt door</p>
                <p className="font-medium text-gray-900">
                  {approval.metadata?.createdByName || "Onbekend"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-gray-500">Aangemaakt op</p>
                <p className="font-medium text-gray-900">
                  {new Date(approval.createdAt).toLocaleDateString("nl-NL")}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <FileText className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-gray-500">Status</p>
                <p className="font-medium text-gray-900">{tra.status}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Approval Decision Panel */}
      <ApprovalDecisionPanel approval={approval} />
    </div>
  );
}

export default function ApprovalDetailPage({
  params,
}: {
  params: Promise<{ approvalId: string }>;
}) {
  // Note: This is now a client component that handles everything
  return <ApprovalDetailClient approvalId={""} />;
}
