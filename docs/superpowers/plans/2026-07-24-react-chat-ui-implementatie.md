# React/Vite/Tailwind Chat-UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** De huidige vanilla-HTML/JS chat-UI van Autibot vervangen door een React-gebaseerde UI (zijbalk met doelgroepkeuze, berichten-bubbels, invoerbalk onderaan), gebouwd met Vite en Tailwind CSS, zonder de backend aan te raken.

**Architecture:** Een nieuwe, los getrackte `client/`-map met React-broncode wordt door Vite gebouwd naar `src/server/public/` (bestaande statische-bestanden-map van de Node-server, ongewijzigd contract). `npm run dev` start voortaan twee processen tegelijk via `concurrently`: `vite build --watch` (bouwt bij elke wijziging) en de bestaande `tsx src/index.ts`-server. Zie `docs/superpowers/specs/2026-07-23-react-chat-ui-design.md` voor het volledige ontwerp en `adr/0008-react-vite-tailwind-chat-ui.md` voor de onderliggende beslissing.

**Tech Stack:** React, Vite, Tailwind CSS v4 (via `@tailwindcss/vite`), TypeScript, `concurrently` (twee dev-processen naast elkaar).

## Global Constraints

- Backend blijft volledig ongewijzigd: geen enkele taak in dit plan wijzigt `src/kennisbank/`, `src/retriever/`, `src/orchestrator/`, `src/llm/` of het `/api/chat`-contract. De enige aanraking van `src/server/` is het uit git verwijderen van de oude, met de hand geschreven `src/server/public/index.html` en `app.js` (die map wordt voortaan Vite-bouw-output).
- Geen streaming van antwoorden, geen gespreksgeschiedenis/vervolgvragen-context, geen `localStorage`-persistentie van de gekozen doelgroep, geen doelgroep-afleiding uit een chatvraag — alle vier expliciet uitgesteld/afgewezen in het ontwerpdocument.
- Geen component-library (geen shadcn/ui e.d.) — alle UI-onderdelen worden zelf opgebouwd met Tailwind-classes.
- Geen geautomatiseerde front-end tests (bewuste keuze, zie ontwerpdocument, in lijn met de vorige UI). Verificatie per taak gebeurt via `tsc --noEmit`, een eenmalige `vite build` plus een `grep` op de bouw-output; de laatste taak voegt daar een echte handmatige/browser-controle aan toe.
- Doelgroep-opties en labels (ADR-0003, ongewijzigd): `zelf` → "Ikzelf (ik heb autisme)", `ouder-naaste` → "Ouder / naaste", `professional` → "Professional", `algemeen` → "Weet ik niet / algemeen".
- Componentnamen zijn Nederlands (`Zijbalk`, `Chatvenster`, `Bericht`, `LaadIndicator`), zoals in het ontwerpdocument; `App`/`main` volgen de gangbare React/Vite-conventie.
- Node.js ≥ 18 (bestaande backend-constraint, ongewijzigd). Installeer dependencies zonder handmatig versienummers in `package.json` te zetten — laat `npm install` de daadwerkelijk geresolveerde versies wegschrijven.
- `ANTHROPIC_API_KEY` is nodig om in Taak 6 een echte, gedekte vraag door Claude te laten beantwoorden; zonder deze variabele werkt de rest van de UI-flow (doelgroepkeuze, ongedekte vraag → weigering, serverfout-pad) nog steeds te verifiëren.

---

## File Structure

```
adr/
  0008-react-vite-tailwind-chat-ui.md   (al aangemaakt, voorafgaand aan dit plan)
client/                                  (nieuw: React-broncode, getrackt in git)
  index.html
  vite.config.ts
  tsconfig.json
  src/
    main.tsx
    App.tsx
    api.ts
    types.ts
    index.css
    components/
      Zijbalk.tsx
      Chatvenster.tsx
      Bericht.tsx
      LaadIndicator.tsx
package.json                             (gewijzigd: scripts + dependencies)
.gitignore                                (gewijzigd: + src/server/public/)
src/server/public/index.html              (verwijderd uit git-tracking)
src/server/public/app.js                  (verwijderd uit git-tracking)
```

