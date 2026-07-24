# 0010. OpenAICompatibleProvider voor een zelf gehost lokaal model

Datum: 2026-07-24
Status: Geaccepteerd

## Context

ADR-0005 legde vast dat LLM-toegang via een vervangbare `LLMProvider`-interface loopt, met als doel later een zelf gehost open-source model te kunnen aanspreken zonder Orchestrator, Retriever of UI te wijzigen. Deze stap maakt dat concreet: een tweede `LLMProvider`-implementatie voor een lokaal draaiende, OpenAI-compatibele inferentieserver (bijv. lemonade-server), met als extra eis dat tussen Claude en het lokale model gewisseld kan worden zonder codewijziging — bijvoorbeeld lokaal tijdens ontwikkeling, Claude voor een demo. Volledige afweging in `docs/superpowers/specs/2026-07-24-lokaal-llm-provider-design.md`.

## Beslissing

`OpenAICompatibleProvider` gebruikt het officiële `openai`-npm-pakket met een aangepaste `baseURL`, in plaats van een kale `fetch`-aanroep — hetzelfde patroon als `ClaudeProvider` (`@anthropic-ai/sdk`): een officiële, getypeerde client, injecteerbaar via de constructor voor testbaarheid. De `openai`-package is specifiek gemaakt voor dit "praat met een OpenAI-compatibele server"-scenario en werkt daardoor ook met Ollama, LM Studio of vLLM, niet alleen lemonade-server.

Welke provider actief is, wordt bepaald door de omgevingsvariabele `LLM_PROVIDER` (`"claude"` of `"lokaal"`), gelezen bij het opstarten van de server via een nieuwe, losse `kiesLLMProvider()`-factory. Beide providers' configuratie (`ANTHROPIC_API_KEY` resp. `LOKAAL_LLM_BASE_URL`/`LOKAAL_LLM_MODEL`) mag tegelijk in `.env` staan; wisselen is alleen `LLM_PROVIDER` aanpassen en herstarten. Een onbekende of onvolledige providerkeuze geeft een fail-fast fout bij het opstarten, in plaats van een automatische fallback naar de andere provider.

`OpenAICompatibleProvider` stuurt, net als `ClaudeProvider` (ADR-0007), geen `temperature`/sampling-parameters mee — sturing verloopt volledig via de system-prompt, voor consistent gedrag tussen providers.

## Consequenties

- Nieuwe dependency: `openai`.
- `.env`-ondersteuning via Node's ingebouwde `--env-file-if-exists`-vlag, geen `dotenv`-dependency. Kanttekening: deze vlag negeert onopvallend regels die niet het `SLEUTEL=waarde`-formaat volgen (bijv. een typefout zonder `=`), waardoor een verkeerd geschreven `.env`-regel stilzwijgend als ontbrekend wordt behandeld in plaats van een foutmelding te geven — een beperking van Node zelf, niet van deze implementatie.
- De daadwerkelijke modelkeuze (welk model in lemonade-server geladen wordt) en de werkbaarheidstest (snelheid/kwaliteit) blijven een apart, empirisch traject — zie de "Modelkeuze en werkbaarheidstest"-sectie in het ontwerpdocument.
- Toekomstige providers (mocht dat ooit nodig zijn) volgen hetzelfde patroon: een nieuwe `LLMProvider`-implementatie plus een uitbreiding van `kiesLLMProvider`'s switch.
