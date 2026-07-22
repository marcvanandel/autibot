# Grounded Q&A-chatbot MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Een lokaal draaiende demo van Autibot bouwen: een chatbot die vragen over autisme beantwoordt, uitsluitend gegrond in een kennisbank van markdown-bestanden, met een expliciete weigering wanneer een vraag niet gedekt is.

**Architecture:** Kennisbank (markdown + frontmatter) → `Retriever`-interface (MVP: `KeywordRetriever` op basis van `minisearch`) → `Orchestrator` (koppelt doelgroep, retrieval en generatie; bevat de hallucinatie-guard: geen relevante context → geen LLM-aanroep) → `LLMProvider`-interface (MVP: `ClaudeProvider`) → lokale webserver (Node `http`, statische HTML/JS-UI + `/api/chat`-endpoint). Zie `docs/superpowers/specs/2026-07-22-grounded-qa-chatbot-design.md` voor het volledige ontwerp en `adr/0001` t/m `adr/0007` voor de onderliggende beslissingen.

**Tech Stack:** TypeScript, Node.js (≥ 18), `minisearch` (keyword-retrieval), `gray-matter` (frontmatter-parsing), `@anthropic-ai/sdk` (Claude API), `vitest` (tests), `tsx` (lokaal draaien zonder losse buildstap).

## Global Constraints

- Taal/stack: TypeScript/Node.js (ADR-0004).
- Node.js ≥ 18 (voor ingebouwde `fetch` in tests en `node:fs/promises`).
- Model: `claude-opus-4-8`. Geen `temperature`/`top_p`/`top_k`-parameters op de Claude-aanroep (ADR-0007) — sturing verloopt via de system-prompt.
- Scope: alleen grounded Q&A, geen vervolgvraag-suggesties, geen personalisatie/geschiedenis (ADR-0002).
- Kennisbank: één gedeelde kennisbank, doelgroep via frontmatter-tag `zelf | ouder-naaste | professional | algemeen`; expliciete doelgroepkeuze vooraf, geen impliciete afleiding (ADR-0003).
- Retrieval: keyword/full-text search via `minisearch`, geen embeddings (ADR-0006).
- Naamgeving: componentnamen uit het ontwerp (`Retriever`, `Orchestrator`, `LLMProvider`, `KeywordRetriever`, `ClaudeProvider`) blijven Engels, zoals in het design-document. Overige identifiers, domeinbegrippen, UI-teksten en foutmeldingen zijn in het Nederlands.
- Content-curatie (het vullen van de kennisbank met inhoudelijk gevalideerde autisme-content) is expliciet buiten scope van dit plan — de kennisbank-content die in dit plan wordt toegevoegd is illustratief/voorbeeldmateriaal voor tests en de demo, geen gevalideerde informatie.

---

## File Structure

```
package.json
tsconfig.json
.gitignore
kennisbank/
  wat-is-autisme.md
  pgb-voor-ouders.md
src/
  index.ts
  kennisbank/
    types.ts
    loadKennisbank.ts
  retriever/
    Retriever.ts
    KeywordRetriever.ts
  llm/
    LLMProvider.ts
    prompts.ts
    ClaudeProvider.ts
  orchestrator/
    Orchestrator.ts
  server/
    server.ts
    public/
      index.html
      app.js
tests/
  fixtures/
    kennisbank-geldig/
      wat-is-autisme.md
      pgb-voor-ouders.md
    kennisbank-ongeldig/
      geen-titel.md
    kennisbank-leeg/
      .gitkeep
  loadKennisbank.test.ts
  KeywordRetriever.test.ts
  prompts.test.ts
  ClaudeProvider.test.ts
  Orchestrator.test.ts
  server.test.ts
```

- `src/kennisbank/`: laden en valideren van de kennisbank vanaf schijf.
- `src/retriever/`: het `Retriever`-contract en de keyword-implementatie.
- `src/llm/`: het `LLMProvider`-contract, de (pure, testbare) prompt-opbouw en de Claude-implementatie.
- `src/orchestrator/`: koppelt Retriever en LLMProvider, bevat de hallucinatie-guard.
- `src/server/`: lokale HTTP-server (API + statische UI-bestanden).
- `kennisbank/`: de daadwerkelijke (voorbeeld-)inhoud die de demo gebruikt.
- `tests/fixtures/`: kleine, vaste kennisbank-mapjes die alleen door tests gebruikt worden (los van de demo-kennisbank).

---

### Task 1: Project-opzet, kennisbank-format en -loader

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `.gitignore`
- Create: `src/kennisbank/types.ts`
- Create: `src/kennisbank/loadKennisbank.ts`
- Test: `tests/loadKennisbank.test.ts`
- Test fixtures: `tests/fixtures/kennisbank-geldig/wat-is-autisme.md`, `tests/fixtures/kennisbank-geldig/pgb-voor-ouders.md`, `tests/fixtures/kennisbank-ongeldig/geen-titel.md`, `tests/fixtures/kennisbank-leeg/.gitkeep`

**Interfaces:**
- Consumes: niets (eerste task).
- Produces: `Doelgroep` (union type `"zelf" | "ouder-naaste" | "professional" | "algemeen"`), `Fragment` (`{ id: string; titel: string; doelgroep: Doelgroep[]; inhoud: string; bestandspad: string }`), `laadKennisbank(map: string): Fragment[]` — gebruikt door Task 2 en verder.

- [ ] **Step 1: Project scaffolden**

Run:
```bash
npm init -y
npm install --save-dev typescript tsx vitest @types/node
npm install --save minisearch gray-matter @anthropic-ai/sdk
```

Expected: `package.json`, `package-lock.json` en `node_modules/` worden aangemaakt; `dependencies` en `devDependencies` bevatten de zojuist geïnstalleerde packages met hun daadwerkelijk geresolveerde versies (niet handmatig overschrijven).

- [ ] **Step 2: `package.json`-scripts instellen**

Open `package.json` en vervang het `"scripts"`-veld (laat `dependencies`/`devDependencies` ongemoeid) door:

```json
"scripts": {
  "dev": "tsx src/index.ts",
  "test": "vitest run",
  "typecheck": "tsc --noEmit"
}
```

