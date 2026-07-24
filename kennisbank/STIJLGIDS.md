# Stijlgids kennisbankartikelen

Deze stijlgids geldt voor alle artikelen in `kennisbank/`. Het doel is om content te maken die consistent, neutraal, goed doorzoekbaar en geschikt is als bronmateriaal voor Autibot, menselijke lezers en agents.

## Doel van de kennisbank

De kennisbank bevat compacte Nederlandstalige achtergrondartikelen over ASS en autisme.

De artikelen zijn bedoeld als:
- bronmateriaal voor retrieval en beantwoording door de chatbot;
- leesbare, feitelijke samenvattingen voor mensen;
- consistente input voor toekomstige uitbreidingen door contributors en agents.

## Kernprincipes

### 1. Schrijf neutraal en feitelijk

Gebruik een informatieve, bronachtige stijl.

- Beschrijf in plaats van overtuigen.
- Vermijd promotionele, normatieve of moraliserende formuleringen.
- Vermijd onnodige stelligheid als iets contextafhankelijk is.
- Gebruik geen betuttelende of sentimentele toon.

Goed:

- `Autisme kan invloed hebben op communicatie, prikkelverwerking en dagelijks functioneren.`
- `Ondersteuningsbehoeften verschillen per persoon en per situatie.`

Minder geschikt:

- `Mensen met autisme hebben het vaak erg moeilijk.`
- `Het is heel belangrijk om altijd extra begrip te tonen.`

### 2. Schrijf retrieval-vriendelijk

De teksten moeten goed bruikbaar zijn voor semantisch zoeken, samenvatten en het genereren van chatbot-antwoorden.

Daarom:
- behandel per bestand één hoofdonderwerp;
- begin vroeg in de tekst met de kern of definitie;
- gebruik expliciete termen in plaats van impliciete verwijzingen;
- herhaal kernbegrippen waar dat functioneel is;
- vermijd lange inleidingen zonder inhoudelijke waarde.

Gebruik liever:
- `Autisme`
- `ASS`
- `prikkelverwerking`
- `sociale interactie`
- `ondersteuning`
- `diagnose`

in plaats van alleen vage verwijzingen zoals `dit`, `dat`, `hiermee` of `deze problematiek`.

### 3. Houd artikelen compact

Een kennisbankartikel is in beginsel kort en thematisch afgebakend.

Richtlijn:
- meestal 4 tot 6 korte alinea's;
- elke alinea behandelt één duidelijk subonderwerp;
- geen overbodige uitweidingen;
- liever opsplitsen in meerdere bestanden dan één lang verzamelartikel maken.

### 4. Schrijf alinea's als één doorlopende regel

Volg de repositoryafspraak uit `CLAUDE.md`:

- gebruik geen harde regeleinden midden in een alinea;
- laat de editor soft-wrappen;
- gebruik alleen een lege regel tussen alinea's.

## Structuur van een artikel

Elk kennisbankartikel bestaat uit:
1. YAML frontmatter;
2. een korte, directe inhoudelijke tekst in alinea's.

### Verplichte frontmatter

Gebruik minimaal:

```yaml
---
titel: "Titel van het artikel"
doelgroep: [zelf, ouder-naaste, professional, algemeen]
---
```

Opmerkingen:
- `titel` is een leesbare Nederlandstalige titel.
- `doelgroep` is een lijst met één of meer relevante doelgroepen.
- Gebruik alleen doelgroepen die echt van toepassing zijn.
- Houd de notatie consistent met bestaande bestanden.

### Aanbevolen artikelopbouw

Gebruik bij voorkeur deze volgorde:

1. **Definitie of kernzin**
   - Leg in de eerste alinea direct uit waar het artikel over gaat.
2. **Verdieping**
   - Beschrijf belangrijke kenmerken, context of variatie.
3. **Functionele uitwerking**
   - Benoem impact, voorbeelden of relevante omstandigheden.
4. **Nuance of afbakening**
   - Sluit af met context, variatie of beperking van generalisaties.

Niet elk artikel hoeft exact deze opbouw te volgen, maar de tekst moet snel scanbaar en logisch opgebouwd zijn.

## Taalgebruik

### Gewenste toon

Schrijf:
- rustig;
- concreet;
- informatief;
- precies;
- compact.

### Vermijd

Vermijd waar mogelijk:
- marketingtaal;
- overdreven empathische formuleringen;
- containerbegrippen zonder uitleg;
- subjectieve kwalificaties zoals `heel zwaar`, `erg mooi`, `fijn`, `lastig` zonder context;
- losse adviezen in artikelen die primair beschrijvend horen te zijn.

### Wees concreet

Schrijf liever:
- `Prikkels zoals geluid, licht of drukte kunnen sterker worden verwerkt.`

Dan:
- `Mensen kunnen gevoeliger zijn.`

Schrijf liever:
- `Duidelijke instructies en voorspelbaarheid kunnen de belasting verminderen.`

Dan:
- `Een goede aanpak helpt vaak.`

## Terminologie

Gebruik termen consistent.

Voorkeurstermen:
- `autisme`
- `ASS` waar relevant als afkorting van `autismespectrumstoornis`
- `mensen met autisme` of `bij autisme`
- `ondersteuningsbehoefte`
- `prikkelverwerking`
- `sociale interactie`
- `dagelijks functioneren`

