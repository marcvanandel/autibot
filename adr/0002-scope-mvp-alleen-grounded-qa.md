# 0002. Scope van de MVP: alleen grounded Q&A

Datum: 2026-07-22
Status: Geaccepteerd

## Context

Het oorspronkelijke idee omvatte ook het automatisch voorstellen van vervolgvragen op basis van gerelateerde kennisbank-content, naast het beantwoorden van vragen zelf, en eventueel personalisatie/gespreksgeschiedenis. Om een eerste werkende versie snel en overzichtelijk te houden, en pas verder te bouwen nadat de kernfunctionaliteit (gegrond antwoorden, hallucinatie voorkomen) bewezen werkt, is de scope bewust beperkt.

## Beslissing

De eerste versie (MVP) van Autibot doet uitsluitend grounded Q&A: vragen beantwoorden op basis van de kennisbank, met een expliciete weigering wanneer het antwoord niet gedekt is. Vervolgvraag-suggesties, personalisatie/gespreksgeschiedenis en gebruikersprofielen zijn expliciet buiten scope van de MVP.

## Consequenties

- De Orchestrator en Retriever hoeven geen logica te bevatten voor het vinden van "gerelateerde" content, alleen voor het vinden van relevante content bij de gestelde vraag.
- Vervolgvraag-suggesties kunnen later als aparte uitbreiding op dezelfde architectuur (Retriever + kennisbank) gebouwd worden, zonder dat de MVP daarvoor al voorbereid hoeft te zijn.
