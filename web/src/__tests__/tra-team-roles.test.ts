/**
 * Tests for TRA Team Roles & Responsibilities Feature
 * Tests TeamRole enum, TeamMemberInfo interface, and related helper functions
 */

import {
  TeamRole,
  TeamMemberInfo,
  getTeamRoleDisplayName,
  getDefaultResponsibilities,
  hasRequiredTeamRoles,
  migrateTeamMemberToInfo,
  canSubmitTRA,
  TRA,
} from '@/lib/types/tra';

describe('TeamRole Enum', () => {
  it('should have all VCA-standard roles', () => {
    expect(TeamRole.OPDRACHTGEVER).toBe('opdrachtgever');
    expect(TeamRole.WERKUITVOERDER).toBe('werkuitvoerder');
    expect(TeamRole.VEILIGHEIDSKUNDIGE).toBe('veiligheidskundige');
    expect(TeamRole.VAKMAN).toBe('vakman');
    expect(TeamRole.HULPKRACHT).toBe('hulpkracht');
    expect(TeamRole.ANDERE).toBe('andere');
  });
});

describe('getTeamRoleDisplayName', () => {
  it('should return correct display names for all roles', () => {
    expect(getTeamRoleDisplayName(TeamRole.OPDRACHTGEVER)).toBe('Opdrachtgever');
    expect(getTeamRoleDisplayName(TeamRole.WERKUITVOERDER)).toBe('Werkuitvoerder');
    expect(getTeamRoleDisplayName(TeamRole.VEILIGHEIDSKUNDIGE)).toBe('Veiligheidskundige');
    expect(getTeamRoleDisplayName(TeamRole.VAKMAN)).toBe('Vakman');
    expect(getTeamRoleDisplayName(TeamRole.HULPKRACHT)).toBe('Hulpkracht');
    expect(getTeamRoleDisplayName(TeamRole.ANDERE)).toBe('Andere');
  });
});

describe('getDefaultResponsibilities', () => {
  it('should return responsibilities for OPDRACHTGEVER', () => {
    const responsibilities = getDefaultResponsibilities(TeamRole.OPDRACHTGEVER);
    expect(responsibilities).toContain('Goedkeuring TRA');
    expect(responsibilities).toContain('Budget verantwoordelijkheid');
    expect(responsibilities).toContain('Projectdoelstellingen');
    expect(responsibilities).toContain('Eindverantwoordelijkheid');
    expect(responsibilities.length).toBe(4);
  });

  it('should return responsibilities for WERKUITVOERDER', () => {
    const responsibilities = getDefaultResponsibilities(TeamRole.WERKUITVOERDER);
    expect(responsibilities).toContain('Directe supervisie werkzaamheden');
    expect(responsibilities).toContain('Dagelijkse veiligheidschecks');
    expect(responsibilities).toContain('Team coördinatie');
    expect(responsibilities).toContain('Uitvoering werkplan');
    expect(responsibilities.length).toBe(4);
  });

  it('should return responsibilities for VEILIGHEIDSKUNDIGE', () => {
    const responsibilities = getDefaultResponsibilities(TeamRole.VEILIGHEIDSKUNDIGE);
    expect(responsibilities).toContain('Risico-analyses');
    expect(responsibilities).toContain('VCA compliance');
    expect(responsibilities).toContain('Veiligheidsinspecties');
    expect(responsibilities).toContain('Incident response');
    expect(responsibilities.length).toBe(4);
  });

  it('should return responsibilities for VAKMAN', () => {
    const responsibilities = getDefaultResponsibilities(TeamRole.VAKMAN);
    expect(responsibilities).toContain('Vakbekwame uitvoering');
    expect(responsibilities).toContain('Gebruik PBM');
    expect(responsibilities).toContain('Melding gevaren');
    expect(responsibilities).toContain('Naleving procedures');
    expect(responsibilities.length).toBe(4);
  });

  it('should return responsibilities for HULPKRACHT', () => {
    const responsibilities = getDefaultResponsibilities(TeamRole.HULPKRACHT);
    expect(responsibilities).toContain('Assistentie vakman');
    expect(responsibilities).toContain('Materiaal handling');
    expect(responsibilities).toContain('Werkplek schoonhouden');
    expect(responsibilities).toContain('Instructies opvolgen');
    expect(responsibilities.length).toBe(4);
  });

  it('should return empty array for ANDERE role', () => {
    const responsibilities = getDefaultResponsibilities(TeamRole.ANDERE);
    expect(responsibilities).toEqual([]);
  });
});

