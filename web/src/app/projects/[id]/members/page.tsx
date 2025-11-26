"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Alert } from "@/components/ui/Alert";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Badge } from "@/components/ui/Badge";
import { ArrowLeft, UserPlus, Mail, Trash2, Shield } from "lucide-react";

interface Member {
  id: string;
  uid: string;
  email: string;
  role: "owner" | "manager" | "contributor" | "reader";
  joinedAt: Date;
  invitedBy?: string;
}

const roleLabels = {
  owner: "Eigenaar",
  manager: "Manager",
  contributor: "Bijdrager",
  reader: "Lezer",
};

const roleColors = {
  owner: "secondary",
  manager: "primary",
  contributor: "success",
  reader: "default",
} as const;

export default function ProjectMembersPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;

  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<Member["role"]>("contributor");
  const [inviting, setInviting] = useState(false);

  // Fetch members
  const fetchMembers = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/members`);
      if (!response.ok) {
        throw new Error("Fout bij laden teamleden");
      }
      const data = await response.json();
      setMembers(data.members || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fout bij laden teamleden");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [projectId]);

  // Invite member
  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inviteEmail || !inviteEmail.includes("@")) {
      setError("Voer een geldig e-mailadres in");
      return;
    }

    setInviting(true);
    setError(null);

    try {
      const response = await fetch(`/api/projects/${projectId}/members`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: inviteEmail,
          role: inviteRole,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Fout bij uitnodigen");
      }

      // Reset form and refresh members
      setInviteEmail("");
      setInviteRole("contributor");
      setShowInviteForm(false);
      fetchMembers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fout bij uitnodigen");
    } finally {
      setInviting(false);
    }
  };

  // Change member role
  const handleChangeRole = async (memberId: string, newRole: Member["role"]) => {
    try {
      const response = await fetch(
        `/api/projects/${projectId}/members?memberId=${memberId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ role: newRole }),
        }
      );

      if (!response.ok) {
        throw new Error("Fout bij wijzigen rol");
      }

      fetchMembers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fout bij wijzigen rol");
    }
  };

  // Remove member
  const handleRemoveMember = async (memberId: string) => {
    if (!confirm("Weet je zeker dat je dit teamlid wilt verwijderen?")) {
      return;
    }

    try {
      const response = await fetch(
        `/api/projects/${projectId}/members?memberId=${memberId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Fout bij verwijderen teamlid");
      }

      fetchMembers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fout bij verwijderen teamlid");
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner className="h-8 w-8" />
          <span className="ml-3 text-gray-600">Teamleden laden...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <Button
          variant="outline"
          onClick={() => router.push("/projects")}
          className="gap-2 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Terug naar projecten
        </Button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Teamleden Beheren</h1>
            <p className="text-gray-600 mt-2">
              Beheer toegang en rollen voor dit project
            </p>
          </div>
          <Button
            onClick={() => setShowInviteForm(!showInviteForm)}
            className="gap-2"
          >
            <UserPlus className="h-4 w-4" />
            Uitnodigen
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="error" className="mb-6">
          {error}
        </Alert>
      )}

      {/* Invite Form */}
      {showInviteForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Teamlid Uitnodigen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleInvite} className="space-y-4">
              <FormField label="E-mailadres" htmlFor="email" required>
                <input
                  id="email"
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="naam@bedrijf.nl"
                  required
                />
              </FormField>

              <FormField label="Rol" htmlFor="role" required>
                <select
                  id="role"
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as Member["role"])}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="reader">Lezer - Kan alleen lezen</option>
                  <option value="contributor">Bijdrager - Kan bewerken</option>
                  <option value="manager">Manager - Kan beheren</option>
                  <option value="owner">Eigenaar - Volledige controle</option>
                </select>
              </FormField>

              <div className="flex gap-4">
                <Button
                  type="submit"
                  disabled={inviting || !inviteEmail}
                  className="flex-1"
                >
                  {inviting ? (
                    <>
                      <LoadingSpinner className="mr-2" />
                      Uitnodigen...
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4 mr-2" />
                      Uitnodiging Versturen
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowInviteForm(false);
                    setInviteEmail("");
                    setError(null);
                  }}
                  disabled={inviting}
                >
                  Annuleren
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Members List */}
      <Card>
        <CardHeader>
          <CardTitle>Teamleden ({members.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <div className="text-center py-12">
              <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">Nog geen teamleden</p>
              <p className="text-sm text-gray-500">
                Nodig teamleden uit om aan dit project te werken
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-blue-600 font-semibold">
                          {member.email?.[0]?.toUpperCase() || "?"}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{member.email}</p>
                        <p className="text-sm text-gray-500">
                          Lid sinds{" "}
                          {new Date(member.joinedAt).toLocaleDateString("nl-NL")}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <select
                      value={member.role}
                      onChange={(e) =>
                        handleChangeRole(member.id, e.target.value as Member["role"])
                      }
                      className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="reader">Lezer</option>
                      <option value="contributor">Bijdrager</option>
                      <option value="manager">Manager</option>
                      <option value="owner">Eigenaar</option>
                    </select>

                    <Badge variant={roleColors[member.role]}>
                      {roleLabels[member.role]}
                    </Badge>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveMember(member.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}