# Autibot

Autibot is een Nederlandstalig projectidee voor een chatbot/chatinterface op basis van een LLM (Large Language Model), die vragen beantwoordt over ASS (Autisme Spectrum Stoornis) — voor mensen met autisme zelf, voor ouders/naasten, voor professionals en voor een breed publiek.

## Waarom

Een LLM kan vlot en overtuigend klinken, maar ook dingen verzinnen ("hallucineren") — bij een onderwerp als autisme is dat onwenselijk. Autibot beantwoordt vragen daarom uitsluitend op basis van een eigen, samengestelde kennisbank met teksten over autisme, in plaats van op basis van de algemene (en soms onbetrouwbare) kennis van het taalmodel zelf.

## Status

Er is nu een werkende lokale demo-implementatie (TypeScript/Node.js) die het ontwerp voor de eerste versie (MVP) uitvoert:

- [`docs/superpowers/specs/2026-07-22-grounded-qa-chatbot-design.md`](docs/superpowers/specs/2026-07-22-grounded-qa-chatbot-design.md) beschrijft de architectuur, dataflow en scope: een lokaal draaiend prototype dat vragen beantwoordt op basis van een kennisbank van markdown-bestanden.
- [`adr/`](adr/) bevat Architecture Decision Records (0001 t/m 0007) die de belangrijkste technische keuzes en de motivatie daarachter vastleggen.

Aan de slag:

- `npm install` — installeer de dependencies.
- `npm run dev` — start de lokale server (op localhost). Om daadwerkelijk antwoorden via Claude te krijgen is een `ANTHROPIC_API_KEY`-omgevingsvariabele nodig.
- `npm test` — draait de testsuite (23 tests, vitest).
- `npm run typecheck` — controleert de TypeScript-types.

## Licentie

Dit project is uitgebracht onder de MIT-licentie (zie [`LICENSE`](LICENSE)), bewust gekozen om vervolgontwikkeling door anderen niet te belemmeren.
