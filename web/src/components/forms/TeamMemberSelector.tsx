"use client";

import React, { useState } from "react";
import { Control, Controller, UseFormSetValue, UseFormGetValues } from "react-hook-form";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { FormField } from "../ui/FormField";
import { 
  TeamRole, 
  TeamMemberInfo, 
  getTeamRoleDisplayName, 
  getDefaultResponsibilities,
  hasRequiredTeamRoles 
} from "@/lib/types/tra";
import { AlertTriangle, Users, ChevronDown } from "lucide-react";

interface TeamMemberSelectorProps {
  control: Control<any>;
  setValue: UseFormSetValue<any>;
  getValues: UseFormGetValues<any>;
  currentUserId?: string;
}

export function TeamMemberSelector({ 
  control, 
  setValue, 
  getValues,
  currentUserId 
}: TeamMemberSelectorProps) {
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<TeamRole>(TeamRole.VAKMAN);
  const [customResponsibilities, setCustomResponsibilities] = useState<string>("");
  const [emailError, setEmailError] = useState("");
  const [showRoleDetails, setShowRoleDetails] = useState(false);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const addTeamMember = () => {
    const email = newEmail.trim();

    if (!email) {
      setEmailError("Voer een e-mailadres in");
      return;
    }

    if (!validateEmail(email)) {
      setEmailError("Ongeldig e-mailadres");
      return;
    }

    // Get current members (both old and new formats for backward compatibility)
    const currentMembers = getValues().teamMembers || [];
    const currentMembersInfo: TeamMemberInfo[] = getValues().teamMembersInfo || [];

    // Check if email already exists
    if (currentMembers.includes(email) || currentMembersInfo.some(m => m.email === email)) {
      setEmailError("Dit e-mailadres is al toegevoegd");
      return;
    }

    // Get responsibilities
    let responsibilities = getDefaultResponsibilities(newRole);
    if (newRole === TeamRole.ANDERE && customResponsibilities.trim()) {
      responsibilities = customResponsibilities
        .split('\n')
        .map(r => r.trim())
        .filter(r => r.length > 0);
    }

    // Create new team member info
    const newMember: TeamMemberInfo = {
      uid: `temp-${Date.now()}`, // Temporary UID, will be replaced by backend
      name: email.split('@')[0], // Use email prefix as name
      email: email,
      role: newRole,
      responsibilities: responsibilities,
      addedAt: new Date(),
      addedBy: currentUserId || 'current-user'
    };

    // Update both formats for backward compatibility
    const updatedMembers = [...currentMembers, email];
    const updatedMembersInfo = [...currentMembersInfo, newMember];
    
    setValue("teamMembers", updatedMembers);
    setValue("teamMembersInfo", updatedMembersInfo);
    
    // Reset form
    setNewEmail("");
    setNewRole(TeamRole.VAKMAN);
    setCustomResponsibilities("");
    setEmailError("");
    setShowRoleDetails(false);
  };

  const removeTeamMember = (emailToRemove: string) => {
    const currentMembers = getValues().teamMembers || [];
    const currentMembersInfo: TeamMemberInfo[] = getValues().teamMembersInfo || [];
    
    const updatedMembers = currentMembers.filter((email: string) => email !== emailToRemove);
    const updatedMembersInfo = currentMembersInfo.filter((member) => member.email !== emailToRemove);
    
    setValue("teamMembers", updatedMembers);
    setValue("teamMembersInfo", updatedMembersInfo);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTeamMember();
    }
  };

  const getRoleBadgeColor = (role: TeamRole): string => {
    const colors: Record<TeamRole, string> = {
      [TeamRole.OPDRACHTGEVER]: 'bg-purple-100 text-purple-800',
      [TeamRole.WERKUITVOERDER]: 'bg-blue-100 text-blue-800',
      [TeamRole.VEILIGHEIDSKUNDIGE]: 'bg-red-100 text-red-800',
      [TeamRole.VAKMAN]: 'bg-green-100 text-green-800',
      [TeamRole.HULPKRACHT]: 'bg-gray-100 text-gray-800',
      [TeamRole.ANDERE]: 'bg-yellow-100 text-yellow-800',
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  // Get default responsibilities for preview
  const previewResponsibilities = newRole === TeamRole.ANDERE && customResponsibilities.trim()
    ? customResponsibilities.split('\n').filter(r => r.trim())
    : getDefaultResponsibilities(newRole);

  return (
    <div className="space-y-4">
      <FormField label="Teamleden" htmlFor="team-members" required>
        <div className="space-y-3">
          {/* Current team members display */}
          <Controller
            name="teamMembersInfo"
            control={control}
            render={({ field }) => {
              const members: TeamMemberInfo[] = field.value || [];
              const hasWerkuitvoerder = hasRequiredTeamRoles(members);

              return (
                <div className="space-y-2">
                  {/* Validation warning */}
                  {members.length > 0 && !hasWerkuitvoerder && (
                    <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded">
                      <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-amber-800">
                        <p className="font-medium">VCA Compliance Waarschuwing</p>
                        <p className="mt-1">
                          Voor een geldige TRA is minimaal één <strong>Werkuitvoerder</strong> vereist. 
                          Voeg een teamlid met deze rol toe.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Team members list */}
                  <div className="flex flex-wrap gap-2 min-h-[40px] p-3 border rounded bg-slate-50">
                    {members.length === 0 ? (
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Users className="h-4 w-4" />
                        <span>Nog geen teamleden toegevoegd</span>
                      </div>
                    ) : (
                      members.map((member) => (
                        <div
                          key={member.email}
                          className="flex items-center gap-2 bg-white border rounded-lg px-3 py-2 shadow-sm"
                        >
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">{member.email}</span>
                              <Badge 
                                variant="secondary" 
                                className={`text-xs ${getRoleBadgeColor(member.role)}`}
                              >
                                {getTeamRoleDisplayName(member.role)}
                              </Badge>
                            </div>
                            {member.responsibilities && member.responsibilities.length > 0 && (
                              <div className="text-xs text-gray-600">
                                {member.responsibilities.slice(0, 2).join(', ')}
                                {member.responsibilities.length > 2 && ` +${member.responsibilities.length - 2} meer`}
                              </div>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => removeTeamMember(member.email)}
                            className="ml-2 text-slate-400 hover:text-red-600 transition-colors"
                            aria-label={`Verwijder ${member.email}`}
                          >
                            ×
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            }}
          />

          {/* Add new member form */}
          <div className="border rounded-lg p-4 bg-white space-y-3">
            <h4 className="text-sm font-medium text-gray-700">Nieuw teamlid toevoegen</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Email input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  E-mailadres *
                </label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => {
                    setNewEmail(e.target.value);
                    setEmailError("");
                  }}
                  onKeyPress={handleKeyPress}
                  placeholder="naam@voorbeeld.nl"
                  className="w-full border rounded px-3 py-2 text-sm"
                />
              </div>

              {/* Role selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rol *
                </label>
                <select
                  value={newRole}
                  onChange={(e) => {
                    setNewRole(e.target.value as TeamRole);
                    setShowRoleDetails(true);
                  }}
                  className="w-full border rounded px-3 py-2 text-sm"
                >
                  <option value={TeamRole.WERKUITVOERDER}>{getTeamRoleDisplayName(TeamRole.WERKUITVOERDER)}</option>
                  <option value={TeamRole.OPDRACHTGEVER}>{getTeamRoleDisplayName(TeamRole.OPDRACHTGEVER)}</option>
                  <option value={TeamRole.VEILIGHEIDSKUNDIGE}>{getTeamRoleDisplayName(TeamRole.VEILIGHEIDSKUNDIGE)}</option>
                  <option value={TeamRole.VAKMAN}>{getTeamRoleDisplayName(TeamRole.VAKMAN)}</option>
                  <option value={TeamRole.HULPKRACHT}>{getTeamRoleDisplayName(TeamRole.HULPKRACHT)}</option>
                  <option value={TeamRole.ANDERE}>{getTeamRoleDisplayName(TeamRole.ANDERE)}</option>
                </select>
              </div>
            </div>

            {/* Role details toggle */}
            <button
              type="button"
              onClick={() => setShowRoleDetails(!showRoleDetails)}
              className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
            >
              <ChevronDown className={`h-4 w-4 transition-transform ${showRoleDetails ? 'rotate-180' : ''}`} />
              {showRoleDetails ? 'Verberg' : 'Toon'} verantwoordelijkheden
            </button>

            {/* Responsibilities display/edit */}
            {showRoleDetails && (
              <div className="space-y-2">
                {newRole === TeamRole.ANDERE ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Aangepaste verantwoordelijkheden
                    </label>
                    <textarea
                      value={customResponsibilities}
                      onChange={(e) => setCustomResponsibilities(e.target.value)}
                      placeholder="Voer verantwoordelijkheden in (één per regel)"
                      rows={4}
                      className="w-full border rounded px-3 py-2 text-sm"
                    />
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded p-3">
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      Standaard verantwoordelijkheden:
                    </p>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {previewResponsibilities.map((resp, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-blue-600 mt-1">•</span>
                          <span>{resp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Error message */}
            {emailError && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertTriangle className="h-4 w-4" />
                {emailError}
              </p>
            )}

            {/* Add button */}
            <Button
              type="button"
              onClick={addTeamMember}
              disabled={!newEmail.trim()}
              className="w-full"
            >
              + Teamlid toevoegen
            </Button>
          </div>
        </div>
      </FormField>

      {/* Helper text */}
      <div className="text-sm text-slate-600 bg-blue-50 border border-blue-200 rounded p-3">
        <p className="font-medium text-blue-900 mb-1">VCA Compliance vereisten:</p>
        <ul className="list-disc list-inside space-y-1 text-blue-800">
          <li>Minimaal één <strong>Werkuitvoerder</strong> is verplicht voor een geldige TRA</li>
          <li>Elk teamlid moet een duidelijk gedefinieerde rol hebben</li>
          <li>Verantwoordelijkheden worden automatisch toegewezen op basis van de rol</li>
        </ul>
      </div>
    </div>
  );
}
