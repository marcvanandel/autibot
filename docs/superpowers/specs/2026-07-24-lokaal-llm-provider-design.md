# Ontwerp: wisselbare LLM-provider (Claude / lokaal model via lemonade-server)

Datum: 2026-07-24
Status: Goedgekeurd, klaar voor implementatieplan

## Doel

Autibot kan naast Claude ook een zelf gehost, lokaal draaiend open-source model aanspreken via lemonade-server (een lokale, OpenAI/Ollama-compatibele inferentieserver), zonder dat Orchestrator, Retriever, Kennisbank of de UI hoeven te veranderen. Welke provider actief is, is instelbaar via configuratie en makkelijk om te wisselen — bijvoorbeeld een lokaal model tijdens ontwikkeling, en Claude voor een demo. Dit werkt de vervolgstap uit die al genoemd werd in `docs/superpowers/specs/2026-07-22-grounded-qa-chatbot-design.md` ("Openstaande vervolgstappen") en bouwt voort op de architectuurbeslissing in ADR-0005 (LLM-toegang achter een vervangbare `LLMProvider`-interface).

## Scope

- **Wel:**
  - Een nieuwe, generieke `LLMProvider`-implementatie die praat met elke OpenAI-compatibele lokale server (dus niet hard gekoppeld aan specifiek lemonade-server-gedrag), via het officiële `openai`-npm-pakket met een aangepaste `baseURL`.
  - Configuratie via `.env`: welke provider actief is, en de instellingen voor beide providers tegelijk (zodat wisselen alleen het aanpassen van één variabele + herstarten is).
  - Fail-fast foutafhandeling: een onbekende providerkeuze of onbereikbare provider geeft een duidelijke fout, geen automatische fallback naar de andere provider.
  - Een kandidatenlijst en werkbaarheidstest-aanpak voor het te gebruiken lokale model (onderzoek, geen geautomatiseerde test).
- **Niet (bewust uitgesteld of afgewezen):**
  - Wijzigingen aan Orchestrator, Retriever, Kennisbank-formaat, de UI of het `/api/chat`-contract.
  - Per-request providerkeuze of wisselen tijdens het gebruik zonder herstart — de keuze wordt bij het opstarten van de server vastgelegd.
  - Automatische fallback tussen providers bij een fout — expliciet afgewezen, om te voorkomen dat een demo onopgemerkt naar Claude (kosten) of naar een niet-geladen lokaal model overschakelt.
  - Streaming van antwoorden — blijft buiten scope, in lijn met eerdere ontwerpen.
  - Een lage `temperature`-instelling voor het lokale model — bewust dezelfde aanpak als `ClaudeProvider` (ADR-0007): sturing volledig via de system-prompt, geen sampling-parameters, om gedrag tussen providers consistent te houden.
  - Het definitief kiezen van hét lokale model — dat gebeurt empirisch (snelheid/kwaliteit) na dit ontwerp, niet als onderdeel van de architectuur.

## Providerkeuze en client-aanpak

