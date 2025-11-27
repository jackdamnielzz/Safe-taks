# Handover Document – Auth Flow, Landing Page & Dashboard Access

Statusdatum: 2025-11-10 (UPDATED: Auth persistence fixed)

Doel: Nieuwe developer snel en veilig op snelheid brengen over de huidige stand van zaken rondom authenticatie, landing page routing en dashboard-toegang in de SafeWork Pro webapp (`/web`).

## ✅ RECENT FIX: Auth Persistence Issue Resolved (2025-11-10)

**Problem:** Users were redirected back to login page on every navigation after successful login.

**Root Cause:** Firebase Web SDK stores auth in localStorage/IndexedDB (client-side only), but Next.js middleware runs on the server and couldn't read these. The middleware was checking for cookies that didn't exist.

**Solution Implemented:**
1. Simple cookie-based session management without requiring Firebase Admin SDK credentials
2. After successful login, [`AuthProvider`](web/src/components/AuthProvider.tsx:253) sets `auth_verified=true` cookie
3. [`middleware.ts`](web/src/middleware.ts:51) checks this cookie to determine authentication status
4. Cookie expires after 14 days and is cleared on logout

**Files Modified:**
- [`web/src/components/AuthProvider.tsx`](web/src/components/AuthProvider.tsx:237) - Sets/clears auth cookie on login/logout
- [`web/src/middleware.ts`](web/src/middleware.ts:51) - Checks `auth_verified` cookie instead of Firebase session cookies
- [`web/src/app/auth/login/page.tsx`](web/src/app/auth/login/page.tsx:44) - Redirects to `/` instead of `/dashboard`
- [`web/src/app/dashboard/page.tsx`](web/src/app/dashboard/page.tsx:37) - Better loading state handling
- [`web/src/app/api/auth/session/route.ts`](web/src/app/api/auth/session/route.ts:1) - Created but not used (kept for future Firebase Admin SDK implementation)

**Testing:** ✅ Verified working - users can now login and navigate freely without redirects.


## 1. Kernprincipes (moeten altijd gelden)

1. Dashboard en alle product-functionaliteit zijn ALLEEN toegankelijk voor ingelogde gebruikers.
2. Niet-ingelogde gebruikers:
   - Zien standaard de marketing landing page.
   - Kunnen navigeren naar login / register / publieke informatie.
3. Ingelogde gebruikers:
   - Kunnen naar dashboard en beschermde routes.
   - Mogen niet “vast komen te zitten” op de loginpagina.
4. Geen verborgen auto-login of hard-coded test user:
   - Elke sessie moet afkomstig zijn van echte Firebase Auth login.
5. Logout moet alle sessie-informatie betrouwbaar opruimen.

De changes tot nu toe zijn gericht op het herstellen en hardmaken van bovenstaande principes.

---

## 2. Belangrijke bestanden en rollen

- [`web/src/components/AuthProvider.tsx`](web/src/components/AuthProvider.tsx:1)
  - Centrale client-side auth context.
  - Regelt:
    - `onAuthStateChanged` listener.
    - Laden van `user` en `userProfile`.
    - `signIn`, `signUp`, `signInWithGoogle`, `resetPassword`, `updateUserProfile`.
    - `signOutUser` (inclusief volledige cleanup).
  - BELANGRIJK: Deze provider wordt gebruikt in [`web/src/app/layout.tsx`](web/src/app/layout.tsx:20).

- [`web/src/app/layout.tsx`](web/src/app/layout.tsx:20)
  - Wikkelt de app met:
    - `NextIntlClientProvider`
    - `AuthProvider`
    - `Header`
  - Alle pagina’s lopen via deze layout.

- [`web/src/components/Header.tsx`](web/src/components/Header.tsx:31)
  - Toont user info alleen als er een `userProfile` is.
  - Geen fallback meer naar “Gebruiker” als pseudo-login.
  - Toont “Inloggen” knop indien niet ingelogd.
  - Bevat `handleSignOut` die `signOutUser` aanroept.

