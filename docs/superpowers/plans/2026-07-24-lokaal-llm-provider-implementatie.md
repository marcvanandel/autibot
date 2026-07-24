# Wisselbare LLM-provider Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Autibot kan naast Claude ook een zelf gehost model aanspreken via een OpenAI-compatibele lokale server (bijv. lemonade-server), instelbaar via `.env` en zonder wijzigingen aan Orchestrator, Retriever, Kennisbank of de UI.

**Architecture:** Een nieuwe `OpenAICompatibleProvider` implementeert het bestaande `LLMProvider`-contract (net als `ClaudeProvider`), via het officiële `openai`-npm-pakket met een aangepaste `baseURL`. Een nieuwe, losse `kiesLLMProvider()`-factory in `src/llm/` kiest op basis van de omgevingsvariabele `LLM_PROVIDER` welke concrete implementatie `src/index.ts` instantieert. Zie `docs/superpowers/specs/2026-07-24-lokaal-llm-provider-design.md` voor het volledige ontwerp en ADR-0005 voor de onderliggende architectuurbeslissing (LLM-toegang achter een vervangbare interface).

**Tech Stack:** TypeScript/Node.js (ongewijzigd), `openai` (nieuw, officiële OpenAI-npm-package voor de OpenAI-compatibele aanroep), Node's ingebouwde `--env-file-if-exists`-vlag voor `.env`-ondersteuning (geen `dotenv`-dependency).

## Global Constraints

- Orchestrator, Retriever, Kennisbank-formaat, de UI en het `/api/chat`-contract blijven volledig ongewijzigd — dit plan raakt uitsluitend `src/llm/`, `src/index.ts`, `package.json`, een nieuw `.env.example`-bestand en `adr/`.
- Geen automatische fallback tussen providers bij een fout; een onbekende of onvolledige providerconfiguratie geeft een fail-fast fout bij het opstarten van de server, niet pas bij de eerste vraag.
- Geen `temperature`/`top_p`/andere sampling-parameters voor `OpenAICompatibleProvider` — dezelfde aanpak als `ClaudeProvider` (ADR-0007): sturing volledig via de system-prompt, voor consistent gedrag tussen providers.
- `OpenAICompatibleProvider` hergebruikt `bouwSystemPrompt`/`bouwGebruikersprompt` uit `src/llm/prompts.ts` ongewijzigd.
- Geen streaming, geen per-request providerkeuze — de keuze wordt eenmalig bij het opstarten van de server vastgelegd.
- Beide providers' configuratie mag tegelijk in `.env` staan; wisselen is alleen `LLM_PROVIDER` aanpassen en herstarten.
- Dependencies installeren via `npm install`, geen handmatige versienummers in `package.json` zetten — laat npm de daadwerkelijk geresolveerde versie wegschrijven.
- Componentnamen zijn Engels (`OpenAICompatibleProvider`, zoals `ClaudeProvider`/`LLMProvider`); overige identifiers, foutmeldingen en commentaar zijn Nederlands, in lijn met de rest van de codebase.
- De ADR voor deze beslissing wordt pas aan het eind geschreven (Taak 4), zodat die het daadwerkelijk gebouwde weergeeft — niet vooraf, in tegenstelling tot eerdere plannen in dit project.

---

## File Structure

```
src/llm/
  OpenAICompatibleProvider.ts   (nieuw)
  kiesLLMProvider.ts             (nieuw)
src/index.ts                    (gewijzigd: kiesLLMProvider() i.p.v. new ClaudeProvider())
package.json                    (gewijzigd: dependency openai, dev-script laadt .env)
.env.example                    (nieuw, gecommit; documenteert benodigde variabelen zonder echte waarden)
tests/
  OpenAICompatibleProvider.test.ts   (nieuw)
  kiesLLMProvider.test.ts            (nieuw)
adr/
  0010-openai-compatibele-provider-voor-lokaal-model.md   (nieuw, Taak 4)
```

