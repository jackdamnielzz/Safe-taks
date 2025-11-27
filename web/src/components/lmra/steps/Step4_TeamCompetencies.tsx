"use client";

import React, { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Users, Plus, Trash2, CheckCircle, AlertCircle, Award } from "lucide-react";
import {
  LMRAStep4_TeamCompetencies,
  TeamMemberCompetency,
  CompetencyLevel,
  LMRA,
} from "@/lib/types/lmra";

type Props = {
  lmra?: Partial<LMRA>;
  onChange: (stepPayload: Partial<LMRAStep4_TeamCompetencies>) => void;
};

export default function Step4_TeamCompetencies({ lmra, onChange }: Props) {
  const t = useTranslations("safety.lmra.steps.step4");
  const current = lmra?.step4;
  const [teamMembers, setTeamMembers] = useState<TeamMemberCompetency[]>(
    current?.teamMembers || []
  );
  const [requiredCompetencies, setRequiredCompetencies] = useState<string[]>(
    current?.requiredCompetencies || []
  );
  const [notes, setNotes] = useState(current?.notes || "");
  const [newCompetency, setNewCompetency] = useState("");

  const COMPETENCY_LEVELS: { value: CompetencyLevel; label: string; color: string }[] = [
    { value: "certified", label: t("competencyLevels.certified"), color: "green" },
    { value: "trained", label: t("competencyLevels.trained"), color: "blue" },
    { value: "supervised", label: t("competencyLevels.supervised"), color: "yellow" },
    { value: "not_qualified", label: t("competencyLevels.not_qualified"), color: "red" },
  ];

  const updateStep = useCallback(
    (members: TeamMemberCompetency[], competencies: string[], stepNotes: string) => {
      const allQualified = members.every(
        (m) => m.competencyLevel === "certified" || m.competencyLevel === "trained"
      );

      onChange({
        teamMembers: members,
        requiredCompetencies: competencies,
        allQualified,
        notes: stepNotes || undefined,
      });
    },
    [onChange]
  );

  const handleAddMember = () => {
    const newMember: TeamMemberCompetency = {
      userId: `temp-${Date.now()}`,
      displayName: "",
      competencyLevel: "not_qualified",
      certifications: [],
      notes: "",
    };
    const updated = [...teamMembers, newMember];
    setTeamMembers(updated);
    updateStep(updated, requiredCompetencies, notes);
  };

  const handleRemoveMember = (index: number) => {
    const updated = teamMembers.filter((_, i) => i !== index);
    setTeamMembers(updated);
    updateStep(updated, requiredCompetencies, notes);
  };

  const handleUpdateMember = (index: number, field: keyof TeamMemberCompetency, value: any) => {
    const updated = teamMembers.map((member, i) => {
      if (i === index) {
        return { ...member, [field]: value };
      }
      return member;
    });
    setTeamMembers(updated);
    updateStep(updated, requiredCompetencies, notes);
  };

  const handleAddCertification = (memberIndex: number, cert: string) => {
    if (!cert.trim()) return;

    const updated = teamMembers.map((member, i) => {
      if (i === memberIndex) {
        const certs = member.certifications || [];
        return { ...member, certifications: [...certs, cert.trim()] };
      }
      return member;
    });
    setTeamMembers(updated);
    updateStep(updated, requiredCompetencies, notes);
  };

  const handleRemoveCertification = (memberIndex: number, certIndex: number) => {
    const updated = teamMembers.map((member, i) => {
      if (i === memberIndex) {
        const certs = (member.certifications || []).filter((_, ci) => ci !== certIndex);
        return { ...member, certifications: certs };
      }
      return member;
    });
    setTeamMembers(updated);
    updateStep(updated, requiredCompetencies, notes);
  };

  const handleAddRequiredCompetency = () => {
    if (!newCompetency.trim()) return;
    const updated = [...requiredCompetencies, newCompetency.trim()];
    setRequiredCompetencies(updated);
    setNewCompetency("");
    updateStep(teamMembers, updated, notes);
  };

  const handleRemoveRequiredCompetency = (index: number) => {
    const updated = requiredCompetencies.filter((_, i) => i !== index);
    setRequiredCompetencies(updated);
    updateStep(teamMembers, updated, notes);
  };

  const handleNotesChange = (value: string) => {
    setNotes(value);
    updateStep(teamMembers, requiredCompetencies, value);
  };

  const allQualified = teamMembers.every(
    (m) => m.competencyLevel === "certified" || m.competencyLevel === "trained"
  );

  const getCompetencyColor = (level: CompetencyLevel) => {
    const config = COMPETENCY_LEVELS.find((c) => c.value === level);
    return config?.color || "gray";
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{t("teamCompetencies")}</h3>
        <p className="text-sm text-gray-600">{t("description")}</p>
      </div>

      {/* Team Status */}
      {teamMembers.length > 0 && (
        <div
          className={`rounded-lg border-2 p-4 ${
            allQualified ? "border-green-200 bg-green-50" : "border-yellow-200 bg-yellow-50"
          }`}
        >
          <div className="flex items-start gap-3">
            {allQualified ? (
              <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="h-6 w-6 text-yellow-600 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <h4
                className={`font-medium mb-1 ${
                  allQualified ? "text-green-900" : "text-yellow-900"
                }`}
              >
                {allQualified ? t("allQualified") : t("notAllQualified")}
              </h4>
              <p className={`text-sm ${allQualified ? "text-green-700" : "text-yellow-700"}`}>
                {t("membersRegistered", {
                  count: teamMembers.length,
                  plural: teamMembers.length !== 1 ? "en" : "",
                })}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Required Competencies */}
      <div className="space-y-3">
        <h4 className="font-medium text-gray-900">{t("requiredCompetencies")}</h4>

        <div className="flex gap-2">
          <input
            type="text"
            value={newCompetency}
            onChange={(e) => setNewCompetency(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleAddRequiredCompetency()}
            placeholder={t("competencyPlaceholder")}
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0"
          />
          <button
            onClick={handleAddRequiredCompetency}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <Plus className="h-4 w-4" />
            {t("addButton")}
          </button>
        </div>

        {requiredCompetencies.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {requiredCompetencies.map((comp, index) => (
              <div
                key={index}
                className="flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-800"
              >
                <Award className="h-3 w-3" />
                <span>{comp}</span>
                <button
                  onClick={() => handleRemoveRequiredCompetency(index)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Team Members */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-gray-900">{t("teamMembers")}</h4>
          <button
            onClick={handleAddMember}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <Plus className="h-4 w-4" />
            {t("addMemberButton")}
          </button>
        </div>

        {teamMembers.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center">
            <Users className="mx-auto h-12 w-12 text-gray-400 mb-3" />
            <p className="text-sm text-gray-600 mb-4">{t("noMembersYet")}</p>
            <button
              onClick={handleAddMember}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              {t("addFirstMember")}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {teamMembers.map((member, index) => (
              <div key={index} className="rounded-lg border border-gray-200 bg-white p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`rounded-full p-2 ${
                        getCompetencyColor(member.competencyLevel) === "green"
                          ? "bg-green-100"
                          : getCompetencyColor(member.competencyLevel) === "blue"
                            ? "bg-blue-100"
                            : getCompetencyColor(member.competencyLevel) === "yellow"
                              ? "bg-yellow-100"
                              : "bg-red-100"
                      }`}
                    >
                      <Users
                        className={`h-5 w-5 ${
                          getCompetencyColor(member.competencyLevel) === "green"
                            ? "text-green-600"
                            : getCompetencyColor(member.competencyLevel) === "blue"
                              ? "text-blue-600"
                              : getCompetencyColor(member.competencyLevel) === "yellow"
                                ? "text-yellow-600"
                                : "text-red-600"
                        }`}
                      />
                    </div>
                    <div>
                      <h5 className="font-medium text-gray-900">
                        {t("memberNumber", { number: index + 1 })}
                      </h5>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveMember(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t("fields.name")}
                    </label>
                    <input
                      type="text"
                      value={member.displayName || ""}
                      onChange={(e) => handleUpdateMember(index, "displayName", e.target.value)}
                      placeholder={t("fields.namePlaceholder")}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t("fields.competencyLevel")}
                    </label>
                    <select
                      value={member.competencyLevel}
                      onChange={(e) =>
                        handleUpdateMember(
                          index,
                          "competencyLevel",
                          e.target.value as CompetencyLevel
                        )
                      }
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0"
                    >
                      {COMPETENCY_LEVELS.map((level) => (
                        <option key={level.value} value={level.value}>
                          {level.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("fields.certifications")}
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      placeholder={t("fields.certificationPlaceholder")}
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          const input = e.target as HTMLInputElement;
                          handleAddCertification(index, input.value);
                          input.value = "";
                        }
                      }}
                      className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0"
                    />
                  </div>
                  {member.certifications && member.certifications.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {member.certifications.map((cert, certIndex) => (
                        <div
                          key={certIndex}
                          className="flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700"
                        >
                          <Award className="h-3 w-3" />
                          <span>{cert}</span>
                          <button
                            onClick={() => handleRemoveCertification(index, certIndex)}
                            className="text-gray-500 hover:text-gray-700"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("fields.notes")}
                  </label>
                  <textarea
                    value={member.notes || ""}
                    onChange={(e) => handleUpdateMember(index, "notes", e.target.value)}
                    rows={2}
                    placeholder={t("fields.notesPlaceholder")}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* General Notes */}
      <div>
        <label htmlFor="stepNotes" className="block text-sm font-medium text-gray-700 mb-2">
          {t("generalNotes")}
        </label>
        <textarea
          id="stepNotes"
          value={notes}
          onChange={(e) => handleNotesChange(e.target.value)}
          rows={3}
          placeholder={t("generalNotesPlaceholder")}
          className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0"
        />
      </div>

      {/* Info Box */}
      <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
        <h4 className="font-medium text-blue-900 mb-2 text-sm">{t("infoBox.title")}</h4>
        <ul className="space-y-1 text-sm text-blue-800">
          <li>
            • <strong>{t("competencyLevels.certified")}:</strong> {t("infoBox.certified")}
          </li>
          <li>
            • <strong>{t("competencyLevels.trained")}:</strong> {t("infoBox.trained")}
          </li>
          <li>
            • <strong>{t("competencyLevels.supervised")}:</strong> {t("infoBox.supervised")}
          </li>
          <li>
            • <strong>{t("competencyLevels.not_qualified")}:</strong> {t("infoBox.notQualified")}
          </li>
        </ul>
      </div>
    </div>
  );
}
