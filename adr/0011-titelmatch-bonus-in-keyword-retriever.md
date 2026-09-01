# 0011. Titelmatch-bonus in de KeywordRetriever

Datum: 2026-09-01
Status: Geaccepteerd

## Context

Een gebruiker meldde dat Autibot op de vraag "Wat is autisme?" antwoordde geen betrouwbare informatie te hebben, terwijl `kennisbank/wat-is-autisme.md` daar expliciet over gaat. Onderzoek wees uit dat het stopwoordfilter uit ADR-0009 de vraag reduceert tot de enkele term "autisme". Omdat de kennisbank vrijwel uitsluitend over autisme gaat, komt die term in 11 van de 12 artikelen voor; de IDF (inverse document frequency) van "autisme" is daardoor nagenoeg nul en de MiniSearch-score wordt dan ook bijna volledig bepaald door de ruwe term-frequency per document, los van inhoudelijke relevantie.

Concreet gemeten tegen de echte kennisbank: `literatuur-en-bronnen.md` — een opsommende literatuurlijst die "autisme" in bijna elke boek-/bronbeschrijving noemt (41 keer) — scoorde 6.67 voor de vraag "Wat is autisme?", ruim boven de `RELEVANTIE_DREMPEL` van 5. Het feitelijk relevante `wat-is-autisme.md` (7 keer "autisme") scoorde slechts 1.58, ruim onder de drempel. De Orchestrator gaf daardoor alleen de literatuurlijst mee als context aan de LLM, die vervolgens terecht meldde dat het antwoord niet in die context stond.

Twee voor de hand liggende scoring-tweaks bleken empirisch onvoldoende:
- **BM25 length-normalisatie (`b`) verhogen** — zelfs bij `b=3` (ver buiten het aanbevolen bereik 0.7–0.9) daalde `literatuur-en-bronnen` slechts tot 4.72, terwijl `wat-is-autisme` maar tot 2.01 steeg. Geen van beide zou dan de drempel halen.
- **Generieke titel-boost** (MiniSearch's `boost`-optie op het `titel`-veld) — werkt niet, omdat bijna elk artikel "autisme" ook letterlijk in de titel heeft. Een boost tilt alle "…autisme"-titels gelijk mee omhoog; zelfs bij boost=100 kwam `wat-is-autisme` niet bovenaan (andere artikelen met kortere titels wonnen dan net iets meer).

Ook het puur inkorten van `literatuur-en-bronnen.md` (minder herhaling van "autisme") bleek onvoldoende: BM25's term-frequency-verzadiging (`k=1.2`) is bij 41 herhalingen al bijna volledig verzadigd, dus zelfs een forse inkorting verschoof de score van `literatuur-en-bronnen` nauwelijks. Bovendien is de score van `wat-is-autisme.md` volledig losgekoppeld van wat er in andere bestanden staat — inkorten van het ene bestand verhoogt de score van het andere niet.

## Beslissing

`KeywordRetriever` kent voortaan een vaste scorebonus (`TITEL_MATCH_FACTOR = 10`) toe aan een fragment waarvan de titel — na tokenisatie en dezelfde stopwoordfilter als de zoekvraag — precies dezelfde kernwoorden bevat als de vraag. Cruciaal is dat dit een **gelijke verzameling** vereist, niet slechts dat de vraagtermen een deelverzameling van de titeltermen zijn: met een deelverzameling-check zou elk artikel met "autisme" in de titel al meetellen, en die term staat in vrijwel elke titel in deze kennisbank. Bij gelijke verzamelingen (bijv. vraag "Wat is autisme?" → kernterm `{autisme}`, titel "Wat is autisme?" → kernterm `{autisme}`) is een titel als "Literatuur en bronnen over autisme" (kerntermen `{literatuur, bronnen, autisme}`) uitgesloten van de bonus.

Getest tegen de echte kennisbank: "Wat is autisme?" geeft `wat-is-autisme` nu 15.79 (was 1.58) tegenover 6.66 voor `literatuur-en-bronnen` — `wat-is-autisme` staat nu bovenaan en ruim boven de drempel. Ter controle ook getest tegen de ADR-0009-scenario's: "Wat is de hoofdstad van Frankrijk?" blijft 0 resultaten opleveren en "Wat is de beste manier om te koken?" blijft ruim onder de drempel (2.75) — de bonus heeft geen effect op vragen zonder exacte titelmatch. Dezelfde bonus verbetert ook "Wat zijn de kenmerken van autisme?" (nu `kenmerken-van-autisme` bovenaan, 12.67).

Een deel van de redundante herhaling van "autisme" in `literatuur-en-bronnen.md` is daarnaast licht ingekort als op zichzelf staande tekstverbetering (verwijdering van triviaal overbodige herhalingen binnen één zin), maar dit was — zoals hierboven gebleken — niet de dragende oplossing. Een eerste inkortingspoging verving "autisme"/"mensen met autisme" op enkele plekken door het vage "dit" respectievelijk "de doelgroep zelf"; dat bleek in strijd met `kennisbank/STIJLGIDS.md` (dat vage verwijzingen expliciet afraadt en "mensen met autisme" als vaste voorkeursterm voorschrijft) en is teruggedraaid.

## Consequenties

- `RELEVANTIE_DREMPEL = 5` (Orchestrator.ts) blijft ongewijzigd; de titelmatch-bonus lost het probleem op aan de kant van `wat-is-autisme`'s score in plaats van via de drempel.
- Nieuwe regressietest in `KeywordRetriever.test.ts` legt vast dat een kort artikel met een exact overeenkomende titel wint van een lang artikel dat de zoekterm vaker herhaalt. De `literatuur.md`-fixture in `tests/fixtures/kennisbank-realistisch/` is bijgewerkt om ditzelfde patroon (herhaling van "autisme") te reproduceren — voorheen was die fixture te summier om deze regressieklasse te detecteren, waardoor de bestaande golden-scenario-test de oorspronkelijke bug niet had opgevangen.
- Deze bonus is specifiek voor het exact-titelmatch-scenario; vragen die semantisch overeenkomen met een titel maar niet dezelfde kernwoorden gebruiken (bijv. "Wat betekent autisme?") profiteren er niet van. Bredere semantische matching zou embeddings vereisen, wat buiten de scope van deze fix valt (zie ADR-0006).
- Zoals ADR-0009 al signaleerde: toekomstige groei van de kennisbank kan de scoreschaal opnieuw doen verschuiven. Bij twijfel over het gedrag van de hallucinatie-guard of de titelmatch-bonus is het verstandig dit opnieuw empirisch te meten tegen de dan actuele kennisbank.
