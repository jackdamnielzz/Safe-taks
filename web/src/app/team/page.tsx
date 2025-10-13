'use client';

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/components/AuthProvider";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { UserPlus, Mail, Phone, Calendar, Shield, Users, Settings, X } from "lucide-react";

interface TeamMember {
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'safety_manager' | 'supervisor' | 'field_worker';
  createdAt: any;
  lastLoginAt: any;
  emailVerified: boolean;
  profileComplete: boolean;
}

const roleConfig = {
  admin: {
    label: "Administrator",
    color: "bg-red-100 text-red-800",
    icon: Shield,
    description: "Full system access and organization management"
  },
  safety_manager: {
    label: "Safety Manager",
    color: "bg-blue-100 text-blue-800",
    icon: Shield,
    description: "Safety protocols, approvals, and compliance oversight"
  },
  supervisor: {
    label: "Supervisor",
    color: "bg-green-100 text-green-800",
    icon: Users,
    description: "Team coordination and operational management"
  },
  field_worker: {
    label: "Field Worker",
    color: "bg-gray-100 text-gray-800",
    icon: Users,
    description: "Safety assessments and fieldwork execution"
  }
};

export default function TeamPage() {
  const { user, userProfile, loading: authLoading } = useAuth();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);

  useEffect(() => {
    // Wait for authentication to load first
    if (authLoading) {
      return;
    }

    // Wait for user profile to be loaded
    if (!userProfile) {
      return;
    }

    if (!userProfile.organizationId) {
      setLoading(false);
      return;
    }

    const membersQuery = query(
      collection(db, "organizations", userProfile.organizationId, "users"),
      where("emailVerified", "==", true)
    );

    const unsubscribe = onSnapshot(
      membersQuery,
      (snapshot) => {
        const members = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            uid: doc.id,
            ...data
          };
        }) as TeamMember[];

        setTeamMembers(members);
        setLoading(false);
      },
      (error) => {
        console.error("❌ Team page: Error loading team members:", error);
        setLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [userProfile]);

  const handleRoleChange = async (memberId: string, newRole: string) => {
    if (!userProfile?.organizationId) {
      console.error('❌ No organization ID available for role change');
      return;
    }

    try {
      console.log('🔄 Updating role for member:', memberId, 'to:', newRole);
      await updateDoc(doc(db, 'organizations', userProfile.organizationId, 'users', memberId), {
        role: newRole
      });
      console.log('✅ Role updated successfully');
    } catch (error) {
      console.error('❌ Error updating user role:', error);
      // You could add a toast notification here for better user feedback
    }
  };

  const canManageRoles = userProfile?.role === 'admin' || userProfile?.role === 'safety_manager';

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {authLoading ? "Authenticatie laden..." : "Teamleden laden..."}
          </p>
        </div>
      </div>
    );
  }

  // Handle case where user is not authenticated or has no profile
  if (!userProfile) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Authenticatie Vereist
          </h1>
          <p className="text-gray-600 mb-4">
            U moet ingelogd zijn om het team te bekijken.
          </p>
          <Button
            onClick={() => window.location.href = '/auth/login'}
            className="bg-orange-600 hover:bg-orange-700"
          >
            Inloggen
          </Button>
        </div>
      </div>
    );
  }

  // Handle case where user has no organization
  if (!userProfile.organizationId) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Geen Organisatie Gevonden
          </h1>
          <p className="text-gray-600 mb-4">
            Uw account is niet gekoppeld aan een organisatie. Neem contact op met uw administrator.
          </p>
          <div className="bg-gray-50 p-4 rounded-lg inline-block">
            <p className="text-sm text-gray-600">
              <strong>Debug Info:</strong><br />
              User ID: {user?.uid || 'Unknown'}<br />
              Email: {userProfile.email}<br />
              Role: {userProfile.role}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Team Management
            </h1>
            <p className="text-gray-600 mt-2">
              Manage your organization members and their access permissions
            </p>
          </div>
          {canManageRoles && (
            <Button
              onClick={() => setShowInviteModal(true)}
              className="bg-orange-600 hover:bg-orange-700"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Invite Team Member
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Members
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {teamMembers.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Active Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {teamMembers.filter(member =>
                member.lastLoginAt &&
                new Date(member.lastLoginAt.seconds * 1000).toDateString() === new Date().toDateString()
              ).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Pending Invites
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              0
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>
            All members of your organization with their current roles and status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {teamMembers.map((member) => {
              const RoleIcon = roleConfig[member.role].icon;
              const isCurrentUser = member.uid === user?.uid;

              return (
                <div
                  key={member.uid}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                      <span className="text-orange-600 font-medium">
                        {member.firstName?.[0]}{member.lastName?.[0]}
                      </span>
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium text-gray-900">
                          {member.firstName} {member.lastName}
                          {isCurrentUser && (
                            <span className="text-sm text-gray-500 ml-2">(You)</span>
                          )}
                        </h3>
                        {!member.emailVerified && (
                          <Badge variant="warning" className="text-orange-600 border-orange-600">
                            Unverified
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                        <span className="flex items-center">
                          <Mail className="w-4 h-4 mr-1" />
                          {member.email}
                        </span>
                        <span className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          Joined {member.createdAt?.toDate ? new Date(member.createdAt.toDate()).toLocaleDateString() : 'Unknown'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Badge className={roleConfig[member.role].color}>
                      <RoleIcon className="w-3 h-3 mr-1" />
                      {roleConfig[member.role].label}
                    </Badge>

                    {canManageRoles && !isCurrentUser && (
                      <select
                        value={member.role}
                        onChange={(e) => handleRoleChange(member.uid, e.target.value)}
                        className="text-sm border border-gray-300 rounded px-2 py-1 bg-white"
                      >
                        <option value="admin">Administrator</option>
                        <option value="safety_manager">Safety Manager</option>
                        <option value="supervisor">Supervisor</option>
                        <option value="field_worker">Field Worker</option>
                      </select>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {teamMembers.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Geen teamleden gevonden
              </h3>
              <p className="text-gray-600 mb-4">
                Uw organisatie heeft nog geen teamleden, of er is een probleem met het laden van de gegevens.
              </p>
              <div className="bg-blue-50 p-4 rounded-lg mb-4 text-left">
                <p className="text-sm text-blue-800 mb-2">
                  <strong>Mogelijke oorzaken:</strong>
                </p>
                <ul className="text-sm text-blue-700 list-disc list-inside space-y-1">
                  <li>Er zijn nog geen teamleden toegevoegd aan uw organisatie</li>
                  <li>Teamleden hebben hun email nog niet geverifieerd</li>
                  <li>Er is een probleem met de database verbinding</li>
                </ul>
              </div>
              {canManageRoles && (
                <Button
                  onClick={() => setShowInviteModal(true)}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Teamleden Uitnodigen
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invite Team Member Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Invite Team Member
              </h2>
              <button
                onClick={() => setShowInviteModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="colleague@company.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent">
                  <option value="field_worker">Field Worker</option>
                  <option value="supervisor">Supervisor</option>
                  <option value="safety_manager">Safety Manager</option>
                  {userProfile?.role === 'admin' && (
                    <option value="admin">Administrator</option>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Personal Message (Optional)
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  rows={3}
                  placeholder="Add a personal message to the invitation..."
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <Button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-orange-600 hover:bg-orange-700"
                >
                  Send Invitation
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}