- `client/`: alle React-broncode, gescheiden van de backend-`src/`-map en met een eigen `tsconfig.json` (browser-doelwit i.p.v. Node).
- `client/src/components/`: de vier UI-bouwstenen uit het ontwerp, elk met één duidelijke verantwoordelijkheid.
- `client/src/api.ts` + `client/src/types.ts`: de dataslaag — netwerkaanroep naar het bestaande `/api/chat`-endpoint en de bijbehorende (lokaal gedupliceerde) types.
- `src/server/public/`: wordt na dit plan uitsluitend Vite-bouw-output; niet meer met de hand bewerkt, niet meer getrackt.

---

### Task 1: ADR-0008 vastleggen

**Files:**
- Create: `adr/0008-react-vite-tailwind-chat-ui.md` (al aangemaakt tijdens de voorbereiding van dit plan — controleer dat het bestaat en klopt met het format van `adr/0001`)

**Interfaces:** Geen (documentatie-only taak, geen code).

- [ ] **Step 1: Controleer dat het ADR-bestand bestaat en het juiste format volgt**

Run: `cat adr/0008-react-vite-tailwind-chat-ui.md`
Expected: Bestand bestaat, bevat de secties `Datum`, `Status`, `## Context`, `## Beslissing`, `## Consequenties`, in dezelfde stijl als `adr/0001-architectuurbeslissingen-vastleggen-met-adrs.md`.

- [ ] **Step 2: Commit (indien nog niet gecommit)**

```bash
git add adr/0008-react-vite-tailwind-chat-ui.md
git commit -m "ADR-0008: React/Vite/Tailwind voor de chat-UI"
```

---

### Task 2: Build-pipeline scaffold (dependencies, Vite/Tailwind-config, placeholder-app)

**Files:**
- Modify: `package.json` (scripts + dependencies)
- Modify: `.gitignore` (voeg `src/server/public/` toe)
- Remove (uit git-tracking): `src/server/public/index.html`, `src/server/public/app.js`
- Create: `client/index.html`
- Create: `client/vite.config.ts`
- Create: `client/tsconfig.json`
- Create: `client/src/main.tsx`
- Create: `client/src/App.tsx` (tijdelijke placeholder-inhoud, wordt in Taak 4/5 vervangen)
- Create: `client/src/index.css`

**Interfaces:**
- Produces: een werkende build-pijplijn — `npx vite build --config client/vite.config.ts` schrijft naar `src/server/public/`; `npm run dev` start server + build-watcher naast elkaar.

- [ ] **Step 1: Dependencies installeren**

```bash
npm install --save react react-dom
npm install --save-dev vite @vitejs/plugin-react @types/react @types/react-dom tailwindcss @tailwindcss/vite concurrently
```

Expected: `package.json` krijgt `react`/`react-dom` onder `dependencies` en de overige packages onder `devDependencies`, met de daadwerkelijk geresolveerde versies (niet handmatig aanpassen); `package-lock.json` wordt bijgewerkt.

- [ ] **Step 2: `package.json`-scripts bijwerken**

Open `package.json` en vervang het `"scripts"`-veld door:

```json
"scripts": {
  "dev": "concurrently \"vite build --watch --config client/vite.config.ts\" \"tsx src/index.ts\"",
  "test": "vitest run",
  "typecheck": "tsc --noEmit && tsc --noEmit -p client/tsconfig.json"
},
```

- [ ] **Step 3: `.gitignore` bijwerken en oude UI-bestanden uit git-tracking halen**

Voeg aan `.gitignore` toe:

```
src/server/public/
```

Verwijder de oude, met de hand geschreven UI-bestanden uit git (blijven lokaal op schijf verwijderd; ze worden zo dadelijk vervangen door Vite-bouw-output):

```bash
git rm src/server/public/index.html src/server/public/app.js
```

Expected: `git status` toont beide bestanden als `deleted`, en `src/server/public/` staat genegeerd in `.gitignore`.

- [ ] **Step 4: `client/vite.config.ts` aanmaken**

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";