- [ ] **Step 3: `tsconfig.json` schrijven**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "CommonJS",
    "moduleResolution": "node",
    "esModuleInterop": true,
    "strict": true,
    "skipLibCheck": true,
    "outDir": "dist",
    "rootDir": "src",
    "resolveJsonModule": true
  },
  "include": ["src"]
}
```

- [ ] **Step 4: `.gitignore` schrijven**

```
node_modules/
dist/
.env
```

- [ ] **Step 5: Kennisbank-types schrijven**

`src/kennisbank/types.ts`:

```ts
export type Doelgroep = "zelf" | "ouder-naaste" | "professional" | "algemeen";

export interface Fragment {
  id: string;
  titel: string;
  doelgroep: Doelgroep[];
  inhoud: string;
  bestandspad: string;
}
```

- [ ] **Step 6: Test-fixtures schrijven**

`tests/fixtures/kennisbank-geldig/wat-is-autisme.md`:

```markdown
---
titel: "Wat is autisme?"
doelgroep: [zelf, ouder-naaste, professional, algemeen]
---

Autisme, of ASS (Autisme Spectrum Stoornis), is een ontwikkelingsstoornis die van invloed is op hoe iemand de wereld waarneemt en ermee omgaat.
```

`tests/fixtures/kennisbank-geldig/pgb-voor-ouders.md`:

```markdown
---
titel: "Persoonsgebonden budget (pgb) voor ouders"
doelgroep: [ouder-naaste]
---

Ouders kunnen een persoonsgebonden budget (pgb) aanvragen bij de gemeente of het zorgkantoor om zelf passende begeleiding in te kopen.
```

`tests/fixtures/kennisbank-ongeldig/geen-titel.md`:

```markdown
---
doelgroep: [algemeen]
---

Deze tekst mist een titel in de frontmatter.
```

`tests/fixtures/kennisbank-leeg/.gitkeep`: leeg bestand (zorgt dat git de lege map bijhoudt; de loader filtert toch alleen op `.md`-bestanden, dus deze map blijft functioneel "leeg").

- [ ] **Step 7: Falende test schrijven**

`tests/loadKennisbank.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { join } from "node:path";
import { laadKennisbank } from "../src/kennisbank/loadKennisbank";

const FIXTURES = join(__dirname, "fixtures");

describe("laadKennisbank", () => {
  it("laadt geldige markdown-bestanden met frontmatter in fragmenten", () => {
    const fragmenten = laadKennisbank(join(FIXTURES, "kennisbank-geldig"));

    expect(fragmenten).toHaveLength(2);
    const watIsAutisme = fragmenten.find((f) => f.id === "wat-is-autisme");
    expect(watIsAutisme?.titel).toBe("Wat is autisme?");
    expect(watIsAutisme?.doelgroep).toEqual(["zelf", "ouder-naaste", "professional", "algemeen"]);
    expect(watIsAutisme?.inhoud).toContain("ontwikkelingsstoornis");
  });

  it("gooit een duidelijke fout als de kennisbank-map geen .md-bestanden bevat", () => {
    expect(() => laadKennisbank(join(FIXTURES, "kennisbank-leeg"))).toThrow(/leeg/i);
  });

  it("gooit een duidelijke fout als een bestand geen titel heeft", () => {
    expect(() => laadKennisbank(join(FIXTURES, "kennisbank-ongeldig"))).toThrow(/titel/i);
  });
});
```

- [ ] **Step 8: Test uitvoeren en verifiëren dat die faalt**

Run: `npx vitest run tests/loadKennisbank.test.ts`
Expected: FAIL — `Cannot find module '../src/kennisbank/loadKennisbank'` (het bestand bestaat nog niet).

- [ ] **Step 9: `loadKennisbank.ts` implementeren**

`src/kennisbank/loadKennisbank.ts`:

```ts
import { readdirSync, readFileSync } from "node:fs";
import { join, basename, extname } from "node:path";
import matter from "gray-matter";
import type { Fragment, Doelgroep } from "./types";

const GELDIGE_DOELGROEPEN: Doelgroep[] = ["zelf", "ouder-naaste", "professional", "algemeen"];

export function laadKennisbank(map: string): Fragment[] {
  let bestanden: string[];
  try {
    bestanden = readdirSync(map).filter((naam) => extname(naam) === ".md");
  } catch (fout) {
    throw new Error(`Kan kennisbank-map niet lezen: ${map} (${(fout as Error).message})`);
  }

  if (bestanden.length === 0) {
    throw new Error(`Kennisbank-map is leeg: ${map}. Er is minimaal één .md-bestand nodig.`);
  }

  return bestanden.map((bestandsnaam) => {
    const pad = join(map, bestandsnaam);
    const ruw = readFileSync(pad, "utf-8");
    const { data, content } = matter(ruw);

    if (typeof data.titel !== "string" || data.titel.trim() === "") {
      throw new Error(`Ontbrekende of lege 'titel' in frontmatter van ${pad}`);
    }

    const doelgroepRuw: unknown[] = Array.isArray(data.doelgroep) ? data.doelgroep : [data.doelgroep];
    const doelgroep = doelgroepRuw.filter((d): d is Doelgroep =>
      GELDIGE_DOELGROEPEN.includes(d as Doelgroep),
    );
    if (doelgroep.length === 0) {
      throw new Error(
        `Ontbrekende of ongeldige 'doelgroep' in frontmatter van ${pad}. Geldige waarden: ${GELDIGE_DOELGROEPEN.join(", ")}`,
      );
    }

    return {
      id: basename(bestandsnaam, ".md"),
      titel: data.titel,
      doelgroep,
      inhoud: content.trim(),
      bestandspad: pad,
    };
  });
}
```

- [ ] **Step 10: Test uitvoeren en verifiëren dat die slaagt**

Run: `npx vitest run tests/loadKennisbank.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 11: Typecheck**

Run: `npm run typecheck`
Expected: geen fouten.

- [ ] **Step 12: Commit**

```bash
git add package.json package-lock.json tsconfig.json .gitignore src/kennisbank tests/loadKennisbank.test.ts tests/fixtures
git commit -m "Project-opzet en kennisbank-loader met validatie"
```

---

### Task 2: Retriever — keyword-search met doelgroep-filtering

**Files:**
- Create: `src/retriever/Retriever.ts`
- Create: `src/retriever/KeywordRetriever.ts`
- Test: `tests/KeywordRetriever.test.ts`

