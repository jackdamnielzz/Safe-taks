# Unit testing guide (Jest) — SafeWork Pro

Doel: uitleg en concrete voorbeelden om unit tests te draaien en schrijven voor de web-app (Next.js + TypeScript) met Jest.

Snelstart
1. Open terminal in het project root.
2. Start unit tests:
   - cd web && npm run test
   - Voor continuous watch: cd web && npm run test:watch
3. Coverage rapport:
   - cd web && npm run test:coverage

Belangrijke scripts
- Zie npm scripts in [`web/package.json`](web/package.json:1) voor exacte scriptnamen en CI integratie.

Configuratie overzicht
- Jest config: [`web/jest.config.js`](web/jest.config.js:1)
- Jest setup: [`web/jest.setup.js`](web/jest.setup.js:1)
- Mocks: [`web/__mocks__/fileMock.js`](web/__mocks__/fileMock.js:1)
- TypeScript integratie: ts-jest / next/jest in jest.config.js

Aanbevolen teststructuur
- Plaats unit tests naast code of in `__tests__` mappen:
  - Component tests: `web/src/components/__tests__/`
  - Lib / util tests: `web/src/lib/__tests__/`
- Naamgeving: `ComponentName.test.tsx` of `utilName.test.ts`

Voorbeeld: component test (React Testing Library)
```ts
import { render, screen } from '@testing-library/react';
import Button from '@/components/ui/Button';

test('renders label', () => {
  render(<Button>Opslaan</Button>);
  expect(screen.getByText('Opslaan')).toBeInTheDocument();
});
```

Mocking richtlijnen
- Mock externe services en Firebase in `jest.setup.js`.
- Gebruik `jest.mock()` voor modules zoals `next/router`, `next/image` en Firebase clients.
- Gebruik `web/src/__mocks__` voor herbruikbare mocks.

Firebase emulator in unit tests
- Voor tests die Firestore/Auth echt nodig hebben, gebruik de Firebase emulator in combinatie met jest:
  - Start emulator: cd web && npm run emulators:test
  - In tests: gebruik helper utils uit [`web/src/lib/firebase-emulator.ts`](web/src/lib/firebase-emulator.ts:1)
- Prefer mock-based unit tests en reserveer emulator-backed runs voor integration tests.

Best practices
- Test enkel pure logic in unit tests; complexe Firebase-interacties naar integration tests verplaatsen.
- Houd tests snel: < 200ms per test waar mogelijk.
- Coverage thresholds: project vereist 80%+ (zie `web/jest.config.js` en CI gates).
- Maak deterministische tests: seed data en fixed timestamps waar nodig.

CI Integratie
- GitHub Actions CI pipeline voert unit tests en coverage checks (zie `.github/workflows/ci.yml`).
- Zorg dat `npm run test:ci` of gelijkwaardig script succesvol draait in CI en emulators indien vereist.

Fouten oplossen
- Veelvoorkomende problemen:
  - "Invalid attempt to destructure undefined": controleer mocks en import paden.
  - TypeScript compile errors in tests: run `cd web && npm run tsc --noEmit` lokaal.
- Debugging tips:
  - Voeg `--runInBand` toe aan jest in CI voor isolatie.
  - Gebruik `console.log` in combinatie met `--silent=false` tijdens local debugging.

Links & reference
- Jest docs: https://jestjs.io
- Testing Library: https://testing-library.com
- Firebase emulator helpers: [`web/src/lib/firebase-emulator.ts`](web/src/lib/firebase-emulator.ts:1)
- Project testing strategy: [`TESTING_STRATEGY.md`](TESTING_STRATEGY.md:1)

TODO / Next steps
- Voeg voorbeeldtests per belangrijke module (auth, api wrappers, permissions).
- Document wanneer emulator nodig is vs mocked tests.
- Add examples for snapshot testing if/when components stabilise.
