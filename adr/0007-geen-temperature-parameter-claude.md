# 0007. Geen sampling-parameters (temperature) voor de Claude-implementatie

Datum: 2026-07-22
Status: Geaccepteerd

## Context

Het ontwerp noemde aanvankelijk "lage temperature" als middel om hallucinatie te beperken. Bij het uitwerken van de implementatie bleek dat actuele Claude-modellen (o.a. Opus 4.7/4.8, Sonnet 5, Fable 5) de parameters `temperature`, `top_p` en `top_k` niet meer accepteren; een niet-standaardwaarde levert een foutmelding op.

## Beslissing

De `ClaudeProvider` stuurt geen `temperature`-parameter mee. Sturing richting voorspelbare, gegronde antwoorden verloopt volledig via de system-prompt-instructie ("antwoord uitsluitend op basis van de context; zeg het als het antwoord er niet in staat") in combinatie met de beperkte, relevante set kennisbank-fragmenten die de Retriever aanlevert.

## Consequenties

- Geen aparte sampling-instelling om te onderhouden die bij een modelwissel kan gaan breken.
- Als de gegrondheid van antwoorden in de praktijk tegenvalt, is de eerste plek om aan te draaien de system-prompt (en eventueel het `effort`-niveau), niet een sampling-parameter.