describe('TeamMemberInfo Interface', () => {
  it('should create valid TeamMemberInfo with role', () => {
    const member: TeamMemberInfo = {
      uid: 'user-123',
      name: 'Jan de Vries',
      email: 'jan@example.com',
      role: TeamRole.WERKUITVOERDER,
      responsibilities: getDefaultResponsibilities(TeamRole.WERKUITVOERDER),
      addedAt: new Date(),
      addedBy: 'admin-user',
    };

    expect(member.uid).toBe('user-123');
    expect(member.role).toBe(TeamRole.WERKUITVOERDER);
    expect(member.responsibilities).toHaveLength(4);
  });

  it('should allow custom responsibilities', () => {
    const member: TeamMemberInfo = {
      uid: 'user-456',
      name: 'Marie Jansen',
      email: 'marie@example.com',
      role: TeamRole.ANDERE,
      responsibilities: ['Custom responsibility 1', 'Custom responsibility 2'],
      addedAt: new Date(),
      addedBy: 'admin-user',
    };

    expect(member.role).toBe(TeamRole.ANDERE);
    expect(member.responsibilities).toEqual(['Custom responsibility 1', 'Custom responsibility 2']);
  });

  it('should allow TeamMemberInfo without responsibilities', () => {
    const member: TeamMemberInfo = {
      uid: 'user-789',
      name: 'Piet Bakker',
      email: 'piet@example.com',
      role: TeamRole.VAKMAN,
      addedAt: new Date(),
      addedBy: 'supervisor-user',
    };

    expect(member.responsibilities).toBeUndefined();
  });
});

describe('hasRequiredTeamRoles', () => {
  it('should return true when team has WERKUITVOERDER', () => {
    const members: TeamMemberInfo[] = [
      {
        uid: 'user-1',
        name: 'Jan',
        email: 'jan@example.com',
        role: TeamRole.WERKUITVOERDER,
        addedAt: new Date(),
        addedBy: 'admin',
      },
      {
        uid: 'user-2',
        name: 'Marie',
        email: 'marie@example.com',
        role: TeamRole.VAKMAN,
        addedAt: new Date(),
        addedBy: 'admin',
      },
    ];

    expect(hasRequiredTeamRoles(members)).toBe(true);
  });

  it('should return false when team has no WERKUITVOERDER', () => {
    const members: TeamMemberInfo[] = [
      {
        uid: 'user-1',
        name: 'Jan',
        email: 'jan@example.com',
        role: TeamRole.VAKMAN,
        addedAt: new Date(),
        addedBy: 'admin',
      },
      {
        uid: 'user-2',
        name: 'Marie',
        email: 'marie@example.com',
        role: TeamRole.HULPKRACHT,
        addedAt: new Date(),
        addedBy: 'admin',
      },
    ];

    expect(hasRequiredTeamRoles(members)).toBe(false);
  });

  it('should return false for empty team', () => {
    expect(hasRequiredTeamRoles([])).toBe(false);
  });

  it('should return true with multiple WERKUITVOERDER members', () => {
    const members: TeamMemberInfo[] = [
      {
        uid: 'user-1',
        name: 'Jan',
        email: 'jan@example.com',
        role: TeamRole.WERKUITVOERDER,
        addedAt: new Date(),
        addedBy: 'admin',
      },
      {
        uid: 'user-2',
        name: 'Marie',
        email: 'marie@example.com',
        role: TeamRole.WERKUITVOERDER,
        addedAt: new Date(),
        addedBy: 'admin',
      },
    ];

    expect(hasRequiredTeamRoles(members)).toBe(true);
  });
});

describe('migrateTeamMemberToInfo', () => {
  it('should migrate UID to TeamMemberInfo with default VAKMAN role', () => {
    const member = migrateTeamMemberToInfo('user-123', 'jan@example.com', 'Jan de Vries', 'admin');

    expect(member.uid).toBe('user-123');
    expect(member.email).toBe('jan@example.com');
    expect(member.name).toBe('Jan de Vries');
    expect(member.role).toBe(TeamRole.VAKMAN);
    expect(member.responsibilities).toEqual(getDefaultResponsibilities(TeamRole.VAKMAN));
    expect(member.addedBy).toBe('admin');
  });

  it('should handle migration with only UID', () => {
    const member = migrateTeamMemberToInfo('user-456');

    expect(member.uid).toBe('user-456');
    expect(member.email).toBe('user-456@unknown.com');
    expect(member.name).toBe('user-456');
    expect(member.role).toBe(TeamRole.VAKMAN);
    expect(member.addedBy).toBe('system');
  });

  it('should use email as name when name is not provided', () => {
    const member = migrateTeamMemberToInfo('user-789', 'piet@example.com');

    expect(member.name).toBe('piet@example.com');
    expect(member.email).toBe('piet@example.com');
  });

  it('should set default addedBy to system when not provided', () => {
    const member = migrateTeamMemberToInfo('user-101', 'test@example.com', 'Test User');

    expect(member.addedBy).toBe('system');
  });
});

