# Pagina-overzicht per rol

Dit document beschrijft alle belangrijke pagina's in de applicatie, gegroepeerd per rol/functie. De bron hiervoor is de Next.js app directory onder [`web/src/app`](web/src/app/page.tsx:1) en de rol-checks in UI + API code.

Rollen in het systeem:

- `admin`
- `safety_manager`
- `supervisor`
- `field_worker`

---

## 1. Globale entry & navigatie (alle rollen)

### 1.1 Landing & marketing

- **`/landing`**  
  Publieke marketing/intro pagina voor alle rollen en prospects.

### 1.2 Authenticatie & onboarding

- **`/auth/login`**
- **`/auth/forgot-password`**
- **`/auth/register`**
- **`/auth/verify-email`**
- **`/auth/email-verified`**

Deze routes vormen samen de login- en registratieflow voor alle gebruikersrollen.

### 1.3 Na login – startpunt

- **`/`** (Home)  
  Geïmplementeerd in [`Home()`](web/src/app/page.tsx:8).  
  Toegang: alle ingelogde gebruikers.

Belangrijke CTA's op deze pagina:

- `Nieuwe TRA` → **`/tras/create`**
- `Start LMRA` → **`/lmra/execute`**
- `Rapporten` → **`/reports`**

### 1.4 Account & instellingen

- **`/account`**  
  Persoonlijk profiel, wachtwoord/gegevens. Admin en safety manager krijgen hier extra organisatie-gerelateerde opties.  
  (Rol-checks via `userProfile.role` in [`account/page.tsx`](web/src/app/account/page.tsx:1))

- **`/settings`**  
  Organisatie-instellingen. Bevat o.a. een knop _“Beheer Organisatie →”_ naar **`/admin/hub`**.  
  Zie o.a. de rol-badge en `canManageOrganization` logica in [`settings/page.tsx`](web/src/app/settings/page.tsx:1).

---

## 2. Rol: Admin

De `admin` rol heeft de breedste toegang: organisatiebeheer, analytics, admin-hub, teambeheer, pricing/billing.

### 2.1 Kern-dashboard & admin analytics

- **Executive KPI-dashboard (alleen admin + safety_manager)**  
  - URL: **`/dashboard`**  
  - Component: [`ExecutiveDashboardPage`](web/src/app/dashboard/page.tsx:37)  
  - Rol-check:  
    ```ts
    const canViewDashboard = userProfile?.role === "admin" || userProfile?.role === "safety_manager";
    ```  
  - Doel:
    - Real-time LMRA sessie-updates
    - 6 kern-KPI's (TRAs, LMRAs, risicoscore, compliance, approval time, user activation)
    - Stop-work alerts, KPI-trends, grafieken

- **Admin hub (alleen admin + safety_manager)**  
  - URL: **`/admin/hub`**  
  - Component: [`AdminHubPage`](web/src/app/admin/hub/page.tsx:86)  
  - Rol-check:  
    ```ts
    const isAdmin = userProfile?.role === "admin" || userProfile?.role === "safety_manager";
    ```  
  - Niet-admins zien een "Access Denied" scherm.

Vanuit de admin hub zijn o.a. bereikbaar:

- **`/admin/analytics`** — verdieping KPI/analytics
- **`/admin/performance`** — systeem performance monitor
- **`/admin/security-audit`** — security audits
- **`/admin/pwa-tests`** — PWA test & kwaliteitschecks
- **`/admin/reports/builder`** — rapport-builder
- **`/admin/risk-analysis`** — geavanceerde risico-analyses
- **`/admin/cohorts`** — cohort & retentie-analyses
- **`/admin/lmra-analytics`** — LMRA analytics

### 2.2 Organisatiebeheer & team

- **Teambeheer**  
  - URL: **`/team`**  
  - Component: [`TeamPage`](web/src/app/team/page.tsx:51)  
  - Data: `organizations/{orgId}/users` in Firestore.  
  - Rol-management via:
    ```ts
    const canManageRoles = userProfile?.role === "admin" || userProfile?.role === "safety_manager";
    ```  
  - Admin en safety manager kunnen rollen aanpassen en teamleden uitnodigen.

- **Organisatieleden (API)**  
  - **`/api/organizations`**, **`/api/organizations/members`**  
  - Logica om users te promoten/demoten, incl. check dat alleen admins anderen tot admin kunnen promoveren.

### 2.3 Projecten, TRA & LMRA configuratie

- **Projecten-overzicht**  
  - URL: **`/projects`**  
  - Page wrapper: [`ProjectsPage`](web/src/app/projects/page.tsx:23), laadt `ProjectsContent` dynamisch.  
  - Doel: lijst/beheer van projecten, koppeling met TRAs/LMRAs.

- **TRA's**  
  - **`/tras`** — TRA-lijst / overzicht  
  - **`/tras/create`** — nieuwe TRA aanmaken  
  - **`/tras/[traId]`** — TRA-detail

