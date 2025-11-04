import React, { useCallback } from "react";
import { LMRAStep4_TeamCompetencies, TeamMemberCompetency, LMRA, CompetencyLevel } from "@/lib/types/lmra";

type Props = {
  lmra?: Partial<LMRA>;
  onChange: (stepPayload: Partial<LMRAStep4_TeamCompetencies>) => void;
};

const competencyOptions: CompetencyLevel[] = ["certified", "trained", "supervised", "not_qualified"];

export default function Step4_TeamCompetencies({ lmra, onChange }: Props) {
  const current = lmra?.step4;

  const handleMemberChange = useCallback(
    (userId: string, updates: Partial<TeamMemberCompetency>) => {
      const members = (current?.teamMembers ?? []).map((m) =>
        m.userId === userId ? { ...m, ...updates } : m
      );
      const allQualified = members.every((m) => m.competencyLevel !== "not_qualified");
      onChange({ teamMembers: members, allQualified });
    },
    [current, onChange]
  );

  const handleAddMember = useCallback(() => {
    const members = current?.teamMembers ? [...current.teamMembers] : [];
    const newMember: TeamMemberCompetency = {
      userId: `tmp-${Date.now()}`,
      displayName: "Nieuwe medewerker",
      competencyLevel: "not_qualified",
      certifications: [],
    };
    members.push(newMember);
    const allQualified = members.every((m) => m.competencyLevel !== "not_qualified");
    onChange({ teamMembers: members, allQualified });
  }, [current, onChange]);

  const handleRemoveMember = useCallback(
    (userId: string) => {
      const members = (current?.teamMembers ?? []).filter((m) => m.userId !== userId);
      const allQualified = members.every((m) => m.competencyLevel !== "not_qualified");
      onChange({ teamMembers: members, allQualified });
    },
    [current, onChange]
  );

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">
        Controleer of het team de vereiste competenties heeft. Pas leden aan of voeg toe indien nodig.
      </p>

      <div className="space-y-3">
        {(current?.teamMembers ?? []).map((member) => (
          <div key={member.userId} className="p-3 border rounded grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
            <div>
              <div className="text-sm font-medium">{member.displayName ?? member.userId}</div>
              {member.certifications && member.certifications.length > 0 && (
                <div className="text-xs text-muted">Certificaten: {member.certifications.join(", ")}</div>
              )}
            </div>

            <div>
              <label className="block text-xs text-muted">Competency</label>
              <select
                value={member.competencyLevel}
                onChange={(e) =>
                  handleMemberChange(member.userId, { competencyLevel: e.target.value as CompetencyLevel })
                }
                className="input"
              >
                {competencyOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-2 justify-end">
              <button
                className="btn btn-outline"
                onClick={() =>
                  handleMemberChange(member.userId, {
                    certifications: [...(member.certifications ?? []), "nieuw-certificaat"],
                  })
                }
              >
                Voeg certificaat toe
              </button>
              <button className="btn btn-danger" onClick={() => handleRemoveMember(member.userId)}>
                Verwijder
              </button>
            </div>
          </div>
        ))}

        {(!current?.teamMembers || current.teamMembers.length === 0) && (
          <div className="text-sm text-muted">Nog geen teamleden toegevoegd.</div>
        )}
      </div>

      <div className="flex gap-2">
        <button className="btn btn-secondary" onClick={handleAddMember}>
          Voeg teamlid toe
        </button>

        <div className="text-sm text-gray-600">
          Vereiste competenties: {current?.requiredCompetencies?.join(", ") ?? "Geen specifiek opgegeven"}
        </div>
      </div>

      <div className="text-sm">
        <strong>All qualified:</strong> {current?.allQualified ? "Ja" : "Nee"}
        {current?.notes && <div className="mt-2 text-xs text-muted">Opmerking: {current.notes}</div>}
      </div>
    </div>
  );
}
