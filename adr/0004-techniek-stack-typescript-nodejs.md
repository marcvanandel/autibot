# 0004. Techniek-stack: TypeScript/Node.js

Datum: 2026-07-22
Status: Geaccepteerd

## Context

Het prototype wordt gebouwd als een lokale demo met een eenvoudige webpagina (front-end) en een klein achterliggend proces (retrieval + LLM-aanroep). Er was geen bestaande codebase die een taal voorschreef.

## Beslissing

Autibot wordt gebouwd in TypeScript/Node.js, zowel voor de lokale webserver/UI als voor de Retriever- en LLMProvider-laag.

## Consequenties

- Eén taal voor front- en backend, wat het prototype overzichtelijker houdt dan een gesplitste stack.
- RAG/LLM-tooling in het Node-ecosysteem is minder rijk dan in Python, maar voor de eenvoudige keyword-retrieval en directe API-aanroepen van de MVP is dat geen belemmering.