- `src/llm/OpenAICompatibleProvider.ts`: de nieuwe `LLMProvider`-implementatie, verantwoordelijk voor de daadwerkelijke aanroep naar een OpenAI-compatibele lokale server.
- `src/llm/kiesLLMProvider.ts`: geïsoleerde keuzelogica (welke provider, met welke config), los van `index.ts` zodat het zonder de hele server testbaar is.
- `.env.example`: nooit met echte secrets, alleen als documentatie/sjabloon; `.env` zelf blijft gitignored (al zo sinds de MVP).

---

### Task 1: `OpenAICompatibleProvider` — nieuwe LLM-provider

**Files:**
- Create: `src/llm/OpenAICompatibleProvider.ts`
- Test: `tests/OpenAICompatibleProvider.test.ts`

**Interfaces:**
- Consumes: `LLMProvider`, `Antwoord` (`src/llm/LLMProvider.ts`), `Doelgroep` (`src/kennisbank/types.ts`), `GevondenFragment` (`src/retriever/Retriever.ts`), `bouwSystemPrompt`/`bouwGebruikersprompt` (`src/llm/prompts.ts`) — alle bestaand, ongewijzigd.
- Produces: `class OpenAICompatibleProvider implements LLMProvider`, constructor `(opties: { baseURL: string; model: string }, client?: OpenAI)`. Gebruikt door Taak 2 (`kiesLLMProvider`).

- [ ] **Step 1: `openai`-dependency installeren**

```bash
npm install --save openai
```

Expected: `package.json` krijgt `openai` onder `dependencies` met de daadwerkelijk geresolveerde versie; `package-lock.json` wordt bijgewerkt.

- [ ] **Step 2: Falende test schrijven — `tests/OpenAICompatibleProvider.test.ts`**

```ts
import { describe, expect, it, vi } from "vitest";
import { OpenAICompatibleProvider } from "../src/llm/OpenAICompatibleProvider";
import type { GevondenFragment } from "../src/retriever/Retriever";

describe("OpenAICompatibleProvider", () => {
  it("geeft de tekst van de eerste keuze terug, samen met de meegegeven bronnen", async () => {
    const fragmenten: GevondenFragment[] = [
      { id: "a", titel: "Titel A", inhoud: "Inhoud A", bestandspad: "a.md", score: 1 },
    ];
    const nepClient = {
      chat: {
        completions: {
          create: vi.fn().mockResolvedValue({
            choices: [{ message: { content: "Dit is het antwoord." } }],
          }),
        },
      },
    };

    const provider = new OpenAICompatibleProvider(
      { baseURL: "http://localhost:8000/v1", model: "test-model" },
      nepClient as any,
    );
    const antwoord = await provider.answer("Een vraag", fragmenten, "algemeen");

    expect(antwoord.tekst).toBe("Dit is het antwoord.");
    expect(antwoord.bronnen).toEqual(fragmenten);
    expect(nepClient.chat.completions.create).toHaveBeenCalledWith(
      expect.objectContaining({ model: "test-model" }),
    );
    const aanroep = nepClient.chat.completions.create.mock.calls[0][0];
    expect(aanroep.temperature).toBeUndefined();
    expect(aanroep.messages).toEqual([
      { role: "system", content: expect.any(String) },
      { role: "user", content: expect.any(String) },
    ]);
  });

  it("gooit een fout als het lokale model geen tekstantwoord geeft", async () => {
    const fragmenten: GevondenFragment[] = [
      { id: "a", titel: "Titel A", inhoud: "Inhoud A", bestandspad: "a.md", score: 1 },
    ];
    const nepClient = {
      chat: {
        completions: {
          create: vi.fn().mockResolvedValue({
            choices: [{ message: { content: null } }],
          }),
        },
      },
    };

    const provider = new OpenAICompatibleProvider(
      { baseURL: "http://localhost:8000/v1", model: "test-model" },
      nepClient as any,
    );

    await expect(provider.answer("Een vraag", fragmenten, "algemeen")).rejects.toThrow(
      "Het lokale model gaf geen tekstantwoord terug",
    );
  });
});
```

- [ ] **Step 3: Test uitvoeren en verifiëren dat die faalt**

Run: `npx vitest run tests/OpenAICompatibleProvider.test.ts`
Expected: FAIL — `Cannot find module '../src/llm/OpenAICompatibleProvider'` (het bestand bestaat nog niet).

