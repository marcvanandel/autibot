# CLAUDE.md

Dit bestand biedt richtlijnen aan Claude Code (claude.ai/code) bij het werken met code in deze repository.

## Status van het project

Autibot is een Nederlandstalig projectidee voor een chatbot/chatinterface op basis van een LLM, die antwoorden geeft op basis van geselecteerde teksten over ASS (Autisme Spectrum Stoornis). Er is nu een werkende lokale demo-implementatie (TypeScript/Node.js) die het ontwerp uit [`docs/superpowers/specs/2026-07-22-grounded-qa-chatbot-design.md`](docs/superpowers/specs/2026-07-22-grounded-qa-chatbot-design.md) uitvoert: vijf samenwerkende onderdelen (Kennisbank, Retriever, Orchestrator, LLMProvider, een lokale webserver/UI) en een testsuite van 23 tests.

Belangrijke commando's:

- `npm install` — installeer de dependencies.
- `npm run dev` — start de lokale server (localhost); vereist de omgevingsvariabele `ANTHROPIC_API_KEY` om daadwerkelijk antwoorden via Claude te genereren.
- `npm test` — draait de testsuite (vitest).
- `npm run typecheck` — controleert de TypeScript-types (`tsc --noEmit`).

Het ontwerpdocument staat in `docs/superpowers/specs/`, de Architecture Decision Records staan in `adr/` (zie hieronder), en het uitvoeringsplan/de voortgang van de bouw staat in `.superpowers/sdd/`.

## Architectuurbeslissingen (ADR's)

Belangrijke architectuur- en technologiekeuzes worden vastgelegd als Architecture Decision Records in de map `adr/` (zie `adr/0001-architectuurbeslissingen-vastleggen-met-adrs.md` voor het format en de afspraak zelf). Maak bij het nemen of voorstellen van een noemenswaardige architectuur- of technologiekeuze (bijv. taal/framework, opslag, hoe de kennisbank doorzocht wordt, hoe een LLM wordt aangesproken) een nieuwe, oplopend genummerde ADR aan (`NNNN-korte-titel.md`) met Datum, Status, Context, Beslissing en Consequenties. Bestaande ADR's worden niet herschreven; een herziene beslissing krijgt een nieuwe ADR die de oude als "vervangen" markeert.

## Opmaak van Markdown-bestanden

Schrijf alinea's als één doorlopende regel (geen harde regeleinde halverwege een zin/alinea). Laat de editor de tekst soft-wrappen op schermbreedte; harde line breaks maken de tekst in diff-weergave en op smalle schermen juist moeilijker leesbaar.
