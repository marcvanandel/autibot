# 0012. Basisfragment altijd als context meegeven

Datum: 2026-09-01
Status: Geaccepteerd

## Context

ADR-0011 loste op dat `wat-is-autisme.md` niet werd gevonden voor de letterlijke vraag "Wat is autisme?", via een titelmatch-bonus in `KeywordRetriever`. Die bonus vereist echter een (bijna) exacte overeenkomst tussen de kernwoorden van de vraag en de titel. Vragen die semantisch hetzelfde vragen maar andere bewoording gebruiken (bijv. "Wat betekent autisme?", "Leg autisme uit") profiteren daar niet van, en `wat-is-autisme.md`'s eigen retrieval-score is en blijft laag zodra de vraag niet vrijwel letterlijk de titel is (zie ADR-0011's Consequenties).

Het artikel `wat-is-autisme.md` is kort (circa 140 woorden) en definiërend: het legt de kernbegrippen van autisme uit waar vrijwel elk ander artikel in de kennisbank op voortbouwt. De suggestie kwam op om dit fragment daarom altijd als context aan de LLM mee te geven, ongeacht de retrieval-score, zodat elke autisme-gerelateerde vraag — ook een matig scorende — in elk geval over deze basiskennis beschikt.

Een naïeve implementatie (het basisfragment altijd meetellen, ook vóór de `RELEVANTIE_DREMPEL`-check in `Orchestrator.beantwoord`) zou de hallucinatie-guard uit ADR-0006/ADR-0009 ondermijnen: elke vraag, ook een evident ongedekte (bijv. "Hoe repareer ik een lekkende kraan?"), zou dan altijd minstens één "relevant" fragment hebben en dus altijd de LLM aanroepen in plaats van de hardcoded "ik weet het niet" te geven.

## Beslissing

`Orchestrator` accepteert een optioneel derde constructorargument `basisFragment?: Fragment`. De `RELEVANTIE_DREMPEL`-check blijft ongewijzigd op de echte retrieval-scores draaien; het basisfragment telt daar niet in mee. Pas ná die check — dus alleen als er al minstens één fragment de drempel haalt en Autibot dus sowieso gaat antwoorden — wordt het basisfragment aan de context toegevoegd, met drie voorwaarden:
- het staat niet al in de gevonden fragmenten (geen duplicaat);
- het is zichtbaar voor de gekozen doelgroep (hergebruik van `magFragmentZien`, verplaatst van `KeywordRetriever.ts` naar het gedeelde `src/kennisbank/magFragmentZien.ts` zodat beide plekken dezelfde zichtbaarheidsregel gebruiken);
- er is een `basisFragment` geconfigureerd.

In `src/index.ts` wordt het fragment met id `wat-is-autisme` uit de geladen kennisbank opgezocht en als basisfragment doorgegeven; ontbreekt het (bijv. na hernoeming), dan wordt een waarschuwing gelogd en werkt Autibot verder zonder deze functie, zonder te crashen.

Getest tegen de echte kennisbank (zie `scratch-e2e.ts`, niet ingecheckt): "Wat is autisme?" bevat `wat-is-autisme` al via de normale retrieval (geen duplicaat toegevoegd); "Hoe vraag ik een pgb aan?" en "Hoe ga ik om met overprikkeling?" krijgen `wat-is-autisme` er nu automatisch bij; "Hoe repareer ik een lekkende kraan?" blijft "ik weet het niet" geven zonder de LLM aan te roepen — de hallucinatie-guard blijft intact.

## Consequenties

- `Antwoord.bronnen` (wat de gebruiker als bronnen te zien krijgt) bevat voortaan bij vrijwel elk beantwoord antwoord ook `wat-is-autisme.md`, ook als het niet expliciet in de LLM-tekst wordt aangehaald. Dit is een bewuste keuze voor transparantie (bronnen weerspiegelen exact wat als context is meegegeven) boven een striktere "alleen wat is aangehaald"-weergave, die een aparte scheiding tussen LLM-context en getoonde bronnen zou vereisen.
- Deze aanpak is specifiek voor één, bewust gekozen kort en universeel toepasbaar artikel. Het schaalt niet naadloos naar meerdere "altijd"-fragmenten zonder de promptlengte (en dus kosten) voor elke aanroep te verhogen; mocht die behoefte ontstaan, dan verdient dat een herziening (bijv. een lijst basisfragmenten met een gezamenlijk woordenbudget).
- De doelgroep-zichtbaarheidscontrole (`magFragmentZien`) is verplaatst naar een gedeeld bestand; dit is een kleine, niet-gedragswijzigende refactor (dezelfde logica, nu op één plek) om duplicatie tussen `KeywordRetriever` en `Orchestrator` te voorkomen.
