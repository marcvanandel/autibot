# 0001. Architectuurbeslissingen vastleggen met ADR's

Datum: 2026-07-22
Status: Geaccepteerd

## Context

Tijdens de ontwikkeling van Autibot worden doorlopend keuzes gemaakt over architectuur en techniek (bijvoorbeeld: welke taal, hoe de kennisbank wordt doorzocht, hoe de LLM wordt aangesproken). Zonder vastlegging raakt de motivatie achter zulke keuzes op termijn zoek en worden ze impliciet — lastig te heroverwegen en lastig uit te leggen aan nieuwe bijdragers of aan onszelf, later.

## Beslissing

Belangrijke architectuur- en technologiekeuzes leggen we vast als Architecture Decision Records (ADR's) in de map `adr/`, volgens het lichte format van Michael Nygard: Datum, Status, Context, Beslissing, Consequenties. Elke ADR krijgt een oplopend nummer en een korte titel als bestandsnaam (`NNNN-korte-titel.md`). ADR's worden niet met terugwerkende kracht herschreven; een herziene beslissing krijgt een nieuwe ADR, en de oude ADR wordt gemarkeerd als vervangen ("Superseded by ADR-000X") in plaats van verwijderd.

## Consequenties

- Nieuwe architectuur- of technologiekeuzes vragen om een korte ADR naast de eigenlijke code-/ontwerpwijziging.
- Beslissingen en hun onderbouwing blijven doorzoekbaar in de git-geschiedenis, los van individuele commit messages.
- Oudere ADR's kunnen inhoudelijk verouderen ten opzichte van de actuele situatie; ze blijven als historisch document staan en worden hooguit als "vervangen" gemarkeerd, nooit verwijderd of stilzwijgend aangepast.