**Interfaces:**
- Consumes: `Fragment`, `Doelgroep` (uit `src/kennisbank/types.ts`, Task 1).
- Produces: `GevondenFragment` (`{ id: string; titel: string; inhoud: string; bestandspad: string; score: number }`), `Retriever` (`{ search(vraag: string, doelgroep: Doelgroep, topN?: number): GevondenFragment[] }`), `KeywordRetriever` (implementeert `Retriever`, constructor `(fragmenten: Fragment[])`) — gebruikt door Task 3 (Orchestrator) en Task 5 (server-wiring).

- [ ] **Step 1: `Retriever`-interface schrijven**

`src/retriever/Retriever.ts`:

```ts
import type { Doelgroep } from "../kennisbank/types";

export interface GevondenFragment {
  id: string;
  titel: string;
  inhoud: string;
  bestandspad: string;
  score: number;
}

export interface Retriever {
  search(vraag: string, doelgroep: Doelgroep, topN?: number): GevondenFragment[];
}
```

- [ ] **Step 2: Falende test schrijven**

`tests/KeywordRetriever.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { KeywordRetriever } from "../src/retriever/KeywordRetriever";
import type { Fragment } from "../src/kennisbank/types";

const FRAGMENTEN: Fragment[] = [
  {
    id: "wat-is-autisme",
    titel: "Wat is autisme?",
    doelgroep: ["algemeen"],
    inhoud: "Autisme is een ontwikkelingsstoornis die de sociale communicatie beinvloedt.",
    bestandspad: "wat-is-autisme.md",
  },
  {
    id: "pgb-voor-ouders",
    titel: "PGB aanvragen als ouder",
    doelgroep: ["ouder-naaste"],
    inhoud: "Ouders kunnen een persoonsgebonden budget (pgb) aanvragen voor extra begeleiding.",
    bestandspad: "pgb-voor-ouders.md",
  },
  {
    id: "diagnostiek-professional",
    titel: "Diagnostisch proces voor professionals",
    doelgroep: ["professional"],
    inhoud: "Het diagnostisch proces volgt de DSM-5 criteria voor autismespectrumstoornis.",
    bestandspad: "diagnostiek-professional.md",
  },
];

describe("KeywordRetriever", () => {
  it("vindt het relevante fragment op basis van trefwoorden", () => {
    const retriever = new KeywordRetriever(FRAGMENTEN);

    const resultaten = retriever.search("Hoe vraag ik een pgb aan?", "ouder-naaste");

    expect(resultaten[0]?.id).toBe("pgb-voor-ouders");
  });

  it("filtert fragmenten die niet bij de gekozen doelgroep horen", () => {
    const retriever = new KeywordRetriever(FRAGMENTEN);

    const resultaten = retriever.search("DSM-5 criteria diagnostiek", "ouder-naaste");

    expect(resultaten.find((r) => r.id === "diagnostiek-professional")).toBeUndefined();
  });

  it("toont algemene fragmenten aan elke doelgroep", () => {
    const retriever = new KeywordRetriever(FRAGMENTEN);

    const resultaten = retriever.search("Wat is autisme", "professional");

    expect(resultaten.find((r) => r.id === "wat-is-autisme")).toBeDefined();
  });

  it("toont alle fragmenten aan de doelgroep 'algemeen'", () => {
    const retriever = new KeywordRetriever(FRAGMENTEN);

    const resultaten = retriever.search("persoonsgebonden budget", "algemeen");

    expect(resultaten.find((r) => r.id === "pgb-voor-ouders")).toBeDefined();
  });
});
```

- [ ] **Step 3: Test uitvoeren en verifiëren dat die faalt**

Run: `npx vitest run tests/KeywordRetriever.test.ts`
Expected: FAIL — `Cannot find module '../src/retriever/KeywordRetriever'`.

- [ ] **Step 4: `KeywordRetriever` implementeren**

`src/retriever/KeywordRetriever.ts`:

```ts
import MiniSearch from "minisearch";
import type { Fragment, Doelgroep } from "../kennisbank/types";
import type { GevondenFragment, Retriever } from "./Retriever";

const STANDAARD_TOP_N = 3;

function magFragmentZien(fragment: Fragment, gekozenDoelgroep: Doelgroep): boolean {
  if (gekozenDoelgroep === "algemeen") return true;
  return fragment.doelgroep.includes(gekozenDoelgroep) || fragment.doelgroep.includes("algemeen");
}

export class KeywordRetriever implements Retriever {
  private readonly index: MiniSearch<Fragment>;
  private readonly fragmentenPerId: Map<string, Fragment>;

  constructor(fragmenten: Fragment[]) {
    this.fragmentenPerId = new Map(fragmenten.map((f) => [f.id, f]));
    this.index = new MiniSearch<Fragment>({
      idField: "id",
      fields: ["titel", "inhoud"],
      storeFields: ["titel", "inhoud", "bestandspad"],
    });
    this.index.addAll(fragmenten);
  }

  search(vraag: string, doelgroep: Doelgroep, topN: number = STANDAARD_TOP_N): GevondenFragment[] {
    const resultaten = this.index.search(vraag, { prefix: true, fuzzy: 0.2 });

    return resultaten
      .filter((resultaat) => {
        const fragment = this.fragmentenPerId.get(String(resultaat.id));
        return fragment !== undefined && magFragmentZien(fragment, doelgroep);
      })
      .slice(0, topN)
      .map((resultaat) => {
        const fragment = this.fragmentenPerId.get(String(resultaat.id))!;
        return {
          id: fragment.id,
          titel: fragment.titel,
          inhoud: fragment.inhoud,
          bestandspad: fragment.bestandspad,
          score: resultaat.score,
        };
      });
  }
}
```

> `minisearch`-opties (`fields`, `storeFields`, `idField`, `search`-opties zoals `prefix`/`fuzzy`) zijn hier gebaseerd op de gedocumenteerde API van het package. Mocht de geïnstalleerde versie een net andere signatuur hebben, corrigeer dit dan op basis van de compilerfoutmelding — dat raakt alleen deze klasse.

- [ ] **Step 5: Test uitvoeren en verifiëren dat die slaagt**