describe('canSubmitTRA - Team Roles Integration', () => {
  const createBaseTRA = (): Partial<TRA> => ({
    status: 'draft' as const,
    taskSteps: [
      {
        stepNumber: 1,
        description: 'Test step',
        hazards: [
          {
            id: 'h1',
            description: 'Test hazard',
            category: 'physical',
            source: 'custom',
            effectScore: 7,
            exposureScore: 2,
            probabilityScore: 1,
            riskScore: 14,
            riskLevel: 'trivial',
            controlMeasures: [],
          },
        ],
      },
    ],
    teamMembers: ['user-1'],
  });

  it('should allow submission for TRA with proper team roles', () => {
    const tra = {
      ...createBaseTRA(),
      teamMembersInfo: [
        {
          uid: 'user-1',
          name: 'Jan',
          email: 'jan@example.com',
          role: TeamRole.WERKUITVOERDER,
          addedAt: new Date(),
          addedBy: 'admin',
        },
      ],
    } as TRA;

    expect(canSubmitTRA(tra)).toBe(true);
  });

  it('should reject submission when team lacks WERKUITVOERDER', () => {
    const tra = {
      ...createBaseTRA(),
      teamMembersInfo: [
        {
          uid: 'user-1',
          name: 'Jan',
          email: 'jan@example.com',
          role: TeamRole.VAKMAN,
          addedAt: new Date(),
          addedBy: 'admin',
        },
      ],
    } as TRA;

    expect(canSubmitTRA(tra)).toBe(false);
  });

  it('should allow submission for legacy TRA without teamMembersInfo', () => {
    const tra = {
      ...createBaseTRA(),
      teamMembersInfo: undefined,
    } as TRA;

    expect(canSubmitTRA(tra)).toBe(true);
  });

  it('should allow submission for TRA with empty teamMembersInfo (legacy)', () => {
    const tra = {
      ...createBaseTRA(),
      teamMembersInfo: [],
    } as TRA;

    expect(canSubmitTRA(tra)).toBe(true);
  });

  it('should reject submission when team has no members at all', () => {
    const tra = {
      ...createBaseTRA(),
      teamMembers: [],
      teamMembersInfo: [],
    } as TRA;

    expect(canSubmitTRA(tra)).toBe(false);
  });

  it('should allow submission with multiple team members including WERKUITVOERDER', () => {
    const tra = {
      ...createBaseTRA(),
      teamMembers: ['user-1', 'user-2', 'user-3'],
      teamMembersInfo: [
        {
          uid: 'user-1',
          name: 'Jan',
          email: 'jan@example.com',
          role: TeamRole.OPDRACHTGEVER,
          addedAt: new Date(),
          addedBy: 'admin',
        },
        {
          uid: 'user-2',
          name: 'Marie',
          email: 'marie@example.com',
          role: TeamRole.WERKUITVOERDER,
          addedAt: new Date(),
          addedBy: 'admin',
        },
        {
          uid: 'user-3',
          name: 'Piet',
          email: 'piet@example.com',
          role: TeamRole.VEILIGHEIDSKUNDIGE,
          addedAt: new Date(),
          addedBy: 'admin',
        },
      ],
    } as TRA;

    expect(canSubmitTRA(tra)).toBe(true);
  });
});

describe('Team Roles - VCA Compliance', () => {
  it('should recognize all VCA-standard roles', () => {
    const roles = [
      TeamRole.OPDRACHTGEVER,
      TeamRole.WERKUITVOERDER,
      TeamRole.VEILIGHEIDSKUNDIGE,
      TeamRole.VAKMAN,
      TeamRole.HULPKRACHT,
      TeamRole.ANDERE,
    ];

    roles.forEach(role => {
      expect(getTeamRoleDisplayName(role)).toBeTruthy();
      expect(getDefaultResponsibilities(role)).toBeDefined();
    });
  });

  it('should enforce WERKUITVOERDER requirement for VCA compliance', () => {
    const teamWithoutSupervisor: TeamMemberInfo[] = [
      {
        uid: 'user-1',
        name: 'Jan',
        email: 'jan@example.com',
        role: TeamRole.OPDRACHTGEVER,
        addedAt: new Date(),
        addedBy: 'admin',
      },
      {
        uid: 'user-2',
        name: 'Marie',
        email: 'marie@example.com',
        role: TeamRole.VEILIGHEIDSKUNDIGE,
        addedAt: new Date(),
        addedBy: 'admin',
      },
    ];

    expect(hasRequiredTeamRoles(teamWithoutSupervisor)).toBe(false);
  });
});