- [`web/src/app/page.tsx`](web/src/app/page.tsx:1)
  - Root route `/`.
  - Client component met `useAuth` + `useRouter`.
  - Gedrag:
    - Als `loading === true` → laadscherm.
    - Als `!loading && !user` → redirect naar `/landing`.
    - Als `user` → toont dashboard UI (bestaande content).
  - Dit bestand is cruciaal voor juiste scheiding tussen landing en dashboard.

- [`web/src/app/landing/page.tsx`](web/src/app/landing/page.tsx:1)
  - Marketing landing page.
  - Wordt gebruikt als publieke entry voor niet-ingelogde gebruikers.

- [`web/src/app/auth/login/page.tsx`](web/src/app/auth/login/page.tsx:24)
  - Login pagina.
  - Belangrijke punten:
    - Form `onSubmit` roept `signIn` van `AuthProvider` aan.
    - Na succesvolle `signIn` wordt niet direct blind geredirect.
    - Er wordt gewacht op bevestiging via `onAuthStateChanged` (Auth state sync).
    - Redirect naar `/dashboard` (of gewenste route) pas na confirmatie.
    - Logging toegevoegd voor debug (prefix `🔐` / `✅`).

- [`web/src/middleware.ts`](web/src/middleware.ts:39)
  - Server-side bescherming via Next.js middleware.
  - Logica:
    - `PUBLIC_ROUTES`: `/, /landing, /auth/*, /pricing, /privacy, /terms, /support, ...`
    - Auth-check via Firebase auth cookies (`firebase:authUser:*`).
    - Als authenticated user naar auth-route gaat → redirect naar `/dashboard`.
    - Als NIET ingelogd en naar beschermde route → redirect naar `/auth/login?redirect=...`.
  - Dit is de server-side guard; moet in lijn blijven met client-side gedrag.

---

## 3. Wat is al opgelost

1. Auto-login illusie verwijderd:
   - Header toonde altijd “Gebruiker” door `header.defaultName`.
   - Nu:
     - Alleen echte gebruikersdata tonen bij ingelogde user.
     - Anders: “Inloggen” knop.
   - Effect: geen valse indruk meer dat je ingelogd bent.

2. Logout is “hard” gemaakt:
   - `signOutUser()` in [`AuthProvider.tsx`](web/src/components/AuthProvider.tsx:365) wist:
     - React state (`user`, `userProfile`)
     - Firebase Auth sessie (`signOut(auth)`)
     - localStorage / sessionStorage keys gerelateerd aan Firebase
     - Firebase cookies
     - IndexedDB databases (`firebaseLocalStorageDb`, `firestore`, `firebase-installations-database`)
   - `isLoggingOut` flag voorkomt dat `onAuthStateChanged` tijdens logout de user terugzet.

3. Landing page routing werkzaam:
   - Bij een schone sessie:
     - Start server
     - Bezoek `http://localhost:3000`
     - Je wordt doorgestuurd naar `/landing`
   - Dit is inmiddels door de product owner bevestigd als “werkt nu zichtbaar”.

4. Login redirect loop opgelost:
   - Voorheen: na succesvol `signIn` redirecten we te vroeg, waardoor middleware nog geen geldige cookie zag → terug naar login.
   - Nu: login pagina wacht op bevestigde auth state vanuit `AuthProvider` voordat redirect plaatsvindt.
   - Console logging toont duidelijk de stappen.

5. Documentatie & context:
   - `memory-bank/activeContext.md` en `memory-bank/progress.md` bevatten referenties naar deze wijzigingen.
   - Er is een aparte uitleg gemaakt over auth redirect gedrag (AUTH-REDIRECT-BEHAVIOR).

---

## 4. Openstaande punten voor de nieuwe developer

De basis werkt nu, maar er zijn een paar zaken die je moet controleren / afronden:

