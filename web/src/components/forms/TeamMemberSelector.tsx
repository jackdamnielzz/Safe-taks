"use client";

import React, { useState } from "react";
import { Control, Controller, UseFormSetValue, UseFormGetValues } from "react-hook-form";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { FormField } from "../ui/FormField";

interface TeamMemberSelectorProps {
  control: Control<any>;
  setValue: UseFormSetValue<any>;
  getValues: UseFormGetValues<any>;
}

export function TeamMemberSelector({ control, setValue, getValues }: TeamMemberSelectorProps) {
  const [newEmail, setNewEmail] = useState("");
  const [emailError, setEmailError] = useState("");

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

    const currentMembers = getValues().teamMembers || [];
    if (currentMembers.includes(email)) {
      setEmailError("Dit e-mailadres is al toegevoegd");
      return;
    }

    const updatedMembers = [...currentMembers, email];
    setValue("teamMembers", updatedMembers);
    setNewEmail("");
    setEmailError("");
  };

  const removeTeamMember = (emailToRemove: string) => {
    const currentMembers = getValues().teamMembers || [];
    const updatedMembers = currentMembers.filter((email: string) => email !== emailToRemove);
    setValue("teamMembers", updatedMembers);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTeamMember();
    }
  };

  return (
    <div className="space-y-4">
      <FormField label="Teamleden" htmlFor="team-members" required>
        <div className="space-y-3">
          {/* Current team members display */}
          <Controller
            name="teamMembers"
            control={control}
            render={({ field }) => (
              <div className="flex flex-wrap gap-2 min-h-[40px] p-2 border rounded bg-slate-50">
                {(field.value || []).map((email: string) => (
                  <Badge
                    key={email}
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    {email}
                    <button
                      type="button"
                      onClick={() => removeTeamMember(email)}
                      className="ml-1 text-slate-500 hover:text-red-600"
                      aria-label={`Verwijder ${email}`}
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          />

          {/* Add new member input */}
          <div className="flex gap-2">
            <input
              type="email"
              value={newEmail}
              onChange={(e) => {
                setNewEmail(e.target.value);
                setEmailError("");
              }}
              onKeyPress={handleKeyPress}
              placeholder="Voer e-mailadres in"
              className="flex-1 border rounded px-3 py-2"
            />
            <Button
              type="button"
              onClick={addTeamMember}
              disabled={!newEmail.trim()}
              className="px-4 py-2"
            >
              + Toevoegen
            </Button>
          </div>

          {/* Error message */}
          {emailError && (
            <p className="text-sm text-red-600">{emailError}</p>
          )}
        </div>
      </FormField>

      {/* Helper text */}
      <p className="text-sm text-slate-600">
        Voeg teamleden toe door hun e-mailadres in te voeren en op "+ Toevoegen" te klikken.
        Teamleden ontvangen notificaties over deze TRA.
      </p>
    </div>
  );
}