- [ ] **Step 4: `src/llm/OpenAICompatibleProvider.ts` implementeren**

```ts
import OpenAI from "openai";
import type { Doelgroep } from "../kennisbank/types";
import type { GevondenFragment } from "../retriever/Retriever";
import type { Antwoord, LLMProvider } from "./LLMProvider";
import { bouwGebruikersprompt, bouwSystemPrompt } from "./prompts";

export interface OpenAICompatibleProviderOpties {
  baseURL: string;
  model: string;
}

export class OpenAICompatibleProvider implements LLMProvider {
  private readonly client: OpenAI;
  private readonly model: string;

  constructor(opties: OpenAICompatibleProviderOpties, client?: OpenAI) {
    this.model = opties.model;
    // Lokale OpenAI-compatibele servers (zoals lemonade-server) controleren doorgaans
    // geen API-key; de openai-package vereist desondanks een niet-lege waarde.
    this.client = client ?? new OpenAI({ baseURL: opties.baseURL, apiKey: "niet-gebruikt-lokaal" });
  }

  async answer(
    vraag: string,
    fragmenten: GevondenFragment[],
    doelgroep: Doelgroep,
  ): Promise<Antwoord> {
    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        { role: "system", content: bouwSystemPrompt(doelgroep) },
        { role: "user", content: bouwGebruikersprompt(vraag, fragmenten) },
      ],
    });

    const tekst = response.choices[0]?.message?.content;

    if (!tekst) {
      throw new Error(
        "Het lokale model gaf geen tekstantwoord terug (mogelijk een leeg antwoord).",
      );
    }

    return { tekst, bronnen: fragmenten };
  }
}
```

- [ ] **Step 5: Test uitvoeren en verifiëren dat die slaagt**

Run: `npx vitest run tests/OpenAICompatibleProvider.test.ts`
Expected: PASS (2/2 tests).

- [ ] **Step 6: Typecheck**

Run: `npm run typecheck`
Expected: geen foutmeldingen.

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json src/llm/OpenAICompatibleProvider.ts tests/OpenAICompatibleProvider.test.ts
git commit -m "OpenAICompatibleProvider: LLM-provider voor een lokale OpenAI-compatibele server"
```

---

### Task 2: `kiesLLMProvider` — providerkeuze op basis van omgevingsvariabelen

**Files:**
- Create: `src/llm/kiesLLMProvider.ts`
- Test: `tests/kiesLLMProvider.test.ts`

**Interfaces:**
- Consumes: `ClaudeProvider` (`src/llm/ClaudeProvider.ts`, bestaand), `OpenAICompatibleProvider` (Taak 1), `LLMProvider` (`src/llm/LLMProvider.ts`).
- Produces: `kiesLLMProvider(env?: Record<string, string | undefined>): LLMProvider`. Gebruikt door Taak 3 (`src/index.ts`).

- [ ] **Step 1: Falende test schrijven — `tests/kiesLLMProvider.test.ts`**

```ts
import { describe, expect, it } from "vitest";
import { kiesLLMProvider } from "../src/llm/kiesLLMProvider";
import { ClaudeProvider } from "../src/llm/ClaudeProvider";
import { OpenAICompatibleProvider } from "../src/llm/OpenAICompatibleProvider";

