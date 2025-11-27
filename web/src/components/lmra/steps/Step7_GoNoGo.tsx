"use client";

import React, { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { CheckCircle, XCircle, Clock, AlertTriangle, FileText } from "lucide-react";
import { LMRAStep7_GoNoGo, GoNoGoDecision, LMRA } from "@/lib/types/lmra";

type Props = {
  lmra?: Partial<LMRA>;
  onChange: (stepPayload: Partial<LMRAStep7_GoNoGo>) => void;
};

export default function Step7_GoNoGo({ lmra, onChange }: Props) {
  const t = useTranslations("safety.lmra.steps.step7");

  const DECISION_OPTIONS: {
    value: GoNoGoDecision;
    label: string;
    description: string;
    icon: React.ComponentType<any>;
    color: string;
  }[] = [
    {
      value: "go",
      label: t("decisions.go.label"),
      description: t("decisions.go.description"),
      icon: CheckCircle,
      color: "green",
    },
    {
      value: "no_go",
      label: t("decisions.no_go.label"),
      description: t("decisions.no_go.description"),
      icon: XCircle,
      color: "red",
    },
    {
      value: "pending",
      label: t("decisions.pending.label"),
      description: t("decisions.pending.description"),
      icon: Clock,
      color: "yellow",
    },
  ];
  const current = lmra?.step7;
  const [decision, setDecision] = useState<GoNoGoDecision>(current?.decision || "pending");
  const [reason, setReason] = useState(current?.reason || "");
  const [mitigationRequired, setMitigationRequired] = useState(
    current?.mitigationRequired || false
  );
  const [mitigationNotes, setMitigationNotes] = useState(current?.mitigationNotes || "");

  const updateStep = useCallback(
    (
      newDecision: GoNoGoDecision,
      newReason: string,
      newMitigationRequired: boolean,
      newMitigationNotes: string
    ) => {
      onChange({
        decision: newDecision,
        decidedAt: new Date(),
        reason: newReason || undefined,
        mitigationRequired: newMitigationRequired,
        mitigationNotes: newMitigationNotes || undefined,
      });
    },
    [onChange]
  );

  const handleDecisionChange = (newDecision: GoNoGoDecision) => {
    setDecision(newDecision);
    updateStep(newDecision, reason, mitigationRequired, mitigationNotes);
  };

  const handleReasonChange = (value: string) => {
    setReason(value);
    updateStep(decision, value, mitigationRequired, mitigationNotes);
  };

  const handleMitigationRequiredChange = (value: boolean) => {
    setMitigationRequired(value);
    updateStep(decision, reason, value, mitigationNotes);
  };

  const handleMitigationNotesChange = (value: string) => {
    setMitigationNotes(value);
    updateStep(decision, reason, mitigationRequired, value);
  };

  const selectedOption = DECISION_OPTIONS.find((opt) => opt.value === decision);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{t("title")}</h3>
        <p className="text-sm text-gray-600">{t("description")}</p>
      </div>

      {/* Decision Status */}
      {decision !== "pending" && (
        <div
          className={`rounded-lg border-2 p-4 ${
            decision === "go" ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"
          }`}
        >
          <div className="flex items-start gap-3">
            {decision === "go" ? (
              <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
            ) : (
              <XCircle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <h4
                className={`font-medium mb-1 ${
                  decision === "go" ? "text-green-900" : "text-red-900"
                }`}
              >
                {decision === "go"
                  ? t("decisionStatus.workMayStart")
                  : t("decisionStatus.workMayNotStart")}
              </h4>
              <p className={`text-sm ${decision === "go" ? "text-green-700" : "text-red-700"}`}>
                {decision === "go"
                  ? t("decisionStatus.allChecksCompleted")
                  : t("decisionStatus.issuesMustBeResolved")}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Decision Options */}
      <div className="space-y-3">
        <h4 className="font-medium text-gray-900">{t("selectDecision")} *</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {DECISION_OPTIONS.map((option) => {
            const Icon = option.icon;
            const isSelected = decision === option.value;

            return (
              <button
                key={option.value}
                onClick={() => handleDecisionChange(option.value)}
                className={`relative rounded-lg border-2 p-4 text-left transition-all ${
                  isSelected
                    ? option.color === "green"
                      ? "border-green-500 bg-green-50"
                      : option.color === "red"
                        ? "border-red-500 bg-red-50"
                        : "border-yellow-500 bg-yellow-50"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`rounded-full p-2 ${
                      isSelected
                        ? option.color === "green"
                          ? "bg-green-100"
                          : option.color === "red"
                            ? "bg-red-100"
                            : "bg-yellow-100"
                        : "bg-gray-100"
                    }`}
                  >
                    <Icon
                      className={`h-5 w-5 ${
                        isSelected
                          ? option.color === "green"
                            ? "text-green-600"
                            : option.color === "red"
                              ? "text-red-600"
                              : "text-yellow-600"
                          : "text-gray-400"
                      }`}
                    />
                  </div>
                  <div className="flex-1">
                    <h5
                      className={`font-medium text-sm mb-1 ${
                        isSelected ? "text-gray-900" : "text-gray-700"
                      }`}
                    >
                      {option.label}
                    </h5>
                    <p className="text-xs text-gray-600">{option.description}</p>
                  </div>
                </div>
                {isSelected && (
                  <div className="absolute top-2 right-2">
                    <CheckCircle
                      className={`h-5 w-5 ${
                        option.color === "green"
                          ? "text-green-600"
                          : option.color === "red"
                            ? "text-red-600"
                            : "text-yellow-600"
                      }`}
                    />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Reason */}
      <div>
        <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-2">
          {t("reason.label")} *
        </label>
        <textarea
          id="reason"
          value={reason}
          onChange={(e) => handleReasonChange(e.target.value)}
          rows={4}
          placeholder={
            decision === "go"
              ? t("reason.placeholderGo")
              : decision === "no_go"
                ? t("reason.placeholderNoGo")
                : t("reason.placeholderPending")
          }
          className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0"
        />
        <p className="mt-1 text-xs text-gray-500">{t("reason.helpText")}</p>
      </div>

      {/* Mitigation Required */}
      {decision === "no_go" && (
        <div className="space-y-4 rounded-lg border border-orange-200 bg-orange-50 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h5 className="font-medium text-orange-900 mb-2">{t("mitigation.title")}</h5>
              <div className="space-y-3">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={mitigationRequired}
                    onChange={(e) => handleMitigationRequiredChange(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-orange-800">{t("mitigation.required")}</span>
                </label>

                {mitigationRequired && (
                  <div>
                    <label
                      htmlFor="mitigationNotes"
                      className="block text-sm font-medium text-orange-900 mb-1"
                    >
                      {t("mitigation.describe")}
                    </label>
                    <textarea
                      id="mitigationNotes"
                      value={mitigationNotes}
                      onChange={(e) => handleMitigationNotesChange(e.target.value)}
                      rows={3}
                      placeholder={t("mitigation.placeholder")}
                      className="w-full rounded-lg border border-orange-300 px-3 py-2 text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-500 focus:ring-offset-0"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Decision Summary */}
      {decision !== "pending" && reason && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <div className="flex items-start gap-3">
            <FileText className="h-5 w-5 text-gray-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h5 className="font-medium text-gray-900 mb-2">{t("summary.title")}</h5>
              <div className="space-y-2 text-sm text-gray-700">
                <div>
                  <span className="font-medium">{t("summary.decision")}</span>{" "}
                  <span
                    className={`font-semibold ${
                      decision === "go" ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {selectedOption?.label}
                  </span>
                </div>
                <div>
                  <span className="font-medium">{t("summary.reason")}</span>
                  <p className="mt-1 text-gray-600">{reason}</p>
                </div>
                {mitigationRequired && mitigationNotes && (
                  <div>
                    <span className="font-medium text-orange-600">
                      {t("summary.requiredMeasures")}
                    </span>
                    <p className="mt-1 text-gray-600">{mitigationNotes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
        <h4 className="font-medium text-blue-900 mb-2 text-sm">{t("infoBox.title")}</h4>
        <div className="space-y-2 text-sm text-blue-800">
          <p className="font-medium">{t("infoBox.chooseGo")}</p>
          <ul className="space-y-1 ml-4">
            <li>• {t("infoBox.goItem1")}</li>
            <li>• {t("infoBox.goItem2")}</li>
            <li>• {t("infoBox.goItem3")}</li>
            <li>• {t("infoBox.goItem4")}</li>
            <li>• {t("infoBox.goItem5")}</li>
          </ul>
          <p className="font-medium mt-3">{t("infoBox.chooseNoGo")}</p>
          <ul className="space-y-1 ml-4">
            <li>• {t("infoBox.noGoItem1")}</li>
            <li>• {t("infoBox.noGoItem2")}</li>
            <li>• {t("infoBox.noGoItem3")}</li>
            <li>• {t("infoBox.noGoItem4")}</li>
            <li>• {t("infoBox.noGoItem5")}</li>
          </ul>
        </div>
      </div>

      {/* Warning for NO-GO */}
      {decision === "no_go" && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-medium text-red-900 mb-1">{t("warning.title")}</h4>
              <p className="text-sm text-red-700">{t("warning.message")}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
