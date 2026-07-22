# 0005. LLM-toegang achter een vervangbare interface

Datum: 2026-07-22
Status: Geaccepteerd

## Context

Voor privacygevoelige informatie (autisme-gerelateerde vragen, mogelijk met persoonlijke context) is een zelf gehost open-source model op termijn het gewenste eindbeeld. Tegelijk is een cloud-API (Claude) de snelste weg naar een werkend, demonstreerbaar prototype.

## Beslissing

LLM-toegang loopt via een `LLMProvider`-interface (`answer(vraag, fragmenten, doelgroep) → antwoord`). De MVP gebruikt een `ClaudeProvider` (Claude API) voor het prototype/de demo. De architectuur is zo opgezet dat een `ClaudeProvider` later vervangen kan worden door een implementatie die een zelf gehost open-source model aanspreekt, zonder de Orchestrator, Retriever of UI te wijzigen.

## Consequenties

- De demo gebruikt in eerste instantie een losse Claude API-key met een eigen budget/spend-limit, gescheiden van ander gebruik.
- De keuze van het uiteindelijke zelf gehost model (bijvoorbeeld een Qwen 2.5-variant via een lokale inferentieserver) is nog open en kan later los van de rest van de applicatie gemaakt worden.