describe("kiesLLMProvider", () => {
  it("geeft een ClaudeProvider terug als LLM_PROVIDER 'claude' is", () => {
    const provider = kiesLLMProvider({ LLM_PROVIDER: "claude" });
    expect(provider).toBeInstanceOf(ClaudeProvider);
  });

  it("geeft een ClaudeProvider terug als LLM_PROVIDER ontbreekt (default)", () => {
    const provider = kiesLLMProvider({});
    expect(provider).toBeInstanceOf(ClaudeProvider);
  });

  it("geeft een OpenAICompatibleProvider terug als LLM_PROVIDER 'lokaal' is, met geldige config", () => {
    const provider = kiesLLMProvider({
      LLM_PROVIDER: "lokaal",
      LOKAAL_LLM_BASE_URL: "http://localhost:8000/v1",
      LOKAAL_LLM_MODEL: "qwen2.5-7b-instruct",
    });
    expect(provider).toBeInstanceOf(OpenAICompatibleProvider);
  });

  it("gooit een fout als LOKAAL_LLM_BASE_URL ontbreekt terwijl LLM_PROVIDER 'lokaal' is", () => {
    expect(() =>
      kiesLLMProvider({ LLM_PROVIDER: "lokaal", LOKAAL_LLM_MODEL: "qwen2.5-7b-instruct" }),
    ).toThrow("LOKAAL_LLM_BASE_URL");
  });

  it("gooit een fout als LOKAAL_LLM_MODEL ontbreekt terwijl LLM_PROVIDER 'lokaal' is", () => {
    expect(() =>
      kiesLLMProvider({ LLM_PROVIDER: "lokaal", LOKAAL_LLM_BASE_URL: "http://localhost:8000/v1" }),
    ).toThrow("LOKAAL_LLM_MODEL");
  });

  it("gooit een fout bij een onbekende LLM_PROVIDER-waarde", () => {
    expect(() => kiesLLMProvider({ LLM_PROVIDER: "onzin" })).toThrow(/Onbekende LLM_PROVIDER/);
    expect(() => kiesLLMProvider({ LLM_PROVIDER: "onzin" })).toThrow(/onzin/);
  });
});
```

- [ ] **Step 2: Test uitvoeren en verifiëren dat die faalt**

Run: `npx vitest run tests/kiesLLMProvider.test.ts`
Expected: FAIL — `Cannot find module '../src/llm/kiesLLMProvider'`.

- [ ] **Step 3: `src/llm/kiesLLMProvider.ts` implementeren**

```ts
import { ClaudeProvider } from "./ClaudeProvider";
import { OpenAICompatibleProvider } from "./OpenAICompatibleProvider";
import type { LLMProvider } from "./LLMProvider";

export function kiesLLMProvider(
  env: Record<string, string | undefined> = process.env,
): LLMProvider {
  const providerNaam = env.LLM_PROVIDER ?? "claude";

  switch (providerNaam) {
    case "claude":
      return new ClaudeProvider();

    case "lokaal": {
      const baseURL = env.LOKAAL_LLM_BASE_URL;
      const model = env.LOKAAL_LLM_MODEL;

      if (!baseURL) {
        throw new Error(
          "LOKAAL_LLM_BASE_URL ontbreekt terwijl LLM_PROVIDER=lokaal is ingesteld.",
        );
      }
      if (!model) {
        throw new Error("LOKAAL_LLM_MODEL ontbreekt terwijl LLM_PROVIDER=lokaal is ingesteld.");
      }

      return new OpenAICompatibleProvider({ baseURL, model });
    }

    default:
      throw new Error(
        `Onbekende LLM_PROVIDER: "${providerNaam}". Geldige waarden zijn "claude" of "lokaal".`,
      );
  }
}
```

- [ ] **Step 4: Test uitvoeren en verifiëren dat die slaagt**

Run: `npx vitest run tests/kiesLLMProvider.test.ts`
Expected: PASS (6/6 tests).

- [ ] **Step 5: Typecheck en volledige testsuite**

```bash
npm run typecheck
npm test
```

Expected: beide slagen zonder foutmeldingen; alle bestaande tests blijven groen.

- [ ] **Step 6: Commit**

```bash
git add src/llm/kiesLLMProvider.ts tests/kiesLLMProvider.test.ts
git commit -m "kiesLLMProvider: providerkeuze op basis van LLM_PROVIDER"
```

---

### Task 3: Inpluggen in `index.ts`, `.env`-ondersteuning en `.env.example`

**Files:**
- Modify: `src/index.ts`
- Modify: `package.json` (`dev`-script)
- Create: `.env.example`

**Interfaces:**
- Consumes: `kiesLLMProvider` (Taak 2).
- Produces: niets voor latere taken — dit is de laatste functionele taak; Taak 4 is documentatie-only.

- [ ] **Step 1: `src/index.ts` bijwerken**

Open `src/index.ts`. Vervang de import en de instantiatie van `ClaudeProvider`:

```ts
import { join } from "node:path";
import { laadKennisbank } from "./kennisbank/loadKennisbank";
import { KeywordRetriever } from "./retriever/KeywordRetriever";
import { kiesLLMProvider } from "./llm/kiesLLMProvider";
import { Orchestrator } from "./orchestrator/Orchestrator";
import { maakServer } from "./server/server";