- **LMRA management**  
  - **`/lmra`** — LMRA overzicht (sessies/templates)  
  - **`/lmra/sessions`**, **`/lmra/sessions/[id]`** — sessiebeheer/monitoring

### 2.4 Goedkeuringen & rapportage

- **Approvals / goedkeuringen**  
  - URL: **`/approvals`**  
  - API-ondersteuning:
    - **`/api/approvals`**
    - **`/api/approvals/[approvalId]`**
  - Rol- en permissielogica o.a. in [`api/approvals/[approvalId]/route.ts`](web/src/app/api/approvals/[approvalId]/route.ts:1).

- **Rapporten**  
  - URL: **`/reports`**  
  - Gebruikt door alle hogere rollen voor compliance- en veiligheidsrapporten.  
  - Ook direct gelinkt vanaf `/` en `/dashboard`.

- **Admin rapport-builder**  
  - URL: **`/admin/reports/builder`**  
  - Complexe/custom rapporten en data-export.

### 2.5 Financieel / subscription

- **Pricing**  
  - URL: **`/pricing`** — pricingpagina (voornamelijk voor admins/sales).

- **Billing**  
  - URL: **`/billing`** — facturatie/subscription beheer.

- Stripe-integraties via:
  - **`/api/stripe/create-checkout`**
  - **`/api/stripe/create-portal`**
  - **`/api/stripe/subscription`**
  - **`/api/stripe/webhook`**

### 2.6 Overig admin- & systeembeheer

- Webhooks:
  - **`/api/webhooks`**
  - **`/api/webhooks/[id]`**
  - **`/api/webhooks/[id]/test`**
  - **`/api/webhooks/events`**

- Cache stats (alleen admin + safety_manager):
  - **`/api/cache/stats`**

- Security & audit:
  - **`/api/security/audit`**
  - **`/api/audit-logs`**

- Dev/admin tools:
  - **`/admin/scripts`**
  - **`/admin/bulk-ops`**
  - **`/admin/customers`**
  - **`/admin/monitoring`**
  - **`/admin/performance`**

- AI endpoints (hazard suggestions, foto-analyse, template-recommendations):
  - **`/api/ai/*`**

---

## 3. Rol: Safety Manager

De `safety_manager` rol lijkt sterk op admin, maar is primair gericht op veiligheid/compliance in plaats van financiën/contracten.

### 3.1 Gedeelde admin-functies

Safety managers hebben toegang tot dezelfde kern-analytics als admins:

- **`/dashboard`** — executive KPI-dashboard  
- **`/admin/hub`**  
- **`/admin/analytics`**  
- **`/admin/risk-analysis`**  
- **`/admin/lmra-analytics`**  
- **`/admin/security-audit`**  
- **`/admin/performance`**

In [`dashboard/page.tsx`](web/src/app/dashboard/page.tsx:37) en [`admin/hub/page.tsx`](web/src/app/admin/hub/page.tsx:86) zie je overal checks op:
```ts
userProfile?.role === "admin" || userProfile?.role === "safety_manager";
```

### 3.2 Operationele safety-tools

- **TRAs en LMRA's**  
  Zelfde pagina's als admin:

  - TRA:
    - **`/tras`**
    - **`/tras/create`**
    - **`/tras/[traId]`**
  - LMRA:
    - **`/lmra/execute`**
    - **`/lmra/sessions`**
    - **`/lmra/sessions/[id]`**

- **Approvals**  
  - **`/approvals`**  
  Safety manager komt vaak terug als `approverRole` in de approval-config, zie API logica in [`api/approvals/[approvalId]/route.ts`](web/src/app/api/approvals/[approvalId]/route.ts:1).

- **Rapportage**  
  - **`/reports`**
  - **`/admin/reports/builder`**

### 3.3 Team & organisatie-instellingen

- **`/team`** — zelfde component als admin; safety manager kan ook rollen beheren (`canManageRoles`).  
- **`/settings`** — organisatie- en safety-instellingen, inclusief toegang tot admin hub.

---

## 4. Rol: Supervisor

De `supervisor` rol zit tussen field_worker en safety_manager in: operationele verantwoordelijkheid, maar geen volledige admin-rechten.

### 4.1 Dagelijks werk / kernflows

- **Home / overzicht**
  - **`/`** (Home)  
    Zelfde entry point als andere rollen, met CTA's voor:
    - `TRA Aanmaken` → **`/tras/create`**
    - `LMRA Uitvoeren` → **`/lmra/execute`**
    - `Rapporten` → **`/reports`**

- **Projecten**
  - **`/projects`** — overzicht van projecten waarvoor de supervisor verantwoordelijk kan zijn.

- **TRAs**
  - **`/tras`**, **`/tras/[traId]`** — inzien en, afhankelijk van org-regels, aanmaken/aanpassen.