Run: `npx vitest run tests/KeywordRetriever.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 6: Typecheck**

Run: `npm run typecheck`
Expected: geen fouten.

- [ ] **Step 7: Commit**

```bash
git add src/retriever tests/KeywordRetriever.test.ts
git commit -m "Retriever-interface en keyword-gebaseerde implementatie met doelgroep-filtering"
```

---

### Task 3: LLMProvider — prompt-opbouw en ClaudeProvider

**Files:**
- Create: `src/llm/LLMProvider.ts`
- Create: `src/llm/prompts.ts`
- Create: `src/llm/ClaudeProvider.ts`
- Test: `tests/prompts.test.ts`
- Test: `tests/ClaudeProvider.test.ts`

**Interfaces:**
- Consumes: `Doelgroep` (Task 1), `GevondenFragment` (Task 2).
- Produces: `Antwoord` (`{ tekst: string; bronnen: GevondenFragment[] }`), `LLMProvider` (`{ answer(vraag: string, fragmenten: GevondenFragment[], doelgroep: Doelgroep): Promise<Antwoord> }`), `ClaudeProvider` (implementeert `LLMProvider`) — gebruikt door Task 4 (Orchestrator) en Task 5 (server-wiring).

- [ ] **Step 1: `LLMProvider`-interface schrijven**

`src/llm/LLMProvider.ts`:

```ts
import type { Doelgroep } from "../kennisbank/types";
import type { GevondenFragment } from "../retriever/Retriever";

export interface Antwoord {
  tekst: string;
  bronnen: GevondenFragment[];
}

export interface LLMProvider {
  answer(vraag: string, fragmenten: GevondenFragment[], doelgroep: Doelgroep): Promise<Antwoord>;
}
```

- [ ] **Step 2: Falende test voor prompt-opbouw schrijven**

`tests/prompts.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { bouwGebruikersprompt, bouwSystemPrompt } from "../src/llm/prompts";
import type { GevondenFragment } from "../src/retriever/Retriever";

describe("bouwSystemPrompt", () => {
  it("bevat de grounding-instructie en een doelgroep-specifieke toonaanwijzing", () => {
    const prompt = bouwSystemPrompt("professional");

    expect(prompt).toContain("uitsluitend op basis van de context");
    expect(prompt).toContain("vaktaal");
  });
});

describe("bouwGebruikersprompt", () => {
  it("neemt de titel en inhoud van elk fragment op als genummerde bron", () => {
    const fragmenten: GevondenFragment[] = [
      { id: "a", titel: "Titel A", inhoud: "Inhoud A", bestandspad: "a.md", score: 1 },
      { id: "b", titel: "Titel B", inhoud: "Inhoud B", bestandspad: "b.md", score: 0.5 },
    ];

    const prompt = bouwGebruikersprompt("Wat is X?", fragmenten);

    expect(prompt).toContain("[Bron 1: Titel A]");
    expect(prompt).toContain("Inhoud A");
    expect(prompt).toContain("[Bron 2: Titel B]");
    expect(prompt).toContain("Vraag: Wat is X?");
  });
});
```

- [ ] **Step 3: Test uitvoeren en verifiëren dat die faalt**

Run: `npx vitest run tests/prompts.test.ts`
Expected: FAIL — `Cannot find module '../src/llm/prompts'`.

- [ ] **Step 4: `prompts.ts` implementeren**

`src/llm/prompts.ts`:

```ts
import type { Doelgroep } from "../kennisbank/types";
import type { GevondenFragment } from "../retriever/Retriever";

const TOONINSTRUCTIE_PER_DOELGROEP: Record<Doelgroep, string> = {
  zelf: "Spreek de gebruiker direct aan en gebruik concrete, toegankelijke taal.",
  "ouder-naaste":
    "Leg uit hoe dit voor een naaste met autisme kan gelden en wat een ouder/naaste concreet kan doen.",
  professional:
    "Gebruik vaktaal waar relevant en verwijs naar onderliggende criteria of bronnen indien beschikbaar.",
  algemeen: "Gebruik heldere, neutrale taal die voor een breed publiek begrijpelijk is.",
};

export function bouwSystemPrompt(doelgroep: Doelgroep): string {
  return [
    "Je bent Autibot, een assistent die vragen over autisme (ASS) beantwoordt.",
    "Antwoord uitsluitend op basis van de context die hieronder in de gebruikersvraag wordt meegegeven.",
    "Als het antwoord niet in de gegeven context staat, zeg dat dan expliciet en verzin geen informatie.",
    TOONINSTRUCTIE_PER_DOELGROEP[doelgroep],
  ].join(" ");
}

export function bouwGebruikersprompt(vraag: string, fragmenten: GevondenFragment[]): string {
  const context = fragmenten
    .map((fragment, index) => `[Bron ${index + 1}: ${fragment.titel}]\n${fragment.inhoud}`)
    .join("\n\n");

  return `Context:\n${context}\n\nVraag: ${vraag}`;
}
```

- [ ] **Step 5: Test uitvoeren en verifiëren dat die slaagt**

Run: `npx vitest run tests/prompts.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 6: Falende test voor `ClaudeProvider` schrijven**

`tests/ClaudeProvider.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";
import { ClaudeProvider } from "../src/llm/ClaudeProvider";
import type { GevondenFragment } from "../src/retriever/Retriever";

describe("ClaudeProvider", () => {
  it("geeft de tekst van het eerste text-blok terug, samen met de meegegeven bronnen", async () => {
    const fragmenten: GevondenFragment[] = [
      { id: "a", titel: "Titel A", inhoud: "Inhoud A", bestandspad: "a.md", score: 1 },
    ];
    const nepClient = {
      messages: {
        create: vi.fn().mockResolvedValue({
          content: [
            { type: "thinking", thinking: "..." },
            { type: "text", text: "Dit is het antwoord." },
          ],
        }),
      },
    };

    const provider = new ClaudeProvider(nepClient as any);
    const antwoord = await provider.answer("Een vraag", fragmenten, "algemeen");

    expect(antwoord.tekst).toBe("Dit is het antwoord.");
    expect(antwoord.bronnen).toEqual(fragmenten);
    expect(nepClient.messages.create).toHaveBeenCalledWith(
      expect.objectContaining({ model: "claude-opus-4-8" }),
    );
    const aanroep = nepClient.messages.create.mock.calls[0][0];
    expect(aanroep.temperature).toBeUndefined();
  });
});
```

- [ ] **Step 7: Test uitvoeren en verifiëren dat die faalt**

Run: `npx vitest run tests/ClaudeProvider.test.ts`
Expected: FAIL — `Cannot find module '../src/llm/ClaudeProvider'`.

