# Autibot

<p align="center">
  <img src="assets/branding/a-chat-star-logo.svg" alt="Autibot logo" width="128" height="128" />
</p>

Autibot is een Nederlandstalig projectidee voor een chatbot/chatinterface op basis van een LLM (Large Language Model), die vragen beantwoordt over ASS (Autisme Spectrum Stoornis) — voor mensen met autisme zelf, voor ouders/naasten, voor professionals en voor een breed publiek.

## Over Autibot

Autibot is een informatiehulp die vragen over ASS beantwoordt op basis van de geselecteerde kennisbank in deze repository.

Autibot dient als startpunt voor uitleg, verheldering en oriëntatie, en niet als vervanging van professionele beoordeling of behandeling.

### Veiligheid

Autibot kan onvolledige of onjuiste antwoorden geven. Gebruik antwoorden niet als diagnose, crisisbeoordeling of spoedhulp, en controleer belangrijke informatie bij een gekwalificeerde professional.

### Privacy

Vragen worden verwerkt om antwoord te kunnen geven. Deel daarom geen onnodige persoonsgegevens of gevoelige details die direct herleidbaar zijn tot een persoon.

In de huidige demo kan het systeem nog niet zonder publieke cloudservices voor antwoordgeneratie. Daarom is terughoudendheid met persoonlijke informatie nu extra belangrijk.

Het doel voor een latere productfase is om privacy en persoonlijke veiligheid verder te versterken, met expliciete waarborgen rond gegevensdeling en met zo min mogelijk opslag of historie van persoonlijke informatie.

### Verwachtingen en grenzen

Je kunt meestal wel verwachten: Nederlandstalige uitleg over ASS op basis van de kennisbank.

Je kunt niet verwachten: persoonlijk medisch advies, gegarandeerd foutloze antwoorden of realtime kennis buiten de ingestelde bronnen.

## Waarom

Een LLM kan vlot en overtuigend klinken, maar ook dingen verzinnen ("hallucineren") — bij een onderwerp als autisme is dat onwenselijk. Autibot beantwoordt vragen daarom uitsluitend op basis van een eigen, samengestelde kennisbank met teksten over autisme, in plaats van op basis van de algemene (en soms onbetrouwbare) kennis van het taalmodel zelf.

## Status

Er is nu een werkende lokale demo-implementatie: een TypeScript/Node.js-backend met een React/Vite/Tailwind-chatinterface, en een instelbare LLM-provider (Claude, of een zelf gehost lokaal model via OpenAI-compatibele API).

- [`docs/superpowers/specs/2026-07-22-grounded-qa-chatbot-design.md`](docs/superpowers/specs/2026-07-22-grounded-qa-chatbot-design.md) beschrijft de architectuur, dataflow en scope: een lokaal draaiend prototype dat vragen beantwoordt op basis van een kennisbank van markdown-bestanden.
- [`docs/superpowers/specs/2026-07-23-react-chat-ui-design.md`](docs/superpowers/specs/2026-07-23-react-chat-ui-design.md) beschrijft de React/Vite/Tailwind-chatinterface.
- [`docs/superpowers/specs/2026-07-24-lokaal-llm-provider-design.md`](docs/superpowers/specs/2026-07-24-lokaal-llm-provider-design.md) beschrijft de wisselbare LLM-provider.
- [`adr/`](adr/) bevat Architecture Decision Records (0001 t/m 0010) die de belangrijkste technische keuzes en de motivatie daarachter vastleggen.
- [`docs/presentaties/2026-09-01-wat-is-autibot-en-waarom.md`](docs/presentaties/2026-09-01-wat-is-autibot-en-waarom.md) is een Marp-slidedeck die in leken-taal uitlegt wat Autibot doet en waarom, voor zorgprofessionals en beleidsmakers.

Aan de slag:

- `npm install` — installeer de dependencies.
- `npm run dev` — start de lokale server (op localhost). Standaard wordt Claude gebruikt, waarvoor een `ANTHROPIC_API_KEY`-omgevingsvariabele nodig is; zie [`.env.example`](.env.example) om in plaats daarvan een lokaal model te gebruiken.
- `npm test` — draait de testsuite (35 tests, vitest).
- `npm run typecheck` — controleert de TypeScript-types.
- `npm run slides` — rendert de presentatie naar HTML; `npm run slides:dev` start een lokale preview met live-reload tijdens het bewerken.

## Licentie

Dit project is uitgebracht onder de MIT-licentie (zie [`LICENSE`](LICENSE)), bewust gekozen om vervolgontwikkeling door anderen niet te belemmeren.
