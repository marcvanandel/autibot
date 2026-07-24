# 0009. Stopwoordfilter in de KeywordRetriever

Datum: 2026-07-24
Status: Geaccepteerd

## Context

ADR-0006 koos keyword-retrieval via `minisearch`, met de expliciete kanttekening dat de `RELEVANTIE_DREMPEL` in `Orchestrator.ts` afgesteld was tegen een kleine 2-document testfixture en hertuning tegen een echte productie-kennisbank nodig zou zijn. Na groei van de kennisbank (van 2 naar 11 artikelen, via externe bijdragen) bleek dit risico zich daadwerkelijk voor te doen: `minisearch` filtert standaard geen stopwoorden, waardoor een vraag die vooral uit hoogfrequente Nederlandse verbindingswoorden bestaat ("wat", "is", "de", "van") een score kan krijgen die louter voortkomt uit woordoverlap met vrijwel elk kort artikel, los van inhoudelijke relevantie. Concreet gemeten tegen de echte kennisbank: "Wat is de hoofdstad van Frankrijk?" scoorde 28.51 en "Wat is de beste manier om te koken?" scoorde 53.64 — beide ruim boven de drempel van 5, en beide hoger dan de daadwerkelijk relevante vraag "Wat is autisme?" (24.43). Dit zou onterecht een LLM-aanroep triggeren voor evident ongedekte vragen, in plaats van de bedoelde weigering.

## Beslissing

`KeywordRetriever` filtert voortaan een vaste lijst Nederlandse stopwoorden via `MiniSearch`'s `processTerm`-optie, toegepast op zowel het indexeren als het doorzoeken. Getest tegen de echte kennisbank: na deze wijziging scoort "Wat is de hoofdstad van Frankrijk?" 0 (geen match), "Wat is de beste manier om te koken?" 2.60, en blijft "Wat is autisme?" ruim boven de drempel op 6.30 — de bestaande `RELEVANTIE_DREMPEL = 5` blijft dus staan en hoeft niet aangepast te worden.

Bijkomende bevinding: de absolute score-schaal van `minisearch` is corpusgrootte-afhankelijk (IDF neemt toe naarmate een term zeldzamer is over een groter aantal documenten). Hierdoor faalde de bestaande "golden scenario"-test in `Orchestrator.test.ts` tegen de kleine 2-document `kennisbank-geldig`-fixture na het toepassen van het stopwoordfilter: te weinig documenten om een realistische score te produceren. Opgelost met een nieuwe, aparte fixture (`tests/fixtures/kennisbank-realistisch`, 11 documenten) die qua omvang de echte kennisbank benadert; `kennisbank-geldig` blijft ongewijzigd voor de tests die daar wél expliciet op leunen (`loadKennisbank.test.ts`).

## Consequenties

- `RELEVANTIE_DREMPEL = 5` blijft ongewijzigd en is nu opnieuw gevalideerd tegen de daadwerkelijke, actuele kennisbank in plaats van een toevallig kloppende kleine testfixture.
- Nieuwe regressietest in `KeywordRetriever.test.ts` legt vast dat een vraag die vrijwel uitsluitend uit verbindingswoorden bestaat, niet hoger scoort dan een inhoudelijk relevante vraag.
- Toekomstige groei van de kennisbank kan de scoreschaal opnieuw doen verschuiven (meer documenten van vergelijkbare lengte kunnen scores structureel doen stijgen of dalen); bij twijfel over het gedrag van de hallucinatie-guard is het verstandig dit opnieuw empirisch te meten tegen de dan actuele kennisbank, zoals in dit ADR gedaan.
- Stopwoordfilter is een vaste, hardcoded lijst in `KeywordRetriever.ts`; geen externe taalbibliotheek toegevoegd, in lijn met de "zo min mogelijk franje"-filosofie van het project.
