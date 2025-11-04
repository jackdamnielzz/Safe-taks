'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { TraTemplate, Hazard, calculateRiskScore } from '@/types/tra-template';
import { Badge } from '@/components/ui/Badge';
import { AlertTriangle, CheckCircle, Users, BookOpen, Shield } from 'lucide-react';

interface TemplatePreviewProps {
  template: TraTemplate;
  onUseTemplate?: () => void;
}

export default function TemplatePreview({ template, onUseTemplate }: TemplatePreviewProps) {
  const t = useTranslations();

  const getRiskColor = (score: number): string => {
    if (score >= 400) return 'bg-red-100 text-red-800 border-red-300';
    if (score >= 200) return 'bg-orange-100 text-orange-800 border-orange-300';
    if (score >= 70) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    if (score >= 20) return 'bg-blue-100 text-blue-800 border-blue-300';
    return 'bg-green-100 text-green-800 border-green-300';
  };

  const getRiskLabel = (score: number): string => {
    if (score >= 400) return t('templates.preview.riskVeryHigh');
    if (score >= 200) return t('templates.preview.riskHigh');
    if (score >= 70) return t('templates.preview.riskSubstantial');
    if (score >= 20) return t('templates.preview.riskPossible');
    return 'templates.preview.riskLow';
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 pb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{template.name}</h1>
            <p className="mt-2 text-gray-600">{template.description}</p>
          </div>
          {template.vcaCompliant && (
            <Badge variant="success" className="flex-shrink-0">
              {template.vcaVersion}
            </Badge>
          )}
        </div>
        <div className="mt-4 flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-gray-400" />
            <span className="text-sm text-gray-600">{template.industry}</span>
          </div>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-gray-400" />
            <span className="text-sm text-gray-600">
              {template.hazards.length} {t('templates.preview.hazards')}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-gray-400" />
            <span className="text-sm text-gray-600">
              {template.steps.length} {t('templates.preview.steps')}
            </span>
          </div>
        </div>
      </div>

      <section>
        <h2 className="mb-4 text-xl font-semibold text-gray-900">
          {t('templates.preview.taskSteps')}
        </h2>
        <div className="space-y-3">
          {template.steps.map((step, index) => (
            <div key={index} className="flex gap-4 rounded-lg border border-gray-200 bg-white p-4">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
                {step.order}
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">{step.title}</h3>
                <p className="mt-1 text-sm text-gray-600">{step.description}</p>
                <div className="mt-2 flex gap-4 text-xs text-gray-500">
                  <span>⏱️ {step.duration} min</span>
                  <span>👥 {step.requiredPersonnel} personen</span>
                  <span>📍 {step.location}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold text-gray-900">
          {t('templates.preview.hazards')}
        </h2>
        <div className="space-y-3">
          {template.hazards.map((hazard, index) => (
            <HazardCard key={index} hazard={hazard} />
          ))}
        </div>
      </section>

      {template.requiredCompetencies && template.requiredCompetencies.length > 0 && (
        <section>
          <h2 className="mb-4 text-xl font-semibold text-gray-900">
            {t('templates.preview.requiredCompetencies')}
          </h2>
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <div className="flex items-start gap-3">
              <Users className="mt-1 h-5 w-5 flex-shrink-0 text-blue-600" />
              <div className="flex-1">
                <ul className="space-y-2">
                  {template.requiredCompetencies.map((competency, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm text-gray-700">
                      <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                      {competency}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>
      )}

      {template.notes && (
        <section>
          <h2 className="mb-4 text-xl font-semibold text-gray-900">
            {t('templates.preview.notes')}
          </h2>
          <div className="rounded-lg border border-gray-200 bg-blue-50 p-4">
            <p className="text-sm text-gray-700">{template.notes}</p>
          </div>
        </section>
      )}

      {onUseTemplate && (
        <div className="border-t border-gray-200 pt-6">
          <button
            onClick={onUseTemplate}
            className="w-full rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            {t('templates.preview.useTemplate')}
          </button>
        </div>
      )}
    </div>
  );
}

interface HazardCardProps {
  hazard: Hazard;
}

function HazardCard({ hazard }: HazardCardProps) {
  const t = useTranslations();
  const riskScore = calculateRiskScore(
    hazard.typicalEffect,
    hazard.typicalExposure,
    hazard.typicalProbability
  );

  const getRiskColor = (score: number): string => {
    if (score >= 400) return 'bg-red-100 text-red-800 border-red-300';
    if (score >= 200) return 'bg-orange-100 text-orange-800 border-orange-300';
    if (score >= 70) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    if (score >= 20) return 'bg-blue-100 text-blue-800 border-blue-300';
    return 'bg-green-100 text-green-800 border-green-300';
  };

  const getRiskLabel = (level: string): string => {
    const labels: Record<string, string> = {
      very_high: t('templates.preview.riskVeryHigh'),
      high: t('templates.preview.riskHigh'),
      substantial: t('templates.preview.riskSubstantial'),
      possible: t('templates.preview.riskPossible'),
      low: t('templates.preview.riskLow'),
    };
    return labels[level] || level;
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-medium text-gray-900">{hazard.name}</h3>
          <p className="mt-1 text-sm text-gray-600">{hazard.description}</p>
        </div>
        <div
          className={`ml-4 flex flex-shrink-0 flex-col items-center rounded-lg border px-3 py-2 text-center ${getRiskColor(riskScore.score)}`}
        >
          <div className="text-lg font-bold">{Math.round(riskScore.score)}</div>
          <div className="text-xs font-medium">{getRiskLabel(riskScore.level)}</div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
        <div className="rounded bg-gray-50 p-2">
          <div className="font-semibold text-gray-700">{t('templates.preview.effect')}</div>
          <div className="text-gray-600">{hazard.typicalEffect}</div>
        </div>
        <div className="rounded bg-gray-50 p-2">
          <div className="font-semibold text-gray-700">{t('templates.preview.exposure')}</div>
          <div className="text-gray-600">{hazard.typicalExposure}</div>
        </div>
        <div className="rounded bg-gray-50 p-2">
          <div className="font-semibold text-gray-700">{t('templates.preview.probability')}</div>
          <div className="text-gray-600">{hazard.typicalProbability}</div>
        </div>
      </div>

      {hazard.controlMeasures && hazard.controlMeasures.length > 0 && (
        <div className="mt-3 border-t border-gray-200 pt-3">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-gray-700">
            <Shield className="h-4 w-4" />
            {t('templates.preview.controlMeasures')}:
          </div>
          <ul className="space-y-2">
            {hazard.controlMeasures.map((measure, index) => (
              <li key={index} className="text-xs text-gray-600">
                <div className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-green-600" />
                  <div className="flex-1">
                    <div>{measure.description}</div>
                    <div className="mt-1 flex gap-2 text-xs text-gray-500">
                      <Badge variant="secondary" size="sm">
                        {t(`templates.preview.hierarchy.${measure.type}`)}
                      </Badge>
                      <span>👤 {measure.responsible}</span>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