- [ ] **Step 8: `ClaudeProvider` implementeren**

`src/llm/ClaudeProvider.ts`:

```ts
import Anthropic from "@anthropic-ai/sdk";
import type { Doelgroep } from "../kennisbank/types";
import type { GevondenFragment } from "../retriever/Retriever";
import type { Antwoord, LLMProvider } from "./LLMProvider";
import { bouwGebruikersprompt, bouwSystemPrompt } from "./prompts";

const MODEL = "claude-opus-4-8";
const MAX_TOKENS = 1024;

export class ClaudeProvider implements LLMProvider {
  private readonly client: Anthropic;

  constructor(client: Anthropic = new Anthropic()) {
    this.client = client;
  }

  async answer(
    vraag: string,
    fragmenten: GevondenFragment[],
    doelgroep: Doelgroep,
  ): Promise<Antwoord> {
    const response = await this.client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      thinking: { type: "adaptive" },
      system: bouwSystemPrompt(doelgroep),
      messages: [{ role: "user", content: bouwGebruikersprompt(vraag, fragmenten) }],
    });

    const tekstBlok = response.content.find(
      (blok): blok is Extract<typeof blok, { type: "text" }> => blok.type === "text",
    );

    return { tekst: tekstBlok?.text ?? "", bronnen: fragmenten };
  }
}
```

> Geen `temperature`/`top_p`/`top_k` — zie ADR-0007. De constructor accepteert een optionele `Anthropic`-client (standaard `new Anthropic()`, die `ANTHROPIC_API_KEY` uit de omgeving leest) zodat tests een nep-client kunnen injecteren zonder de echte API aan te roepen.

- [ ] **Step 9: Test uitvoeren en verifiëren dat die slaagt**

Run: `npx vitest run tests/ClaudeProvider.test.ts`
Expected: PASS (1 test).

- [ ] **Step 10: Typecheck**

Run: `npm run typecheck`
Expected: geen fouten. Als het filteren op `blok.type === "text"` een TypeScript-fout geeft omdat de content-bloktypen van de geïnstalleerde SDK-versie afwijken, vervang de `find`-callback dan door een eenvoudige `for`-lus met een `if (blok.type === "text")`-check — de intentie (eerste tekstblok pakken) blijft hetzelfde.

- [ ] **Step 11: Commit**

```bash
git add src/llm tests/prompts.test.ts tests/ClaudeProvider.test.ts
git commit -m "LLMProvider-interface, prompt-opbouw en ClaudeProvider (Claude API, geen temperature)"
```

---

### Task 4: Orchestrator — hallucinatie-guard

**Files:**
- Create: `src/orchestrator/Orchestrator.ts`
- Test: `tests/Orchestrator.test.ts`

**Interfaces:**
- Consumes: `Retriever`/`GevondenFragment` (Task 2), `LLMProvider`/`Antwoord` (Task 3), `Doelgroep` (Task 1).
- Produces: `Orchestrator` (constructor `(retriever: Retriever, llmProvider: LLMProvider)`, methode `beantwoord(vraag: string, doelgroep: Doelgroep): Promise<Antwoord>`) — gebruikt door Task 5 (server-wiring) en Task 6 (entrypoint).

- [ ] **Step 1: Falende tests schrijven**

`tests/Orchestrator.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";
import { Orchestrator } from "../src/orchestrator/Orchestrator";
import { KeywordRetriever } from "../src/retriever/KeywordRetriever";
import { laadKennisbank } from "../src/kennisbank/loadKennisbank";
import type { Retriever, GevondenFragment } from "../src/retriever/Retriever";
import type { LLMProvider, Antwoord } from "../src/llm/LLMProvider";
import { join } from "node:path";

function maakFakeRetriever(resultaten: GevondenFragment[]): Retriever {
  return { search: vi.fn().mockReturnValue(resultaten) };
}

function maakFakeLLMProvider(antwoord: Antwoord): LLMProvider {
  return { answer: vi.fn().mockResolvedValue(antwoord) };
}

describe("Orchestrator", () => {
  it("roept de LLMProvider aan als er relevante fragmenten gevonden zijn", async () => {
    const fragment: GevondenFragment = {
      id: "a",
      titel: "Titel A",
      inhoud: "Inhoud A",
      bestandspad: "a.md",
      score: 5,
    };
    const retriever = maakFakeRetriever([fragment]);
    const verwachtAntwoord: Antwoord = { tekst: "Een antwoord.", bronnen: [fragment] };
    const llmProvider = maakFakeLLMProvider(verwachtAntwoord);
    const orchestrator = new Orchestrator(retriever, llmProvider);

    const antwoord = await orchestrator.beantwoord("Een vraag", "algemeen");

    expect(llmProvider.answer).toHaveBeenCalledWith("Een vraag", [fragment], "algemeen");
    expect(antwoord).toEqual(verwachtAntwoord);
  });

  it("roept de LLMProvider niet aan en geeft 'ik weet het niet' als er geen fragmenten gevonden zijn", async () => {
    const retriever = maakFakeRetriever([]);
    const llmProvider = maakFakeLLMProvider({
      tekst: "zou niet gebruikt moeten worden",
      bronnen: [],
    });
    const orchestrator = new Orchestrator(retriever, llmProvider);

    const antwoord = await orchestrator.beantwoord("Een ongedekte vraag", "algemeen");

    expect(llmProvider.answer).not.toHaveBeenCalled();
    expect(antwoord.tekst).toContain("geen betrouwbare informatie");
    expect(antwoord.bronnen).toEqual([]);
  });

  it("roept de LLMProvider niet aan als alle gevonden fragmenten onder de relevantiedrempel liggen", async () => {
    const zwakFragment: GevondenFragment = {
      id: "a",
      titel: "Titel A",
      inhoud: "Inhoud A",
      bestandspad: "a.md",
      score: 0.1,
    };
    const retriever = maakFakeRetriever([zwakFragment]);
    const llmProvider = maakFakeLLMProvider({
      tekst: "zou niet gebruikt moeten worden",
      bronnen: [],
    });
    const orchestrator = new Orchestrator(retriever, llmProvider);

    const antwoord = await orchestrator.beantwoord("Vage vraag", "algemeen");

    expect(llmProvider.answer).not.toHaveBeenCalled();
    expect(antwoord.bronnen).toEqual([]);
  });
});

describe("Orchestrator met KeywordRetriever (golden scenario's)", () => {
  const fragmenten = laadKennisbank(join(__dirname, "fixtures", "kennisbank-geldig"));
  const retriever = new KeywordRetriever(fragmenten);

  it("geeft bij een gedekte vraag het antwoord van de LLMProvider, gebaseerd op de juiste bron", async () => {
    const llmProvider = maakFakeLLMProvider({ tekst: "Een gegrond antwoord.", bronnen: [] });
    const orchestrator = new Orchestrator(retriever, llmProvider);

    const antwoord = await orchestrator.beantwoord("Wat is autisme?", "algemeen");

    expect(llmProvider.answer).toHaveBeenCalled();
    const gebruikteFragmenten = (llmProvider.answer as ReturnType<typeof vi.fn>).mock
      .calls[0][1] as GevondenFragment[];
    expect(gebruikteFragmenten.some((f) => f.id === "wat-is-autisme")).toBe(true);
    expect(antwoord.tekst).toBe("Een gegrond antwoord.");
  });

  it("geeft bij een ongedekte vraag 'ik weet het niet', zonder de LLMProvider aan te roepen", async () => {
    const llmProvider = maakFakeLLMProvider({
      tekst: "zou niet gebruikt moeten worden",
      bronnen: [],
    });
    const orchestrator = new Orchestrator(retriever, llmProvider);

    const antwoord = await orchestrator.beantwoord(
      "Wat is de hoofdstad van Mongolie?",
      "algemeen",
    );

    expect(llmProvider.answer).not.toHaveBeenCalled();
    expect(antwoord.tekst).toContain("geen betrouwbare informatie");
  });
});
```

