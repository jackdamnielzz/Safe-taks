'use client';

import React, { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ApprovalRequest } from '@/types/approval';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Badge } from '@/components/ui/Badge';
import Link from 'next/link';

export default function ApprovalInbox() {
  const t = useTranslations();
  const [loading, setLoading] = useState(true);
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        const res = await fetch('/api/approvals');
        if (!res.ok) throw new Error('Failed to load approvals');
        const data = await res.json();
        if (mounted) setApprovals(data || []);
      } catch (e: any) {
        console.error(e);
        if (mounted) setError(e?.message || 'Unknown error');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return <div className="text-red-600 p-4">Error: {error}</div>;
  }

  if (!approvals.length) {
    return <div className="p-4 text-sm text-gray-600">{t('approvals.inbox.empty', { default: 'Geen goedkeuringen in afwachting' })}</div>;
  }

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold">{t('approvals.inbox.title', { default: 'Goedkeuringsverzoeken' })}</h3>

      <ul className="space-y-2">
        {approvals.map((a) => (
          <li key={a.id} className="rounded border p-3 bg-white flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-900">
                TRA: {a.traId} — {a.metadata?.title || ''}
              </div>
              <div className="text-sm text-gray-600">
                {a.steps?.length} stappen • Huidige stap: {a.currentStep}
              </div>
              <div className="mt-2 text-xs">
                {a.status === 'pending' ? <Badge variant="warning">Pending</Badge> : <Badge variant="default">{a.status}</Badge>}
                <span className="ml-2 text-gray-500">{new Date(a.createdAt).toLocaleString()}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link href={`/approvals/${a.id}`} className="rounded border px-3 py-1 text-sm hover:bg-gray-50">
                {t('approvals.inbox.view', { default: 'Open' })}
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
