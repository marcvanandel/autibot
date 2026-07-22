# Autibot

Autibot is een Nederlandstalig projectidee voor een chatbot/chatinterface op basis van een LLM (Large Language Model), die vragen beantwoordt over ASS (Autisme Spectrum Stoornis) — voor mensen met autisme zelf, voor ouders/naasten, voor professionals en voor een breed publiek.

## Waarom

Een LLM kan vlot en overtuigend klinken, maar ook dingen verzinnen ("hallucineren") — bij een onderwerp als autisme is dat onwenselijk. Autibot beantwoordt vragen daarom uitsluitend op basis van een eigen, samengestelde kennisbank met teksten over autisme, in plaats van op basis van de algemene (en soms onbetrouwbare) kennis van het taalmodel zelf.

## Status

Deze repository bevat op dit moment nog geen werkende code. Het ontwerp voor de eerste versie (MVP) is wel al uitgewerkt en goedgekeurd:

- [`docs/superpowers/specs/2026-07-22-grounded-qa-chatbot-design.md`](docs/superpowers/specs/2026-07-22-grounded-qa-chatbot-design.md) beschrijft de architectuur, dataflow en scope van de eerste versie: een lokaal draaiend prototype dat vragen beantwoordt op basis van een kennisbank van markdown-bestanden, gebouwd in TypeScript/Node.js.
- [`adr/`](adr/) bevat Architecture Decision Records die de belangrijkste technische keuzes en de motivatie daarachter vastleggen.

## Licentie

Dit project is uitgebracht onder de MIT-licentie (zie [`LICENSE`](LICENSE)), bewust gekozen om vervolgontwikkeling door anderen niet te belemmeren.