- [ ] **Step 2: Test uitvoeren en verifiëren dat die faalt**

Run: `npx vitest run tests/Orchestrator.test.ts`
Expected: FAIL — `Cannot find module '../src/orchestrator/Orchestrator'`.

- [ ] **Step 3: `Orchestrator` implementeren**

`src/orchestrator/Orchestrator.ts`:

```ts
import type { Doelgroep } from "../kennisbank/types";
import type { Retriever } from "../retriever/Retriever";
import type { Antwoord, LLMProvider } from "../llm/LLMProvider";

// minisearch-scores zijn niet genormaliseerd naar een vaste 0-1-schaal; deze
// drempel is een startpunt en verdient bijstelling zodra er echte
// gebruikersvragen tegen de kennisbank getest zijn.
const RELEVANTIE_DREMPEL = 1;

const IK_WEET_HET_NIET: Antwoord = {
  tekst:
    "Ik heb hier geen betrouwbare informatie over in mijn kennisbank. Ik kan dus geen antwoord geven op deze vraag.",
  bronnen: [],
};

export class Orchestrator {
  constructor(
    private readonly retriever: Retriever,
    private readonly llmProvider: LLMProvider,
  ) {}

  async beantwoord(vraag: string, doelgroep: Doelgroep): Promise<Antwoord> {
    const fragmenten = this.retriever.search(vraag, doelgroep);
    const relevanteFragmenten = fragmenten.filter((f) => f.score >= RELEVANTIE_DREMPEL);

    if (relevanteFragmenten.length === 0) {
      return IK_WEET_HET_NIET;
    }

    return this.llmProvider.answer(vraag, relevanteFragmenten, doelgroep);
  }
}
```

- [ ] **Step 4: Test uitvoeren en verifiëren dat die slaagt**

Run: `npx vitest run tests/Orchestrator.test.ts`
Expected: PASS (5 tests). Als de golden-scenario-tests falen omdat `RELEVANTIE_DREMPEL` niet aansluit bij de scores die `KeywordRetriever` voor de fixture-vragen teruggeeft, pas de constante dan aan totdat de gedekte vraag een resultaat oplevert en de ongedekte vraag niet.

- [ ] **Step 5: Typecheck**

Run: `npm run typecheck`
Expected: geen fouten.

- [ ] **Step 6: Commit**

```bash
git add src/orchestrator tests/Orchestrator.test.ts
git commit -m "Orchestrator met hallucinatie-guard (geen relevante context -> geen LLM-call)"
```

---

### Task 5: Lokale webserver — API en statische UI

**Files:**
- Create: `src/server/server.ts`
- Create: `src/server/public/index.html`
- Create: `src/server/public/app.js`
- Test: `tests/server.test.ts`

**Interfaces:**
- Consumes: `Orchestrator` (Task 4).
- Produces: `maakServer(orchestrator: Orchestrator, publicMap: string): http.Server` — gebruikt door Task 6 (entrypoint).

- [ ] **Step 1: Falende tests schrijven**

`tests/server.test.ts`:

```ts
import { afterEach, describe, expect, it, vi } from "vitest";
import type { AddressInfo } from "node:net";
import { join } from "node:path";
import { maakServer } from "../src/server/server";
import type { Orchestrator } from "../src/orchestrator/Orchestrator";

const PUBLIC_MAP = join(__dirname, "..", "src", "server", "public");

describe("server", () => {
  let server: ReturnType<typeof maakServer> | undefined;

  afterEach(() => {
    server?.close();
  });

  it("geeft het antwoord van de Orchestrator terug als JSON op POST /api/chat", async () => {
    const fakeOrchestrator = {
      beantwoord: vi.fn().mockResolvedValue({ tekst: "Een antwoord.", bronnen: [] }),
    } as unknown as Orchestrator;

    server = maakServer(fakeOrchestrator, PUBLIC_MAP);
    await new Promise<void>((resolve) => server!.listen(0, resolve));
    const poort = (server.address() as AddressInfo).port;

    const response = await fetch(`http://localhost:${poort}/api/chat`, {
      method: "POST",
      body: JSON.stringify({ vraag: "Een vraag", doelgroep: "algemeen" }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ tekst: "Een antwoord.", bronnen: [] });
    expect(fakeOrchestrator.beantwoord).toHaveBeenCalledWith("Een vraag", "algemeen");
  });

  it("geeft een 400 als 'doelgroep' ontbreekt of ongeldig is", async () => {
    const fakeOrchestrator = { beantwoord: vi.fn() } as unknown as Orchestrator;
    server = maakServer(fakeOrchestrator, PUBLIC_MAP);
    await new Promise<void>((resolve) => server!.listen(0, resolve));
    const poort = (server.address() as AddressInfo).port;

    const response = await fetch(`http://localhost:${poort}/api/chat`, {
      method: "POST",
      body: JSON.stringify({ vraag: "Een vraag", doelgroep: "niet-bestaand" }),
    });

    expect(response.status).toBe(400);
    expect(fakeOrchestrator.beantwoord).not.toHaveBeenCalled();
  });

  it("serveert index.html op GET /", async () => {
    const fakeOrchestrator = { beantwoord: vi.fn() } as unknown as Orchestrator;
    server = maakServer(fakeOrchestrator, PUBLIC_MAP);
    await new Promise<void>((resolve) => server!.listen(0, resolve));
    const poort = (server.address() as AddressInfo).port;

    const response = await fetch(`http://localhost:${poort}/`);
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(html).toContain("<title>Autibot</title>");
  });
});
```

- [ ] **Step 2: Test uitvoeren en verifiëren dat die faalt**

Run: `npx vitest run tests/server.test.ts`
Expected: FAIL — `Cannot find module '../src/server/server'`.

- [ ] **Step 3: `server.ts` implementeren**

`src/server/server.ts`:

```ts
import { createServer, type Server } from "node:http";
import { readFile } from "node:fs/promises";
import { join, extname } from "node:path";
import type { Orchestrator } from "../orchestrator/Orchestrator";
import type { Doelgroep } from "../kennisbank/types";

