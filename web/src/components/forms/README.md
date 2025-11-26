# TRA Form Components

## TeamMemberSelector

The `TeamMemberSelector` component provides a comprehensive UI for managing TRA team members with VCA-compliant role assignments.

### Features

- **VCA-Compliant Roles**: Six standard roles based on VCA requirements
- **Role-Based Responsibilities**: Automatic assignment of default responsibilities
- **Validation**: Ensures at least one WERKUITVOERDER (Work Supervisor) is assigned
- **Backward Compatibility**: Maintains support for legacy TRA documents
- **Custom Roles**: Support for "ANDERE" role with custom responsibilities

### Team Roles

#### 1. OPDRACHTGEVER (Client/Project Owner)
**Default Responsibilities:**
- Goedkeuring TRA
- Budget verantwoordelijkheid
- Projectdoelstellingen
- Eindverantwoordelijkheid

#### 2. WERKUITVOERDER (Work Supervisor/Executor) **[REQUIRED]**
**Default Responsibilities:**
- Directe supervisie werkzaamheden
- Dagelijkse veiligheidschecks
- Team coördinatie
- Uitvoering werkplan

**VCA Requirement**: At least one WERKUITVOERDER is mandatory for a valid TRA.

#### 3. VEILIGHEIDSKUNDIGE (Safety Officer)
**Default Responsibilities:**
- Risico-analyses
- VCA compliance
- Veiligheidsinspecties
- Incident response

#### 4. VAKMAN (Skilled Worker)
**Default Responsibilities:**
- Vakbekwame uitvoering
- Gebruik PBM (Personal Protective Equipment)
- Melding gevaren
- Naleving procedures

#### 5. HULPKRACHT (Helper/Assistant)
**Default Responsibilities:**
- Assistentie vakman
- Materiaal handling
- Werkplek schoonhouden
- Instructies opvolgen

#### 6. ANDERE (Other)
Custom role with user-defined responsibilities.

### Usage

```tsx
import { TeamMemberSelector } from '@/components/forms/TeamMemberSelector';
import { useForm } from 'react-hook-form';

function MyForm() {
  const { control, setValue, getValues } = useForm();
  
  return (
    <TeamMemberSelector
      control={control}
      setValue={setValue}
      getValues={getValues}
      currentUserId="user-123"
    />
  );
}
```

### Props

```typescript
interface TeamMemberSelectorProps {
  control: Control<any>;           // React Hook Form control
  setValue: UseFormSetValue<any>;  // React Hook Form setValue
  getValues: UseFormGetValues<any>; // React Hook Form getValues
  currentUserId?: string;           // Optional current user ID for tracking
}
```

### Data Structure

The component manages two parallel data structures for backward compatibility:

#### TeamMemberInfo (New Format)
```typescript
interface TeamMemberInfo {
  uid: string;                    // User ID
  name: string;                   // Display name
  email: string;                  // Email address
  role: TeamRole;                 // VCA-compliant role
  responsibilities?: string[];    // Role-specific responsibilities
  addedAt: Timestamp | Date;     // When added
  addedBy: string;                // Who added this member
}
```

#### Legacy Format
```typescript
teamMembers: string[];  // Array of email addresses (deprecated)
```

### VCA Compliance Validation

The component includes built-in VCA compliance validation:

1. **Visual Warnings**: Amber warning box appears when no WERKUITVOERDER is assigned
2. **Submission Validation**: `canSubmitTRA()` checks for required roles
3. **Real-time Feedback**: Validation updates as team members are added/removed

### Migration Strategy

For existing TRA documents without role information:

```typescript
import { migrateTeamMemberToInfo } from '@/lib/types/tra';

// Migrate legacy team member
const teamMemberInfo = migrateTeamMemberToInfo(
  'user-123',               // UID
  'jan@example.com',        // Email
  'Jan de Vries',           // Name
  'admin-user'              // Added by
);
// Result: TeamMemberInfo with VAKMAN role by default
```

### Helper Functions

#### getTeamRoleDisplayName
Returns Dutch display name for a role:
```typescript
getTeamRoleDisplayName(TeamRole.WERKUITVOERDER) // "Werkuitvoerder"
```

#### getDefaultResponsibilities
Returns array of default responsibilities for a role:
```typescript
getDefaultResponsibilities(TeamRole.VEILIGHEIDSKUNDIGE)
// ["Risico-analyses", "VCA compliance", "Veiligheidsinspecties", "Incident response"]
```

#### hasRequiredTeamRoles
Validates if team has required roles (WERKUITVOERDER):
```typescript
hasRequiredTeamRoles(teamMembers) // boolean
```

### Styling

The component uses:
- **Role Badges**: Color-coded badges for each role
- **Responsive Layout**: Grid layout for mobile and desktop
- **Visual Hierarchy**: Clear distinction between active and inactive states
- **Validation Indicators**: Warning icons and colored backgrounds

### Testing

Comprehensive tests are available in `web/src/__tests__/tra-team-roles.test.ts`:
- Role enum validation
- Display name mapping
- Default responsibilities
- Required role validation
- Migration helpers
- Integration with TRA submission

### Notes

- The component maintains both old (`teamMembers`) and new (`teamMembersInfo`) formats for backward compatibility
- Temporary UIDs are assigned to new members (prefixed with `temp-`) which should be replaced by the backend
- Custom responsibilities for ANDERE role are entered as newline-separated text
- All roles except WERKUITVOERDER are optional, but at least one team member is required

### See Also

- [TRA Types Documentation](../../lib/types/tra.ts) - Core type definitions
- [VCA Compliance](../../lib/vca-compliance.ts) - Compliance validation
- [Team Roles Tests](../../__tests__/tra-team-roles.test.ts) - Test suite