const clientDir = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  root: clientDir,
  plugins: [react(), tailwindcss()],
  build: {
    outDir: fileURLToPath(new URL("../src/server/public", import.meta.url)),
    emptyOutDir: true,
  },
});
```

`root` en `outDir` zijn expliciet afgeleid van de locatie van dit configbestand (niet van de working directory), zodat `npm run dev` correct werkt ongeacht vanuit welke map het wordt aangeroepen.

- [ ] **Step 5: `client/tsconfig.json` aanmaken**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "skipLibCheck": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true
  },
  "include": ["src"]
}
```

- [ ] **Step 6: `client/index.html` aanmaken**

```html
<!doctype html>
<html lang="nl">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Autibot</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

Bewust geen `<link rel="icon">`: de bestaande Node-server (`src/server/server.ts`) kent alleen content-types voor `.html`/`.js`/`.css` en blijft in dit plan ongewijzigd, dus een los favicon-bestand zou een 404/verkeerd content-type opleveren.

- [ ] **Step 7: `client/src/index.css` aanmaken**

```css
@import "tailwindcss";
```

- [ ] **Step 8: `client/src/App.tsx` aanmaken (tijdelijke placeholder)**

```tsx
export function App() {
  return <h1 className="p-4 text-xl font-semibold">Autibot – React-app geladen</h1>;
}
```

- [ ] **Step 9: `client/src/main.tsx` aanmaken**

```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./index.css";

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root-element '#root' niet gevonden in index.html");
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

- [ ] **Step 10: Typecheck en eenmalige build uitvoeren**

```bash
npx tsc --noEmit -p client/tsconfig.json
npx vite build --config client/vite.config.ts
```

Expected: beide commando's slagen zonder foutmelding; de build eindigt met een regel die begint met `✓ built in`; `src/server/public/index.html` en `src/server/public/assets/` bestaan na afloop.

- [ ] **Step 11: Bouw-output controleren**

```bash
grep -o "Autibot – React-app geladen" src/server/public/assets/*.js
```

Expected: exact deze tekst wordt gevonden — bewijst dat de placeholder-`App` daadwerkelijk gebundeld is.

- [ ] **Step 12: Volledige dev-pijplijn rooktest**

```bash
npm run dev &
DEV_PID=$!
sleep 3
curl -s http://localhost:3000/ | grep -o '<div id="root">'
kill "$DEV_PID"
```

Expected: de curl-regel vindt `<div id="root">` — de Node-server serveert nu de Vite-gebouwde `index.html` in plaats van de oude vanilla-HTML.

- [ ] **Step 13: Commit**

```bash
git add package.json package-lock.json .gitignore client
git commit -m "React/Vite/Tailwind build-pijplijn opzetten"
```

---

### Task 3: Dataslaag — `types.ts` en `api.ts`

**Files:**
- Create: `client/src/types.ts`
- Create: `client/src/api.ts`

**Interfaces:**
- Consumes: het bestaande `/api/chat`-contract (`POST { vraag: string; doelgroep: Doelgroep }` → `{ tekst: string; bronnen: Bron[] }` of `{ fout: string }`), zie `src/llm/LLMProvider.ts` en `src/retriever/Retriever.ts` in de backend.
- Produces: `Doelgroep`, `Bron`, `Antwoord`, `FoutAntwoord`, `GesprekItem` (types), en `stelVraag(vraag, doelgroep): Promise<Antwoord | FoutAntwoord>` — gebruikt door Taak 5.

- [ ] **Step 1: `client/src/types.ts` aanmaken**

```ts
export type Doelgroep = "zelf" | "ouder-naaste" | "professional" | "algemeen";

export interface Bron {
  id: string;
  titel: string;
  inhoud: string;
  bestandspad: string;
  score: number;
}

export interface Antwoord {
  tekst: string;
  bronnen: Bron[];
}

export interface FoutAntwoord {
  fout: string;
}

export interface GesprekItem {
  id: string;
  vraag: string;
  bezig: boolean;
  antwoord?: Antwoord;
  fout?: string;
}
```

- [ ] **Step 2: `client/src/api.ts` aanmaken**

```ts
import type { Antwoord, Doelgroep, FoutAntwoord } from "./types";

export async function stelVraag(
  vraag: string,
  doelgroep: Doelgroep,
): Promise<Antwoord | FoutAntwoord> {
  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vraag, doelgroep }),
    });
    return (await response.json()) as Antwoord | FoutAntwoord;
  } catch {
    return { fout: "Kan de server niet bereiken. Controleer of Autibot draait." };
  }
}
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit -p client/tsconfig.json`
Expected: geen foutmeldingen.

