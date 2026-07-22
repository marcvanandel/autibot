# 0003. Eén gedeelde kennisbank met expliciete doelgroepkeuze vooraf

Datum: 2026-07-22
Status: Geaccepteerd

## Context

Autibot moet meerdere doelgroepen bedienen (mensen met autisme zelf, ouders/naasten, professionals, breed publiek), elk met een gewenste toon en soms andere nadruk. Een aparte chatbot of aparte kennisbank per doelgroep zou het contentonderhoud verveelvoudigen.

## Beslissing

Er is één gedeelde kennisbank; elk markdown-bestand krijgt in de frontmatter een `doelgroep`-tag (een of meer van `zelf`, `ouder-naaste`, `professional`, `algemeen`). Bij de start van een gesprek kiest de gebruiker expliciet zijn/haar doelgroep uit deze vaste lijst; deze keuze bepaalt welke fragmenten worden getoond en de toon van het antwoord.

## Consequenties

- Content hoeft maar op één plek onderhouden te worden, met metadata in plaats van duplicatie per doelgroep.
- De chat-flow begint altijd met een doelgroepkeuze-stap, ook als dat voor sommige gebruikers een net iets tragere start betekent.
- Impliciet afleiden van de doelgroep uit de vraagformulering is bewust niet gekozen voor de MVP (minder voorspelbaar, lastiger te debuggen en te testen).