const GELDIGE_DOELGROEPEN: Doelgroep[] = ["zelf", "ouder-naaste", "professional", "algemeen"];
const CONTENT_TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
};

export function maakServer(orchestrator: Orchestrator, publicMap: string): Server {
  return createServer((req, res) => {
    if (req.method === "POST" && req.url === "/api/chat") {
      let body = "";
      req.on("data", (chunk) => (body += chunk));
      req.on("end", async () => {
        try {
          const payload = JSON.parse(body) as { vraag?: unknown; doelgroep?: unknown };

          if (typeof payload.vraag !== "string" || payload.vraag.trim() === "") {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ fout: "Veld 'vraag' ontbreekt of is leeg." }));
            return;
          }
          if (!GELDIGE_DOELGROEPEN.includes(payload.doelgroep as Doelgroep)) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(
              JSON.stringify({
                fout: `Veld 'doelgroep' moet een van deze waarden zijn: ${GELDIGE_DOELGROEPEN.join(", ")}`,
              }),
            );
            return;
          }

          const antwoord = await orchestrator.beantwoord(
            payload.vraag,
            payload.doelgroep as Doelgroep,
          );
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify(antwoord));
        } catch {
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ fout: "Er ging iets mis bij het beantwoorden van de vraag." }));
        }
      });
      return;
    }

    const pad = req.url === "/" ? "/index.html" : (req.url ?? "/index.html");
    readFile(join(publicMap, pad))
      .then((bestand) => {
        const contentType = CONTENT_TYPES[extname(pad)] ?? "application/octet-stream";
        res.writeHead(200, { "Content-Type": contentType });
        res.end(bestand);
      })
      .catch(() => {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("Niet gevonden");
      });
  });
}
```

- [ ] **Step 4: Statische UI-bestanden schrijven**

`src/server/public/index.html`:

```html
<!doctype html>
<html lang="nl">
<head>
  <meta charset="utf-8" />
  <title>Autibot</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 40rem; margin: 2rem auto; padding: 0 1rem; }
    #doelgroepkeuze button { display: block; width: 100%; margin: 0.5rem 0; padding: 0.75rem; font-size: 1rem; }
    #chat { display: none; }
    #antwoorden { margin-top: 1rem; }
    .antwoord { border-left: 3px solid #444; padding-left: 0.75rem; margin-bottom: 1rem; }
    .bronnen { font-size: 0.85rem; color: #555; }
    #vraagInvoer { width: 100%; padding: 0.5rem; font-size: 1rem; box-sizing: border-box; }
  </style>
</head>
<body>
  <h1>Autibot</h1>

  <div id="doelgroepkeuze">
    <p>Voor wie zoek je deze informatie?</p>
    <button data-doelgroep="zelf">Ikzelf (ik heb autisme)</button>
    <button data-doelgroep="ouder-naaste">Ouder / naaste</button>
    <button data-doelgroep="professional">Professional</button>
    <button data-doelgroep="algemeen">Weet ik niet / algemeen</button>
  </div>

  <div id="chat">
    <form id="vraagFormulier">
      <input id="vraagInvoer" type="text" placeholder="Stel je vraag over autisme..." required />
      <button type="submit">Vraag</button>
    </form>
    <div id="antwoorden"></div>
  </div>

  <script src="/app.js"></script>
</body>
</html>
```

`src/server/public/app.js`:

```js
let gekozenDoelgroep = null;

document.querySelectorAll("#doelgroepkeuze button").forEach((knop) => {
  knop.addEventListener("click", () => {
    gekozenDoelgroep = knop.dataset.doelgroep;
    document.getElementById("doelgroepkeuze").style.display = "none";
    document.getElementById("chat").style.display = "block";
  });
});

document.getElementById("vraagFormulier").addEventListener("submit", async (event) => {
  event.preventDefault();
  const invoer = document.getElementById("vraagInvoer");
  const vraag = invoer.value.trim();
  if (!vraag) return;
  invoer.value = "";

  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ vraag, doelgroep: gekozenDoelgroep }),
  });
  const data = await response.json();

  const container = document.getElementById("antwoorden");
  const blok = document.createElement("div");
  blok.className = "antwoord";

  if (data.fout) {
    blok.textContent = `Fout: ${data.fout}`;
  } else {
    const bronnenTekst = data.bronnen.length
      ? `Bronnen: ${data.bronnen.map((b) => b.titel).join(", ")}`
      : "Geen bronnen (buiten de kennisbank)";
    blok.innerHTML = `<p><strong>Vraag:</strong> ${vraag}</p><p>${data.tekst}</p><p class="bronnen">${bronnenTekst}</p>`;
  }
  container.prepend(blok);
});
```

- [ ] **Step 5: Test uitvoeren en verifiëren dat die slaagt**

Run: `npx vitest run tests/server.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 6: Typecheck**

Run: `npm run typecheck`
Expected: geen fouten.

- [ ] **Step 7: Commit**

```bash
git add src/server tests/server.test.ts
git commit -m "Lokale webserver: /api/chat-endpoint en statische chat-UI"
```