- [ ] **Step 4: Commit**

```bash
git add client/src/types.ts client/src/api.ts
git commit -m "Dataslaag: types en /api/chat-aanroep voor de React-UI"
```

---

### Task 4: Zijbalk en doelgroep-state

**Files:**
- Create: `client/src/components/Zijbalk.tsx`
- Modify: `client/src/App.tsx` (vervangt de placeholder uit Taak 2)

**Interfaces:**
- Consumes: `Doelgroep` uit `client/src/types.ts` (Taak 3).
- Produces: `Zijbalk`-component met props `{ doelgroep: Doelgroep | null; onKiezen: (doelgroep: Doelgroep) => void }` — hergebruikt in Taak 5 zonder wijziging.

- [ ] **Step 1: `client/src/components/Zijbalk.tsx` aanmaken**

```tsx
import type { Doelgroep } from "../types";

interface Optie {
  waarde: Doelgroep;
  label: string;
}

const OPTIES: Optie[] = [
  { waarde: "zelf", label: "Ikzelf (ik heb autisme)" },
  { waarde: "ouder-naaste", label: "Ouder / naaste" },
  { waarde: "professional", label: "Professional" },
  { waarde: "algemeen", label: "Weet ik niet / algemeen" },
];

interface ZijbalkProps {
  doelgroep: Doelgroep | null;
  onKiezen: (doelgroep: Doelgroep) => void;
}

export function Zijbalk({ doelgroep, onKiezen }: ZijbalkProps) {
  return (
    <aside className="w-64 shrink-0 border-r border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900">
      <h1 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">Autibot</h1>
      <p className="mb-2 text-sm text-gray-600 dark:text-gray-400">Voor wie zoek je deze informatie?</p>
      <div className="flex flex-col gap-2">
        {OPTIES.map((optie) => (
          <button
            key={optie.waarde}
            type="button"
            onClick={() => onKiezen(optie.waarde)}
            className={`rounded-lg px-3 py-2 text-left text-sm transition-colors ${
              doelgroep === optie.waarde
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
            }`}
          >
            {optie.label}
          </button>
        ))}
      </div>
    </aside>
  );
}
```

- [ ] **Step 2: `client/src/App.tsx` bijwerken**

```tsx
import { useState } from "react";
import { Zijbalk } from "./components/Zijbalk";
import type { Doelgroep } from "./types";

export function App() {
  const [doelgroep, setDoelgroep] = useState<Doelgroep | null>(null);

  return (
    <div className="flex h-screen bg-white dark:bg-gray-950">
      <Zijbalk doelgroep={doelgroep} onKiezen={setDoelgroep} />
      <main className="flex flex-1 items-center justify-center text-sm text-gray-500 dark:text-gray-400">
        {doelgroep ? `Gekozen doelgroep: ${doelgroep}` : "Kies eerst een doelgroep"}
      </main>
    </div>
  );
}
```

- [ ] **Step 3: Typecheck en build**

```bash
npx tsc --noEmit -p client/tsconfig.json
npx vite build --config client/vite.config.ts
```

Expected: geen foutmeldingen; build eindigt met `✓ built in`.

- [ ] **Step 4: Bouw-output controleren**

```bash
grep -o "Ouder / naaste" src/server/public/assets/*.js
grep -o "Kies eerst een doelgroep" src/server/public/assets/*.js
```

Expected: beide teksten worden gevonden.

- [ ] **Step 5: Commit**

```bash
git add client/src/components/Zijbalk.tsx client/src/App.tsx
git commit -m "Zijbalk met doelgroepkeuze toevoegen"
```

---

### Task 5: Chatvenster, Bericht, LaadIndicator en volledige wiring

**Files:**
- Create: `client/src/components/LaadIndicator.tsx`
- Create: `client/src/components/Bericht.tsx`
- Create: `client/src/components/Chatvenster.tsx`
- Modify: `client/src/App.tsx` (vervangt de placeholder-`main` uit Taak 4 door `Chatvenster`, voegt `gesprek`-state en `stelVraag`-aanroep toe)

