# Localization audit — Frontend UI (Dutch target)

Datum: 2025-10-22
Scope: Alleen strings die eindgebruikers op de website zien (knoppen, navigatie, badges, modals, aria-labels, placeholders, paginatitels, zichtbare meldingen). Tests, fixtures en backend-only teksten zijn uitgesloten.

Doel: Complete inventaris met bestand, exacte Engelse string, context, prioriteit en voorgestelde Nederlandse vertaling. Gebruik dit bestand als startpunt voor migratie naar i18n.

Legenda prioriteit
- High: Zichtbare UI-elementen die gebruikers direct zien (buttons, navigation, modal buttons, badges, placeholders).
- Medium: Zichtbare ondersteunende teksten en aria-labels, titels, zoekresultaat-teksten.
- Low: Zelden zichtbare of ontwikkelaarsgerichte labels, of teksten die alleen in specifieke flows verschijnen.

Samenvatting (hoog-niveau)
- Belangrijke componenten met Engelse strings:
  - web/src/components/ui/Modal.tsx — "Confirm", "Cancel"
  - web/src/components/ui/LoadingSpinner.tsx — aria-label="Loading"
  - web/src/components/ui/Badge.tsx — labels: "Draft", "Archived", "Review", "Suspended"; aria-label="Remove"
  - web/src/components/search/TraSearch.tsx — button "Search" (spinner fallback)
  - web/src/components/layouts/DashboardLayout.tsx — navigatie items: "Dashboard", "TRAs", "Projects", "Reports", "Team", "Settings"
  - web/src/components/forms/TraWizard.tsx — step names: "Basic", "Steps", "Team", "Review"; FormField label "Title"
  - web/src/components/forms/ExampleForm.tsx — label "Title", placeholder "Enter a title"
  - web/src/app/auth/login/page.tsx — button text "Sign in" / "Signing in..."
  - web/src/lib/seo/seo-integration.ts — page title "Home"
- Domain/status keys (bv. "draft", "archived", "submitted") zijn code-keys — laat deze meestal onveranderd in de DB, maar zorg voor gelokaliseerde weergave in UI.

Detailed inventory
(Elke entry: Bestand — Engelse string — Context — Prioriteit — Voorstel NL)

1) web/src/components/ui/Modal.tsx
   - "Confirm" — default confirm button text in Modal component — High — "Bevestigen"
   - "Cancel" — default cancel button text — High — "Annuleren"

2) web/src/components/ui/LoadingSpinner.tsx
   - aria-label="Loading" — accessibility label for spinner — Medium — aria-label="Laden"

3) web/src/components/ui/Badge.tsx
   - aria-label="Remove" — aria label for remove action on badge — Medium — aria-label="Verwijderen"
   - "Suspended" — badge label for suspended status — High — "Geschorst"
   - "Archived" — badge label for archived — High — "Gearchiveerd"
   - "Draft" — badge label for draft — High — "Concept"
   - "Review" — badge label for review — High — "Ter beoordeling"

4) web/src/components/search/TraSearch.tsx
   - "Search" — button label / fallback text — High — "Zoeken"

5) web/src/components/layouts/DashboardLayout.tsx
   - "Dashboard" — navigation item — High — "Dashboard" (of "Overzicht")
   - "TRAs" — navigation item (product-specific) — High — "TRA's" (of "Risicoanalyse")
   - "Projects" — nav item — High — "Projecten"
   - "Reports" — nav item — High — "Rapporten"
   - "Team" — nav item — High — "Team"
   - "Settings" — nav item — High — "Instellingen"

6) web/src/components/forms/TraWizard.tsx
   - STEPS = ["Basic", "Steps", "Team", "Review"] — wizard step labels — High
     - "Basic" => "Basis"
     - "Steps" => "Stappen"
     - "Team" => "Team"
     - "Review" => "Beoordeling"
   - FormField label="Title" — form field label — High — "Titel"

7) web/src/components/forms/ExampleForm.tsx
   - label="Title" — High — "Titel"
   - placeholder="Enter a title" — High — "Voer een titel in"

8) web/src/app/auth/login/page.tsx
   - "Sign in" — login button — High — "Inloggen"
   - "Signing in..." — loading state — High — "Bezig met inloggen..."

9) web/src/lib/seo/seo-integration.ts
   - return "Home"; — page title for home — Medium — "Home" (of "Startpagina")

10) web/src/components/ui/Button.tsx (if exists / check) — many buttons may have English defaults. (Search shows buttons using English labels across project; ensure Button component supports i18n or receives translated strings.)

Notes & recommendations
- Keep domain keys (e.g., status = "draft") unchanged in code/database. Map these keys to localized labels in UI through a lookup (e.g., messages.status.draft = "Concept").
- Implement or reuse i18n layer:
  - Project already has web/src/i18n/ and web/src/messages/ — inspect these and add NL translations.
  - If no existing runtime i18n helper: add a small helper t(key) that reads from messages/nl.json based on locale.
- Accessibility: update aria-labels to Dutch as well.
- Fallbacks: ensure components accept props to override default text (e.g., Modal confirmText prop) and default to t('modal.confirm').

Next actions I can perform (select one)
- A) Schrijf dit inventarisbestand weg (gedaan) en stop — u bekijkt het.
- B) Ga door en vervang hard-coded strings in de meest kritieke UI-componenten (Modal, Badge, LoadingSpinner, DashboardLayout nav, Search button, Login page) naar calls naar een i18n helper en voeg NL translations. (Actie vereist veranderingen in code.)
- C) Alleen genereren van een gedetailleerde CSV/MD met alle UI strings gevonden (meer uitgebreid dan hierboven) — handig voor vertalers.

Kies A, B of C. Als u B kiest, ik ga stapsgewijs werken en elke bestandwijziging aanmaken en daarna wachten op uw bevestiging voordat ik verderga. Dit auditbestand is nu opgeslagen in memory-bank/localization-audit.md.