Let op:
- Wissel terminologie niet onnodig af als dat semantische ruis geeft.
- Gebruik synoniemen alleen als ze inhoudelijk meerwaarde hebben.
- Als een term beladen of contextafhankelijk is, formuleer zorgvuldig en beschrijvend.

## Voorbeelden en nuance

Voorbeelden zijn toegestaan als ze een begrip verduidelijken.

Richtlijnen:
- houd voorbeelden generiek;
- maak ze niet anekdotisch of persoonlijk;
- gebruik voorbeelden om te verhelderen, niet om te dramatiseren.

Goed:
- `Voorbeelden zijn drukte, harde geluiden of onverwachte veranderingen.`

Minder geschikt:
- `Denk aan een kind dat compleet vastloopt door een onverwacht feestje in de klas.`

## Wat niet in een basisartikel hoort

Laat deze elementen alleen toe als daar een duidelijke reden voor is:
- uitgebreide stappenplannen;
- meningen of persoonlijke ervaringen;
- juridisch of medisch advies in normatieve vorm;
- claims zonder context;
- lange lijstjes met herhalingen;
- meerdere hoofdonderwerpen in één bestand.

## Bestandsnamen

Gebruik korte, beschrijvende bestandsnamen in lowercase met koppeltekens.

Voorbeelden:
- `wat-is-autisme.md`
- `diagnose-van-autisme.md`
- `communicatie-en-autisme.md`

Richtlijnen:
- gebruik Nederlands;
- maak de naam onderwerpgericht;
- vermijd afkortingen tenzij die algemeen en noodzakelijk zijn;
- houd de naam stabiel zodat links en retrieval consistent blijven.

## Wanneer splitsen naar een nieuw artikel

Maak liever een nieuw bestand als:
- een artikel meerdere duidelijke subthema's krijgt;
- een onderwerp een eigen zoekintentie heeft;
- een sectie inhoudelijk zelfstandig te beantwoorden is;
- de tekst anders te lang of te diffuus wordt.

Voorbeelden van aparte artikelen:
- `maskeren-en-camoufleren.md`
- `autisme-bij-vrouwen.md`
- `diagnostiek-op-volwassen-leeftijd.md`
- `dagstructuur-en-planning.md`

## Kwaliteitscheck voor contributors en agents

Loop vóór commit of PR deze checklist na:

- Heeft het artikel één duidelijk hoofdonderwerp?
- Staat de kern al in de eerste alinea?
- Is de toon neutraal en feitelijk?
- Zijn alinea's kort en thematisch helder?
- Is de terminologie consistent?
- Is de frontmatter aanwezig en correct?
- Is de bestandsnaam logisch en stabiel?
- Zijn er geen harde regeleinden midden in alinea's?
- Is de tekst bruikbaar als bron voor retrieval en chatbot-antwoorden?

## Bronverwijzingen en het `bronnen`-veld

Kennisbankartikelen kunnen een optioneel frontmatter-veld `bronnen` bevatten. Dit veld bereidt de kennisbank voor op toekomstige citatiefunctionaliteit en maakt duidelijk welke literatuur of bronnen ten grondslag liggen aan de inhoud van het artikel.

### Wanneer een `bronnen`-veld toevoegen

Voeg het veld toe wanneer de inhoud van het artikel aantoonbaar steunt op specifieke standaardwerken, diagnostische richtlijnen of gezaghebbende online bronnen. Verplicht is het niet; laat het weg als er geen duidelijke bronkoppeling is.

### Hoe bronnen benoemen

Gebruik een korte label die auteur en jaar combineert, of een organisatienaam:
- auteur en jaar: `Baron-Cohen 1995`, `Frith 2003`, `Attwood 2006`, `Vermeulen 2009`
- standaard of richtlijn: `DSM-5`, `ICD-11`, `NICE CG128`
- organisatie: `NVA autisme.nl`, `Autisme Centraal`

Gebruik altijd dezelfde notatie voor dezelfde bron, zodat labels consistent zijn over alle artikelen.

### Centrale literatuurlijst

Het artikel `literatuur-en-bronnen.md` is de centrale referentie voor alle bronnen in de kennisbank. Voeg een bron alleen toe als label in het `bronnen`-veld als die bron beschreven staat in `literatuur-en-bronnen.md`.

### Voorbeeld frontmatter met bronnen

```yaml
---
titel: "Wat is autisme?"
doelgroep: [zelf, ouder-naaste, professional, algemeen]
bronnen: [DSM-5, ICD-11, Baron-Cohen 1995, Frith 2003, NVA autisme.nl]
---
```

## Mini-sjabloon voor nieuwe artikelen

```markdown
---
titel: "Titel van het artikel"
doelgroep: [algemeen]
---

[Eerste alinea: definieer direct het onderwerp.]

[Tweede alinea: beschrijf belangrijke kenmerken, context of variatie.]

[Derde alinea: benoem relevante impact, voorbeelden of omstandigheden.]

[Slotalinea: geef nuance, afbakening of contextverschillen aan.]
```

## Toepassing voor agents

Agents die nieuwe kennisbankartikelen genereren of bestaande artikelen herschrijven, moeten deze stijlgids volgen als standaard werkwijze, tenzij expliciet andere instructies zijn gegeven.

Bij twijfel geldt:
- kies voor eenvoud boven retoriek;
- kies voor precisie boven variatie;
- kies voor opsplitsen boven te brede artikelen;
- kies voor neutrale beschrijving boven advies.