**Interfaces:**
- Consumes: `GesprekItem`, `Antwoord`, `FoutAntwoord`, `Doelgroep` (Taak 3); `stelVraag` (Taak 3); `Zijbalk` (Taak 4, ongewijzigd).
- Produces: volledig werkende chat-flow, geen verdere taken hierna consumeren deze componenten.

- [ ] **Step 1: `client/src/components/LaadIndicator.tsx` aanmaken**

```tsx
export function LaadIndicator() {
  return (
    <div className="max-w-lg rounded-lg bg-gray-100 px-4 py-2 text-sm italic text-gray-500 dark:bg-gray-800 dark:text-gray-400">
      Autibot denkt na...
    </div>
  );
}
```

- [ ] **Step 2: `client/src/components/Bericht.tsx` aanmaken**

```tsx
import type { GesprekItem } from "../types";
import { LaadIndicator } from "./LaadIndicator";

interface BerichtProps {
  item: GesprekItem;
}

export function Bericht({ item }: BerichtProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="ml-auto max-w-lg rounded-lg bg-blue-600 px-4 py-2 text-sm text-white">
        {item.vraag}
      </div>
      {item.bezig && <LaadIndicator />}
      {!item.bezig && item.fout && (
        <div className="max-w-lg rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          Fout: {item.fout}
        </div>
      )}
      {!item.bezig && item.antwoord && (
        <div className="max-w-lg rounded-lg bg-gray-100 px-4 py-2 text-sm text-gray-800 dark:bg-gray-800 dark:text-gray-100">
          <p>{item.antwoord.tekst}</p>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            {item.antwoord.bronnen.length > 0
              ? `Bronnen: ${item.antwoord.bronnen.map((bron) => bron.titel).join(", ")}`
              : "Geen bronnen (buiten de kennisbank)"}
          </p>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: `client/src/components/Chatvenster.tsx` aanmaken**

```tsx
import { useEffect, useRef, useState } from "react";
import type { Doelgroep, GesprekItem } from "../types";
import { Bericht } from "./Bericht";

interface ChatvensterProps {
  doelgroep: Doelgroep | null;
  gesprek: GesprekItem[];
  onVraagVersturen: (vraag: string) => void;
}

export function Chatvenster({ doelgroep, gesprek, onVraagVersturen }: ChatvensterProps) {
  const [invoer, setInvoer] = useState("");
  const bezig = gesprek.some((item) => item.bezig);
  const bodemRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bodemRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [gesprek]);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const vraag = invoer.trim();
    if (!vraag || !doelgroep || bezig) return;
    onVraagVersturen(vraag);
    setInvoer("");
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {gesprek.map((item) => (
          <Bericht key={item.id} item={item} />
        ))}
        <div ref={bodemRef} />
      </div>
      <form onSubmit={handleSubmit} className="flex gap-2 border-t border-gray-200 p-4 dark:border-gray-800">
        <input
          type="text"
          value={invoer}
          onChange={(event) => setInvoer(event.target.value)}
          disabled={!doelgroep}
          placeholder={doelgroep ? "Stel je vraag over autisme..." : "Kies eerst een doelgroep"}
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:disabled:bg-gray-900"
        />
        <button
          type="submit"
          disabled={!doelgroep || bezig}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          Vraag
        </button>
      </form>
    </div>
  );
}
```

- [ ] **Step 4: `client/src/App.tsx` bijwerken naar de volledige flow**

```tsx
import { useState } from "react";
import { Zijbalk } from "./components/Zijbalk";
import { Chatvenster } from "./components/Chatvenster";
import { stelVraag } from "./api";
import type { Doelgroep, GesprekItem } from "./types";