De nieuwe provider gebruikt het officiële `openai`-npm-pakket, met een eigen `baseURL` die naar lemonade-server (of een andere OpenAI-compatibele lokale server) wijst, in plaats van naar `api.openai.com`. Dit is hetzelfde patroon als `ClaudeProvider`, die `@anthropic-ai/sdk` gebruikt: een officiële, getypeerde client, aangesproken via een injecteerbare constructor-parameter (voor testbaarheid, zoals `ClaudeProvider`'s `client: Anthropic = new Anthropic()`). De `openai`-package is specifiek gemaakt voor dit "praat met een OpenAI-compatibele server"-scenario en werkt daardoor niet alleen met lemonade-server, maar ook met Ollama, LM Studio of vLLM, mocht er later een andere lokale server geprobeerd worden — zonder codewijziging, alleen `.env`.

Concreet roept `answer()` één niet-streamende `client.chat.completions.create({ model, messages })` aan, met exact dezelfde tweedeling als `ClaudeProvider`: een `system`-bericht (`bouwSystemPrompt(doelgroep)`) en een `user`-bericht (`bouwGebruikersprompt(vraag, fragmenten)`) — geen `temperature`/`top_p` (zie Scope). De tekst komt uit `response.choices[0]?.message?.content`; ontbreekt die (leeg antwoord, onverwachte responsvorm), dan gooit de provider een duidelijke fout, net zoals `ClaudeProvider` doet wanneer Claude geen tekstblok teruggeeft.

## Architectuur

```mermaid
graph TD
    Index["src/index.ts<br/>kiesLLMProvider() op basis van LLM_PROVIDER"]
    Claude["ClaudeProvider<br/>(bestaand, ongewijzigd)"]
    Lokaal["OpenAICompatibleProvider<br/>(nieuw)"]
    Prompts["prompts.ts<br/>bouwSystemPrompt / bouwGebruikersprompt<br/>(ongewijzigd, provider-agnostisch)"]
    Orchestrator["Orchestrator<br/>(ongewijzigd)"]

    Index -->|LLM_PROVIDER=claude| Claude
    Index -->|LLM_PROVIDER=lokaal| Lokaal
    Claude --> Prompts
    Lokaal --> Prompts
    Orchestrator -->|answer(vraag, fragmenten, doelgroep)| Claude
    Orchestrator -->|answer(vraag, fragmenten, doelgroep)| Lokaal
```

De Orchestrator ziet nooit welke provider actief is — die krijgt gewoon een object dat aan het `LLMProvider`-contract voldoet. Alleen `src/index.ts` weet, bij het opstarten, welke concrete implementatie geïnstantieerd wordt.

## Bestandsstructuur

```
src/llm/
  LLMProvider.ts              (bestaand, ongewijzigd)
  prompts.ts                  (bestaand, ongewijzigd)
  ClaudeProvider.ts            (bestaand, ongewijzigd)
  OpenAICompatibleProvider.ts   (nieuw)
  kiesLLMProvider.ts            (nieuw: factory-functie, geïsoleerd en testbaar)
src/index.ts                  (gewijzigd: gebruikt kiesLLMProvider() i.p.v. rechtstreeks `new ClaudeProvider()`)
tests/
  OpenAICompatibleProvider.test.ts   (nieuw, naar het patroon van ClaudeProvider.test.ts)
  kiesLLMProvider.test.ts            (nieuw)
package.json                  (gewijzigd: dependency `openai`, dev-script laadt .env)
.env.example                  (nieuw: documenteert de benodigde variabelen, zonder echte waarden)
```

`kiesLLMProvider.ts` staat los van `index.ts` zodat de keuzelogica (onbekende waarde → duidelijke fout; anders de juiste provider instantiëren) getest kan worden zonder de hele server op te starten.

## Configuratie (`.env`)

```
LLM_PROVIDER=lokaal                            # "claude" (default) of "lokaal"
ANTHROPIC_API_KEY=...                          # nodig zodra LLM_PROVIDER=claude
LOKAAL_LLM_BASE_URL=http://localhost:8000/v1   # lemonade-server endpoint
LOKAAL_LLM_MODEL=qwen2.5-7b-instruct           # het in lemonade-server geladen model
```

Beide providers' instellingen mogen tegelijk in `.env` staan (bewuste keuze: wisselen is dan alleen `LLM_PROVIDER` aanpassen en herstarten, precies het "makkelijk wisselen tussen ontwikkeling en demo"-doel). `.env` wordt geladen via Node's ingebouwde `--env-file-if-exists=.env`-vlag (geen nieuwe dependency zoals `dotenv`); het `dev`-script in `package.json` roept `tsx` voortaan aan met die vlag. Een `.env.example`-bestand (wel gecommit, met placeholder-waarden) documenteert welke variabelen nodig zijn.

## Dataflow

1. Bij opstarten (`npm run dev` of `npm start`) leest `src/index.ts` `.env` (indien aanwezig) en roept `kiesLLMProvider()` aan.
2. `kiesLLMProvider()` leest `process.env.LLM_PROVIDER` (default `"claude"`); bij een onbekende waarde gooit het direct een duidelijke fout, vóórdat de server gaat luisteren.
3. Voor `"claude"`: instantieert `ClaudeProvider` (ongewijzigd, leest `ANTHROPIC_API_KEY` zoals nu al).
4. Voor `"lokaal"`: instantieert `OpenAICompatibleProvider` met `LOKAAL_LLM_BASE_URL` en `LOKAAL_LLM_MODEL` uit de omgeving.
5. Vanaf hier is de rest van de dataflow ongewijzigd: Orchestrator roept `llmProvider.answer(vraag, fragmenten, doelgroep)` aan, ongeacht welke concrete implementatie dat is.

## Foutafhandeling

- Onbekende/ontbrekende `LLM_PROVIDER`-waarde (iets anders dan `"claude"` of `"lokaal"`): directe fout bij het opstarten van de server, met de ongeldige waarde in de melding.
- Ontbrekende vereiste variabelen voor de gekozen provider (bijv. `LOKAAL_LLM_BASE_URL` ontbreekt terwijl `LLM_PROVIDER=lokaal`): ook een fail-fast fout bij opstarten, niet pas bij de eerste vraag.
- Een netwerk- of API-fout tijdens `OpenAICompatibleProvider.answer()` (server onbereikbaar, model niet geladen, etc.) wordt niet zelf afgevangen of omgezet — die gooit gewoon door, en de bestaande foutafhandeling in `server.ts`/`Orchestrator.ts` vangt dat al op met de generieke `"Er ging iets mis bij het beantwoorden van de vraag."`-melding. Geen wijziging nodig aan de server of de UI.
- Geen automatische fallback tussen providers — bewust afgewezen (zie Scope).

## Testen

- `OpenAICompatibleProvider.test.ts`: een gemockte `OpenAI`-client injecteren (zelfde patroon als `ClaudeProvider.test.ts`), en testen dat de response correct naar `Antwoord` wordt omgezet en dat een lege/onverwachte response een duidelijke fout oplevert. Geen echte lemonade-server nodig in de testsuite.
- `kiesLLMProvider.test.ts`: `"claude"` → instantie van `ClaudeProvider`; `"lokaal"` → instantie van `OpenAICompatibleProvider` met de juiste config; onbekende waarde → gooit een fout met die waarde erin.
- Geen wijziging aan bestaande Orchestrator- of server-tests: die gebruiken al een fake `LLMProvider` resp. raken deze wijziging niet.

## Modelkeuze en werkbaarheidstest

Kandidaten om te proberen in lemonade-server (AMD Ryzen AI NPU-laptop), in volgorde van voorkeur:

1. **Qwen2.5-7B-Instruct** — sterk meertalig, goede instructie-opvolging, al genoemd als kandidaat in ADR-0005.
2. **Llama-3.1-8B-Instruct** — vergelijkbaar alternatief, breed ondersteund.
3. **Qwen2.5-3B-Instruct** — lichter/sneller, als de 7B-variant op de NPU te traag blijkt.

Phi-modellen (Phi-3.5/Phi-4) zijn NPU-snel maar merkbaar zwakker in het Nederlands, en daarom minder geschikt als eerste keuze voor deze Nederlandstalige toepassing.

De werkbaarheidstest is handmatig, niet geautomatiseerd: een model laden in lemonade-server, `LLM_PROVIDER=lokaal` zetten, een aantal echte kennisbank-vragen stellen via de UI of direct tegen `/api/chat`, en snelheid en antwoordkwaliteit beoordelen. Dit is een subjectieve beoordeling die niet in een test-assertion past.

## Vastleggen als ADR

Zodra dit ontwerp geïmplementeerd is, hoort er een nieuwe ADR (volgend nummer na 0009) bij die vastlegt dat de `LLMProvider`-vervangbaarheid uit ADR-0005 nu een tweede, generieke implementatie heeft, en waarom voor het officiële `openai`-pakket met aangepaste `baseURL` gekozen is in plaats van een kale `fetch`-aanroep.