- **LMRA's**
  - **`/lmra/execute`** — LMRA uitvoeren in het veld.
  - **`/lmra/sessions`**, **`/lmra/sessions/[id]`** — overzicht van LMRA's (eigen en/of team).

### 4.2 Approvals & escalaties

- **`/approvals`**  
  Supervisors kunnen approval-stappen toegewezen krijgen via `approverRole` of `approverId`.

  Relevante logica (vereenvoudigd) in [`api/approvals/[approvalId]/route.ts`](web/src/app/api/approvals/[approvalId]/route.ts:1):
  ```ts
  const hasPermission =
    userRole === "admin" ||
    userRole === currentStep.approverRole ||
    currentStep.approverId === userId;
  ```

### 4.3 Team & communicatie

- **`/team`**  
  Supervisor kan teamleden inzien; rol-management is meestal beperkt (rol-checks maken onderscheid tussen admin/safety_manager vs. overige rollen).

---

## 5. Rol: Field Worker (Veldmedewerker)

De `field_worker` rol is primair uitvoerend in het veld, met focus op snelle, mobiel geoptimaliseerde flows.

### 5.1 Core flows

- **Home / quick actions**
  - **`/`** — homepage met snelle acties naar:
    - **`/tras/create`** — nieuwe TRA starten
    - **`/lmra/execute`** — LMRA uitvoeren

- **LMRA uitvoering**
  - **`/lmra/execute`** — 8-staps LMRA-wizard (mobile-first), zie types in [`lmra.ts`](web/src/lib/types/lmra.ts:1) en UI in [`LMRAWizard.tsx`](web/src/components/lmra/LMRAWizard.tsx:1).
  - **`/lmra/sessions`**, **`/lmra/sessions/[id]`** — eigen (of team-)sessies terugzien.

- **TRAs**
  - **`/tras`**, **`/tras/[traId]`** — relevante TRAs inzien en (afhankelijk van rechten) aanmaken.

- **Stop Work**
  - Via LMRA (`overallAssessment === "stop_work"`) worden stop-work alerts getriggerd.  
  - Deze zijn zichtbaar in het executive dashboard op **`/dashboard`** (voor admin/safety_manager).  
  - Gerelateerde API-routes:
    - **`/api/stop-work`**
    - **`/api/stop-work/[alertId]/acknowledge`**
    - **`/api/stop-work/[alertId]/resolve`**

### 5.2 Persoonlijk account

- **`/account`** — eigen gegevens, wachtwoord, e-mail verificatie.  
- **`/settings`** — persoonlijke voorkeuren (bijv. notificaties, taal).

### 5.3 Bewuste beperkingen

Field workers hebben **geen** toegang tot:

- **`/dashboard`** — executive KPIs (alleen admin/safety_manager).
- **`/admin/*`** — admin-hub en alle subpagina's.
- Geavanceerde analytics/cohorts.

---

## 6. Overzicht per functiegebied

Naast rollen is het handig de pagina's per domein te groeperen.

### 6.1 Authenticatie & onboarding

- **`/landing`**
- **`/auth/*`**
- **`/pricing`**
- **`/register`** (alias via auth-flow)

### 6.2 Core safety workflows

- **TRA**
  - **`/projects`**
  - **`/tras`**
  - **`/tras/create`**
  - **`/tras/[traId]`**

- **LMRA**
  - **`/lmra/execute`**
  - **`/lmra/sessions`**
  - **`/lmra/sessions/[id]`**

- **Approvals**
  - **`/approvals`**

### 6.3 Rapportage & analytics

- **Executive dashboard**
  - **`/dashboard`**

- **Rapportage**
  - **`/reports`**
  - **`/admin/reports/builder`**

- **Analytics**
  - **`/admin/analytics`**
  - **`/admin/risk-analysis`**
  - **`/admin/lmra-analytics`**

### 6.4 Organisatie & people

- **`/account`**
- **`/settings`**
- **`/team`**
- **`/organizations`** (via API-routes)

### 6.5 Systeem & admin

- **`/admin/hub`**
- **`/admin/performance`**
- **`/admin/security-audit`**
- **`/admin/pwa-tests`**
- **`/admin/scripts`**
- **`/admin/bulk-ops`**
- **`/admin/customers`**
- **`/admin/monitoring`**
- **`/admin/cohorts`**

---

## 7. Gebruik van dit document

- **Voor product & UX**:  
  Als bron voor wireframes, user journeys per rol, en onboarding-flow.

- **Voor development**:  
  Als referentie bij het toevoegen van nieuwe pagina's of routes.  
  - Nieuwe pagina? Voeg de URL + roltoegang hier toe.  
  - Rolwijziging? Update ook de relevante sectie (Admin / Safety manager / Supervisor / Field worker).

- **Voor support & implementatiepartners**:  
  Als naslagwerk om snel te zien welke functionaliteit voor welke rol beschikbaar is en via welke URL de pagina bereikbaar is.