const KENNISBANK_MAP = process.env.KENNISBANK_MAP ?? join(__dirname, "..", "kennisbank");
const PUBLIC_MAP = join(__dirname, "server", "public");
const POORT = Number(process.env.POORT ?? 3000);

function start(): void {
  const fragmenten = laadKennisbank(KENNISBANK_MAP);
  const retriever = new KeywordRetriever(fragmenten);
  const llmProvider = kiesLLMProvider();
  const orchestrator = new Orchestrator(retriever, llmProvider);

  const server = maakServer(orchestrator, PUBLIC_MAP);
  server.listen(POORT, () => {
    console.log(`Autibot draait op http://localhost:${POORT}`);
  });
}

start();
```

(Enige wijziging: de `ClaudeProvider`-import en -instantiatie zijn vervangen door `kiesLLMProvider` uit Taak 2; verder ongewijzigd.)

- [ ] **Step 2: `package.json`-devscript bijwerken**

Vervang in `"scripts"`:

```json
"dev": "concurrently \"vite build --watch --config client/vite.config.ts\" \"tsx --env-file-if-exists=.env src/index.ts\"",
```

(Enige wijziging: `tsx` krijgt de vlag `--env-file-if-exists=.env` erbij, zodat een `.env`-bestand automatisch geladen wordt als het bestaat, zonder foutmelding als het ontbreekt.)

- [ ] **Step 3: `.env.example` aanmaken**

```
# Kies welke LLM-provider gebruikt wordt: "claude" (default) of "lokaal"
LLM_PROVIDER=claude

# Nodig zodra LLM_PROVIDER=claude
ANTHROPIC_API_KEY=

# Nodig zodra LLM_PROVIDER=lokaal (lemonade-server of een andere OpenAI-compatibele lokale server)
LOKAAL_LLM_BASE_URL=http://localhost:8000/v1
LOKAAL_LLM_MODEL=qwen2.5-7b-instruct
```

- [ ] **Step 4: Typecheck en volledige testsuite**

```bash
npm run typecheck
npm test
```

Expected: beide slagen zonder foutmeldingen.

- [ ] **Step 5: Fail-fast-gedrag verifiëren — onbekende provider**

```bash
LLM_PROVIDER=onzin npx tsx src/index.ts
```

Expected: het proces stopt meteen met een ongevangen fout die de tekst `Onbekende LLM_PROVIDER: "onzin"` bevat; er verschijnt geen `Autibot draait op http://localhost:...`-regel.

- [ ] **Step 6: Fail-fast-gedrag verifiëren — onvolledige lokale configuratie**

```bash
LLM_PROVIDER=lokaal npx tsx src/index.ts
```

Expected: het proces stopt meteen met een fout die de tekst `LOKAAL_LLM_BASE_URL ontbreekt` bevat.

- [ ] **Step 7: Standaardgedrag verifiëren — geen wijziging voor bestaande gebruikers**

```bash
timeout 5 npx tsx src/index.ts
```

Expected: de regel `Autibot draait op http://localhost:3000` verschijnt (met of zonder geldige `ANTHROPIC_API_KEY` — die wordt pas gecontroleerd bij een daadwerkelijke vraag, niet bij het opstarten), en het proces draait door tot de timeout. Dit bevestigt dat het gedrag voor de bestaande Claude-route ongewijzigd is.

- [ ] **Step 8: `.env`-bestand daadwerkelijk laten inlezen verifiëren**

```bash
echo 'LLM_PROVIDER=lokaal' > .env
echo 'LOKAAL_LLM_MODEL=test-model' >> .env
npx tsx --env-file-if-exists=.env src/index.ts
rm .env
```

Expected: fout met `LOKAAL_LLM_BASE_URL ontbreekt` — dit bewijst dat `LLM_PROVIDER`/`LOKAAL_LLM_MODEL` uit het `.env`-bestand zijn gelezen (ze zijn niet als shell-omgevingsvariabele gezet), en dat de ontbrekende derde variabele (`LOKAAL_LLM_BASE_URL`, bewust niet in dit `.env`-bestand gezet) correct de fail-fast-fout triggert.

