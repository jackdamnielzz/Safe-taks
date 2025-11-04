'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import type { ApprovalRequest, ApprovalStep } from '@/types/approval';
import { CheckCircle, XCircle, MessageSquare } from 'lucide-react';

interface ApprovalDecisionPanelProps {
  approval: ApprovalRequest;
  onDecision?: (action: 'approve' | 'reject' | 'request_changes', comments?: string) => Promise<void>;
  disabled?: boolean;
}

export default function ApprovalDecisionPanel({
  approval,
  onDecision,
  disabled = false,
}: ApprovalDecisionPanelProps) {
  const t = useTranslations();
  const [action, setAction] = useState<'approve' | 'reject' | 'request_changes' | null>(null);
  const [comments, setComments] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentStep = approval.steps.find((s) => s.step === approval.currentStep);
  const isComplete = approval.status === 'approved' || approval.status === 'rejected';

  const handleSubmit = async () => {
    if (!action) return;

    setSubmitting(true);
    setError(null);

    try {
      if (onDecision) {
        await onDecision(action, comments);
      } else {
        // Default: call API
        const response = await fetch(`/api/approvals/${approval.id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action,
            comments: comments || null,
            step: approval.currentStep,
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to process approval');
        }

        // Reload page to show updated state
        window.location.reload();
      }
    } catch (e: any) {
      console.error('Approval decision error:', e);
      setError(e?.message || 'Unknown error');
    } finally {
      setSubmitting(false);
    }
  };

  const getStepStatusBadge = (step: ApprovalStep) => {
    switch (step.status) {
      case 'approved':
        return <Badge variant="success">{t('approvals.status.approved', { default: 'Goedgekeurd' })}</Badge>;
      case 'rejected':
        return <Badge variant="error">{t('approvals.status.rejected', { default: 'Afgewezen' })}</Badge>;
      case 'pending':
        return <Badge variant="warning">{t('approvals.status.pending', { default: 'In afwachting' })}</Badge>;
      default:
        return <Badge variant="default">{step.status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Approval Steps Overview */}
      <div className="rounded-lg border bg-white p-6">
        <h3 className="mb-4 text-lg font-semibold">
          {t('approvals.steps.title', { default: 'Goedkeuringsstappen' })}
        </h3>

        <div className="space-y-3">
          {approval.steps.map((step, index) => (
            <div
              key={step.step}
              className={`rounded-lg border p-4 ${
                step.step === approval.currentStep && !isComplete
                  ? 'border-blue-500 bg-blue-50'
                  : 'bg-gray-50'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {t('approvals.steps.stepNumber', { default: 'Stap {number}', number: step.step })}
                    </span>
                    {getStepStatusBadge(step)}
                    {step.step === approval.currentStep && !isComplete && (
                      <Badge variant="info">{t('approvals.steps.current', { default: 'Huidige stap' })}</Badge>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-gray-700">{step.name}</p>
                  <p className="mt-1 text-xs text-gray-500">
                    {t('approvals.steps.role', { default: 'Rol: {role}', role: step.approverRole })}
                  </p>

                  {step.decidedBy && (
                    <div className="mt-2 text-xs text-gray-600">
                      {step.status === 'approved'
                        ? t('approvals.steps.approvedBy', { default: 'Goedgekeurd door' })
                        : t('approvals.steps.rejectedBy', { default: 'Afgewezen door' })}{' '}
                      {step.decidedBy}
                      {step.decidedAt && (
                        <span className="ml-2">
                          {new Date(step.decidedAt).toLocaleString('nl-NL')}
                        </span>
                      )}
                    </div>
                  )}

                  {step.comments && (
                    <div className="mt-2 rounded bg-white p-2 text-sm">
                      <p className="font-medium text-gray-700">
                        {t('approvals.steps.comments', { default: 'Opmerkingen:' })}
                      </p>
                      <p className="text-gray-600">{step.comments}</p>
                    </div>
                  )}

                  {step.dueDate && (
                    <p className="mt-1 text-xs text-gray-500">
                      {t('approvals.steps.dueDate', { default: 'Deadline: {date}', date: new Date(step.dueDate).toLocaleDateString('nl-NL') })}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Decision Panel - Only show if current step is pending */}
      {!isComplete && currentStep && currentStep.status === 'pending' && !disabled && (
        <div className="rounded-lg border bg-white p-6">
          <h3 className="mb-4 text-lg font-semibold">
            {t('approvals.decision.title', { default: 'Uw beslissing' })}
          </h3>

          {!action ? (
            <div className="grid gap-3 sm:grid-cols-3">
              <button
                onClick={() => setAction('approve')}
                className="flex items-center justify-center gap-2 rounded-lg border-2 border-green-500 bg-green-50 p-4 text-green-700 transition hover:bg-green-100"
              >
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">
                  {t('approvals.decision.approve', { default: 'Goedkeuren' })}
                </span>
              </button>

              <button
                onClick={() => setAction('request_changes')}
                className="flex items-center justify-center gap-2 rounded-lg border-2 border-yellow-500 bg-yellow-50 p-4 text-yellow-700 transition hover:bg-yellow-100"
              >
                <MessageSquare className="h-5 w-5" />
                <span className="font-medium">
                  {t('approvals.decision.requestChanges', { default: 'Wijzigingen vragen' })}
                </span>
              </button>

              <button
                onClick={() => setAction('reject')}
                className="flex items-center justify-center gap-2 rounded-lg border-2 border-red-500 bg-red-50 p-4 text-red-700 transition hover:bg-red-100"
              >
                <XCircle className="h-5 w-5" />
                <span className="font-medium">
                  {t('approvals.decision.reject', { default: 'Afwijzen' })}
                </span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-lg bg-gray-50 p-4">
                <p className="font-medium">
                  {action === 'approve' && t('approvals.decision.confirmApprove', { default: 'U staat op het punt deze TRA goed te keuren' })}
                  {action === 'reject' && t('approvals.decision.confirmReject', { default: 'U staat op het punt deze TRA af te wijzen' })}
                  {action === 'request_changes' && t('approvals.decision.confirmRequestChanges', { default: 'U vraagt wijzigingen aan deze TRA' })}
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  {t('approvals.decision.commentsLabel', { default: 'Opmerkingen' })}
                  {action === 'reject' && <span className="text-red-500"> *</span>}
                </label>
                <textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  rows={4}
                  className="w-full rounded-lg border border-gray-300 p-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={t('approvals.decision.commentsPlaceholder', { default: 'Voeg uw opmerkingen toe...' })}
                  required={action === 'reject'}
                />
              </div>

              {error && (
                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  onClick={handleSubmit}
                  disabled={submitting || (action === 'reject' && !comments.trim())}
                  variant={action === 'approve' ? 'primary' : action === 'reject' ? 'danger' : 'primary'}
                >
                  {submitting
                    ? t('approvals.decision.submitting', { default: 'Bezig...' })
                    : t('approvals.decision.submit', { default: 'Bevestigen' })}
                </Button>
                <Button
                  onClick={() => {
                    setAction(null);
                    setComments('');
                    setError(null);
                  }}
                  variant="outline"
                  disabled={submitting}
                >
                  {t('approvals.decision.cancel', { default: 'Annuleren' })}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Completed Status */}
      {isComplete && (
        <div className={`rounded-lg p-6 ${approval.status === 'approved' ? 'bg-green-50' : 'bg-red-50'}`}>
          <div className="flex items-center gap-3">
            {approval.status === 'approved' ? (
              <CheckCircle className="h-6 w-6 text-green-600" />
            ) : (
              <XCircle className="h-6 w-6 text-red-600" />
            )}
            <div>
              <p className={`font-semibold ${approval.status === 'approved' ? 'text-green-900' : 'text-red-900'}`}>
                {approval.status === 'approved'
                  ? t('approvals.status.fullyApproved', { default: 'TRA volledig goedgekeurd' })
                  : t('approvals.status.fullyRejected', { default: 'TRA afgewezen' })}
              </p>
              <p className={`text-sm ${approval.status === 'approved' ? 'text-green-700' : 'text-red-700'}`}>
                {approval.status === 'approved'
                  ? t('approvals.status.approvedMessage', { default: 'Alle goedkeuringsstappen zijn voltooid' })
                  : t('approvals.status.rejectedMessage', { default: 'Deze TRA moet worden herzien en opnieuw ingediend' })}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}