1. Consistente server-side bescherming:
   - Controleer dat ALLE dashboard- en applicatie-routes (bijv. `/dashboard`, `/tras`, `/reports`, `/team`, `/account`, `/admin/*`) door de middleware als “protected” worden behandeld.
   - Zorg dat `/landing` en `auth` routes publiek blijven.
   - Belangrijk: het dashboard mag nooit renderebaar zijn voor niet-geauthenticeerde gebruikers, ook niet via directe URL.

2. Root route `/` vs. `/dashboard`:
   - Huidig gedrag:
     - Niet ingelogd → `/` redirect naar `/landing` (OK).
     - Ingelogd → `/` toont dashboard UI binnen `page.tsx`.
   - Beslis en borg:
     - Of `/` = dashboard voor ingelogde users.
     - Of `/dashboard` expliciet gebruiken, en `/` alleen als publieke landing/redirect wrapper.
   - Align dit met productbeslissing en middleware.

3. Cleanup van debug logging:
   - Er is uitgebreide console logging toegevoegd (handig tijdens debugging).
   - Voordat dit naar productie gaat:
     - Logging dempen of achter een debug-flag zetten.
     - Alleen essentiële logs behouden.

4. Test-scenario’s die je moet uitvoeren:
   - a) Schone sessie:
     - Stop server, start opnieuw.
     - Open incognito.
     - Ga naar `/`:
       - Verwacht: `/landing`.
   - b) Login:
     - Vanaf `/landing` → “Inloggen”.
     - Gebruik `admin@example.com` / `Admin123!`.
     - Verwacht:
       - Succesvolle login.
       - Redirect naar dashboard (`/` of `/dashboard` afhankelijk van gekozen strategie).
   - c) Logout:
     - Klik “Uitloggen”.
     - Verwacht:
       - Terug naar `/landing`.
       - `/dashboard` direct bezoeken → redirect naar `/auth/login` (of `/landing` + login CTA).
   - d) Hard refresh & nieuwe tab:
     - Terwijl ingelogd:
       - Refresh `/`.
       - Nieuwe tab naar `/` → moet je als ingelogde user herkennen.
     - Na logout:
       - Nieuwe tab naar `/` → `/landing`.

5. Firebase claims & role-based access:
   - Admin user is voorzien van claims (`role`, `orgId`).
   - Verifieer:
     - Dat `AuthProvider` profielen correct laadt uit Firestore (org-specifiek pad).
     - Dat UI componenten (bijv. admin onderdelen) rol-checks goed doen.
   - Dit is secundair aan de huidige taak, maar raakt autorisatie.

---

## 5. Praktische aanwijzingen voor de opvolger

- Start dev server:
  - Vanuit repo root:
    - `cd web && npm install` (eenmalig)
    - `cd web && npm run dev`
- Test altijd in incognito voor een schone sessie.
- Wijzigingen m.b.t. auth/redirect:
  - Altijd in lijn houden met:
    - [`AuthProvider.tsx`](web/src/components/AuthProvider.tsx:1)
    - [`middleware.ts`](web/src/middleware.ts:39)
    - [`app/page.tsx`](web/src/app/page.tsx:1)
    - [`app/landing/page.tsx`](web/src/app/landing/page.tsx:1)
    - [`app/auth/login/page.tsx`](web/src/app/auth/login/page.tsx:24)
- Respecteer de regels uit [`AGENTS.md`](AGENTS.md:1):
  - Vooral omtrent centrale auth, VCA/TRA/LMRA koppelingen en het hergebruiken van bestaande helpers.

---

## 6. TL;DR voor de nieuwe developer

- Geen hard-coded auto-login meer; vorige “Gebruiker” UI-bug is opgelost.
- Landing page wordt nu gebruikt voor niet-ingelogde users (route `/` redirect → `/landing`).
- Login en logout flows zijn robuuster gemaakt; redirect-loop is opgelost.
- Nog te bewaken:
  - Middleware + client logic moeten 100% overeenkomen: dashboard alleen voor ingelogde users.
  - Finaliseren van route-strategie (`/` vs `/dashboard`) en opschonen van debug logs.
- Dit document + `memory-bank/*` geven je het volledige recente contextbeeld.
