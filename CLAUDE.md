# CLAUDE.md

Dit bestand biedt richtlijnen aan Claude Code (claude.ai/code) bij het werken met code in deze repository.

## Status van het project

Autibot is een Nederlandstalig projectidee voor een chatbot/chatinterface op basis van een LLM, die antwoorden geeft op basis van geselecteerde teksten over ASS (Autisme Spectrum Stoornis). Deze repository is momenteel enkel de eerste aanzet/het prototype-idee: ze bevat alleen een `README.md` en een `LICENSE` (MIT), zonder broncode, buildtooling of tests.

Omdat er nog geen code of tooling aanwezig is, zijn er geen build-, lint- of testcommando's om uit te voeren. Zodra er code wordt toegevoegd, werk dit bestand dan bij met de daadwerkelijke commando's (build, lint, het draaien van een enkele test) en de werkelijke architectuur — ga niet op voorhand uit van een bepaalde technische stack.

## Architectuurbeslissingen (ADR's)

Belangrijke architectuur- en technologiekeuzes worden vastgelegd als Architecture Decision Records in de map `adr/` (zie `adr/0001-architectuurbeslissingen-vastleggen-met-adrs.md` voor het format en de afspraak zelf). Maak bij het nemen of voorstellen van een noemenswaardige architectuur- of technologiekeuze (bijv. taal/framework, opslag, hoe de kennisbank doorzocht wordt, hoe een LLM wordt aangesproken) een nieuwe, oplopend genummerde ADR aan (`NNNN-korte-titel.md`) met Datum, Status, Context, Beslissing en Consequenties. Bestaande ADR's worden niet herschreven; een herziene beslissing krijgt een nieuwe ADR die de oude als "vervangen" markeert.

## Opmaak van Markdown-bestanden

Schrijf alinea's als één doorlopende regel (geen harde regeleinde halverwege een zin/alinea). Laat de editor de tekst soft-wrappen op schermbreedte; harde line breaks maken de tekst in diff-weergave en op smalle schermen juist moeilijker leesbaar.