- [ ] **Step 9: Commit**

```bash
git add src/index.ts package.json .env.example
git commit -m "kiesLLMProvider inpluggen in index.ts, .env-ondersteuning toevoegen"
```

---

### Task 4: ADR-0010 vastleggen

**Files:**
- Create: `adr/0010-openai-compatibele-provider-voor-lokaal-model.md`

**Interfaces:** geen (documentatie-only taak).

- [ ] **Step 1: ADR aanmaken**

```markdown
# 0010. OpenAICompatibleProvider voor een zelf gehost lokaal model

Datum: 2026-07-24
Status: Geaccepteerd

## Context

ADR-0005 legde vast dat LLM-toegang via een vervangbare `LLMProvider`-interface loopt, met als doel later een zelf gehost open-source model te kunnen aanspreken zonder Orchestrator, Retriever of UI te wijzigen. Deze stap maakt dat concreet: een tweede `LLMProvider`-implementatie voor een lokaal draaiende, OpenAI-compatibele inferentieserver (bijv. lemonade-server), met als extra eis dat tussen Claude en het lokale model gewisseld kan worden zonder codewijziging — bijvoorbeeld lokaal tijdens ontwikkeling, Claude voor een demo. Volledige afweging in `docs/superpowers/specs/2026-07-24-lokaal-llm-provider-design.md`.

## Beslissing

`OpenAICompatibleProvider` gebruikt het officiële `openai`-npm-pakket met een aangepaste `baseURL`, in plaats van een kale `fetch`-aanroep — hetzelfde patroon als `ClaudeProvider` (`@anthropic-ai/sdk`): een officiële, getypeerde client, injecteerbaar via de constructor voor testbaarheid. De `openai`-package is specifiek gemaakt voor dit "praat met een OpenAI-compatibele server"-scenario en werkt daardoor ook met Ollama, LM Studio of vLLM, niet alleen lemonade-server.

Welke provider actief is, wordt bepaald door de omgevingsvariabele `LLM_PROVIDER` (`"claude"` of `"lokaal"`), gelezen bij het opstarten van de server via een nieuwe, losse `kiesLLMProvider()`-factory. Beide providers' configuratie (`ANTHROPIC_API_KEY` resp. `LOKAAL_LLM_BASE_URL`/`LOKAAL_LLM_MODEL`) mag tegelijk in `.env` staan; wisselen is alleen `LLM_PROVIDER` aanpassen en herstarten. Een onbekende of onvolledige providerkeuze geeft een fail-fast fout bij het opstarten, in plaats van een automatische fallback naar de andere provider.

`OpenAICompatibleProvider` stuurt, net als `ClaudeProvider` (ADR-0007), geen `temperature`/sampling-parameters mee — sturing verloopt volledig via de system-prompt, voor consistent gedrag tussen providers.

## Consequenties

- Nieuwe dependency: `openai`.
- `.env`-ondersteuning via Node's ingebouwde `--env-file-if-exists`-vlag, geen `dotenv`-dependency.
- De daadwerkelijke modelkeuze (welk model in lemonade-server geladen wordt) en de werkbaarheidstest (snelheid/kwaliteit) blijven een apart, empirisch traject — zie de "Modelkeuze en werkbaarheidstest"-sectie in het ontwerpdocument.
- Toekomstige providers (mocht dat ooit nodig zijn) volgen hetzelfde patroon: een nieuwe `LLMProvider`-implementatie plus een uitbreiding van `kiesLLMProvider`'s switch.
```

- [ ] **Step 2: Controleren**

Run: `cat adr/0010-openai-compatibele-provider-voor-lokaal-model.md`
Expected: bestand bestaat, volgt hetzelfde format als `adr/0001` (Datum, Status, Context, Beslissing, Consequenties).

- [ ] **Step 3: Commit**

```bash
git add adr/0010-openai-compatibele-provider-voor-lokaal-model.md
git commit -m "ADR-0010: OpenAICompatibleProvider voor een zelf gehost lokaal model"
```
