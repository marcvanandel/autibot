# Autibot

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
