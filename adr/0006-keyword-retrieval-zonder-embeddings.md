# 0006. Retrieval via keyword/full-text search, geen embeddings in de MVP

Datum: 2026-07-22
Status: Geaccepteerd

## Context

Om relevante kennisbank-fragmenten te vinden bij een vraag was de keuze tussen keyword/full-text search en embedding-gebaseerd (semantisch) zoeken. Semantisch zoeken is robuuster tegen herformuleringen, maar vereist een apart embedding-model en een index-bouwstap.

## Beslissing

De MVP gebruikt keyword/full-text search (`minisearch`) achter een `Retriever`-interface (`search(vraag, doelgroep) → fragment[]`). Embedding-gebaseerde retrieval is bewust niet gekozen voor de MVP, maar blijft een optie voor later, mocht keyword-search onvoldoende relevante fragmenten opleveren.

## Consequenties

- Geen extra ML-dependency of index-bouwstap nodig naast de kennisbank zelf.
- Minder robuust tegen synoniemen/herformuleringen dan semantisch zoeken; dit wordt in de MVP-testen (golden scenario's) in de gaten gehouden.
- Een latere overstap naar een embedding-gebaseerde `Retriever`-implementatie raakt alleen de Retriever, niet de Orchestrator of UI.