---

### Task 6: Alles verbinden, voorbeeld-kennisbank en handmatige smoke test

**Files:**
- Create: `src/index.ts`
- Create: `kennisbank/wat-is-autisme.md`
- Create: `kennisbank/pgb-voor-ouders.md`

**Interfaces:**
- Consumes: `laadKennisbank` (Task 1), `KeywordRetriever` (Task 2), `ClaudeProvider` (Task 3), `Orchestrator` (Task 4), `maakServer` (Task 5).
- Produces: niets — dit is het startpunt van de applicatie (`npm run dev`).

- [ ] **Step 1: Voorbeeld-kennisbank schrijven**

> Dit is illustratieve voorbeeldcontent voor de demo en de tests hierboven — geen inhoudelijk gevalideerde autisme-informatie. Het daadwerkelijk vullen van de kennisbank met betrouwbare content is een apart traject (zie het design-document).

`kennisbank/wat-is-autisme.md`:

```markdown
---
titel: "Wat is autisme?"
doelgroep: [zelf, ouder-naaste, professional, algemeen]
---

Autisme, of ASS (Autisme Spectrum Stoornis), is een aangeboren ontwikkelingsstoornis die van invloed is op hoe iemand de wereld waarneemt, communiceert en sociale relaties aangaat. Autisme uit zich bij iedereen anders; vandaar de term "spectrum".
```

`kennisbank/pgb-voor-ouders.md`:

```markdown
---
titel: "Persoonsgebonden budget (pgb) voor ouders"
doelgroep: [ouder-naaste]
---

Ouders van een kind met autisme kunnen in Nederland een persoonsgebonden budget (pgb) aanvragen bij de gemeente of het zorgkantoor, om zelf passende begeleiding of zorg in te kopen.
```

- [ ] **Step 2: Entrypoint schrijven**

`src/index.ts`:

```ts
import { join } from "node:path";
import { laadKennisbank } from "./kennisbank/loadKennisbank";
import { KeywordRetriever } from "./retriever/KeywordRetriever";
import { ClaudeProvider } from "./llm/ClaudeProvider";
import { Orchestrator } from "./orchestrator/Orchestrator";
import { maakServer } from "./server/server";

const KENNISBANK_MAP = process.env.KENNISBANK_MAP ?? join(__dirname, "..", "kennisbank");
const PUBLIC_MAP = join(__dirname, "server", "public");
const POORT = Number(process.env.POORT ?? 3000);

function start(): void {
  const fragmenten = laadKennisbank(KENNISBANK_MAP);
  const retriever = new KeywordRetriever(fragmenten);
  const llmProvider = new ClaudeProvider();
  const orchestrator = new Orchestrator(retriever, llmProvider);

  const server = maakServer(orchestrator, PUBLIC_MAP);
  server.listen(POORT, () => {
    console.log(`Autibot draait op http://localhost:${POORT}`);
  });
}

start();
```

- [ ] **Step 3: Alle geautomatiseerde tests nogmaals uitvoeren**

Run: `npm test`
Expected: alle tests (Task 1 t/m 5) slagen.

- [ ] **Step 4: Typecheck**

Run: `npm run typecheck`
Expected: geen fouten.

- [ ] **Step 5: Commit**

```bash
git add src/index.ts kennisbank
git commit -m "Entrypoint: kennisbank, retriever, LLMProvider en server aan elkaar knopen"
```

- [ ] **Step 6: Handmatige smoke test met de echte Claude API**

Dit valt buiten de geautomatiseerde tests (zie het design-document: echte LLM-output wordt niet geautomatiseerd getest). Voer uit:

```bash
export ANTHROPIC_API_KEY="<jouw-eigen-key-uit-de-console>"
npm run dev
```

Open `http://localhost:3000` in de browser en controleer:

1. Je krijgt eerst de doelgroepkeuze te zien (zelf / ouder-naaste / professional / algemeen).
2. Kies bijvoorbeeld "ouder-naaste" en stel de vraag "Wat is een pgb?" — je krijgt een antwoord dat gebaseerd is op `pgb-voor-ouders.md`, met die bron zichtbaar onder het antwoord.
3. Stel een vraag die duidelijk niet in de kennisbank staat, bijvoorbeeld "Wat is de hoofdstad van Mongolië?" — je krijgt het "ik weet dit niet"-antwoord, zonder dat er een Claude-aanroep is gedaan (te zien aan het ontbreken van API-gebruik/latency voor die vraag).
4. Stel een vraag die wél over autisme gaat maar niet in de kennisbank staat, bijvoorbeeld "Welke medicatie helpt bij autisme?" — controleer dat Claude weigert te antwoorden op basis van de ontbrekende context, in plaats van iets te verzinnen.

Als stap 4 tegenvalt (het model geeft toch een antwoord buiten de context), is de eerste plek om bij te sturen de system-prompt in `src/llm/prompts.ts` (zie ADR-0007) — niet een sampling-parameter.

---

## Self-Review

**Spec-dekking:** Elk onderdeel uit het design-document is gedekt — kennisbank-format (Task 1), Retriever/KeywordRetriever met doelgroep-weging (Task 2), LLMProvider/ClaudeProvider zonder temperature (Task 3, ADR-0007), Orchestrator met hallucinatie-guard (Task 4), lokale chat-UI via een webserver (Task 5), en de bekabeling plus handmatige smoke test op echte Claude-output (Task 6). Vervolgvraag-suggesties, personalisatie en content-curatie zijn bewust buiten scope gelaten (ADR-0002), zoals in het ontwerp afgesproken.

**Placeholder-scan:** geen "TBD"/"implementeer later"-passages; elke stap bevat volledige, uitvoerbare code. De twee plekken waar ik expliciet ruimte voor bijstelling laat (de `minisearch`-optievorm in Task 2, de relevantiedrempel in Task 4) zijn geen placeholders maar concrete standaardwaarden met een duidelijke, geteste aanwijzing voor bijstelling.

**Type-consistentie:** `Doelgroep`, `Fragment` (Task 1), `GevondenFragment`, `Retriever` (Task 2), `Antwoord`, `LLMProvider` (Task 3) en de `Orchestrator.beantwoord`-signatuur (Task 4) worden in alle latere taken consistent hergebruikt — geen afwijkende namen of signaturen gevonden bij het doorlopen van de taken.