export function App() {
  const [doelgroep, setDoelgroep] = useState<Doelgroep | null>(null);
  const [gesprek, setGesprek] = useState<GesprekItem[]>([]);

  async function handleVraagVersturen(vraag: string) {
    if (!doelgroep) return;
    const id = crypto.randomUUID();
    setGesprek((huidig) => [...huidig, { id, vraag, bezig: true }]);

    const resultaat = await stelVraag(vraag, doelgroep);

    setGesprek((huidig) =>
      huidig.map((item) =>
        item.id === id
          ? "fout" in resultaat
            ? { ...item, bezig: false, fout: resultaat.fout }
            : { ...item, bezig: false, antwoord: resultaat }
          : item,
      ),
    );
  }

  return (
    <div className="flex h-screen bg-white dark:bg-gray-950">
      <Zijbalk doelgroep={doelgroep} onKiezen={setDoelgroep} />
      <Chatvenster doelgroep={doelgroep} gesprek={gesprek} onVraagVersturen={handleVraagVersturen} />
    </div>
  );
}
```

- [ ] **Step 5: Typecheck en build**

```bash
npx tsc --noEmit -p client/tsconfig.json
npx vite build --config client/vite.config.ts
```

Expected: geen foutmeldingen; build eindigt met `✓ built in`.

- [ ] **Step 6: Bouw-output controleren**

```bash
grep -o "Autibot denkt na" src/server/public/assets/*.js
grep -o "Geen bronnen (buiten de kennisbank)" src/server/public/assets/*.js
```

Expected: beide teksten worden gevonden.

- [ ] **Step 7: Commit**

```bash
git add client/src/components/LaadIndicator.tsx client/src/components/Bericht.tsx client/src/components/Chatvenster.tsx client/src/App.tsx
git commit -m "Chatvenster, berichten-bubbels en laad-indicator: volledige chat-flow"
```

---

### Task 6: Eindregressie en handmatige verificatie in de browser

**Files:** geen wijzigingen — dit is een pure verificatietaak.

**Interfaces:** geen (verifieert het geheel van Taak 2–5 tegen de `## Testen`-sectie van het ontwerpdocument).

- [ ] **Step 1: Backend-regressie**

```bash
npm test
npm run typecheck
```

Expected: alle 23 bestaande backend-tests slagen nog steeds (dit plan heeft geen backend-bestand aangeraakt behalve `package.json`-scripts); `typecheck` (nu root + `client/`) slaagt zonder fouten.

- [ ] **Step 2: Dev-server starten voor een echte browser-controle**

```bash
npm run dev
```

Wacht op de regel `Autibot draait op http://localhost:3000`.

- [ ] **Step 3: Handmatige/browser-gedreven verificatie (per de `## Testen`-sectie van het ontwerpdocument)**

Open `http://localhost:3000` in een browser (of drijf de app via een browser-tool) en doorloop:

1. **Geen doelgroep gekozen:** het invoerveld toont de plaatshouder "Kies eerst een doelgroep" en is uitgeschakeld.
2. **Doelgroep kiezen:** klik op een van de vier opties in de zijbalk → de knop wordt gemarkeerd als actief, het invoerveld wordt bruikbaar met plaatshouder "Stel je vraag over autisme...".
3. **Gedekte vraag** (vereist een geldige `ANTHROPIC_API_KEY` in de omgeving): stel een vraag die door de kennisbank gedekt wordt (bijv. "Wat is autisme?") → een "Autibot denkt na..."-bubbel verschijnt kort, daarna een antwoord-bubbel met tekst en een bronnenregel.
4. **Ongedekte vraag:** stel een vraag buiten de kennisbank (bijv. "Hoe repareer ik een lekkende kraan?") → het antwoord bevat de vaste weigeringstekst en "Geen bronnen (buiten de kennisbank)".
5. **Serverfout-pad:** stop de dev-server (Ctrl+C) terwijl de pagina open blijft, stel daarna een vraag → de `fetch`-aanroep faalt en de UI toont de fout "Kan de server niet bereiken. Controleer of Autibot draait." in plaats van vast te lopen.

Expected: alle vijf scenario's gedragen zich zoals hierboven beschreven.

- [ ] **Step 4: Dev-server stoppen**

Stop het `npm run dev`-proces (Ctrl+C, of `kill` als het op de achtergrond draaide).

- [ ] **Step 5: Klaar**

Geen commit nodig in deze taak — er zijn geen bestanden gewijzigd. Als Stap 3 een gedragsafwijking blootlegt, los die op in de betreffende taak (2–5), commit daar, en herhaal Taak 6 vanaf Stap 2.
