import { describe, expect, it, vi } from "vitest";
import { Orchestrator } from "../src/orchestrator/Orchestrator";
import { KeywordRetriever } from "../src/retriever/KeywordRetriever";
import { laadKennisbank } from "../src/kennisbank/loadKennisbank";
import type { Retriever, GevondenFragment } from "../src/retriever/Retriever";
import type { LLMProvider, Antwoord } from "../src/llm/LLMProvider";
import type { Fragment } from "../src/kennisbank/types";
import { join } from "node:path";

function maakFakeRetriever(resultaten: GevondenFragment[]): Retriever {
  return { search: vi.fn().mockReturnValue(resultaten) };
}

function maakFakeLLMProvider(antwoord: Antwoord): LLMProvider {
  return { answer: vi.fn().mockResolvedValue(antwoord) };
}

describe("Orchestrator", () => {
  it("roept de LLMProvider aan als er relevante fragmenten gevonden zijn", async () => {
    const fragment: GevondenFragment = {
      id: "a",
      titel: "Titel A",
      inhoud: "Inhoud A",
      bestandspad: "a.md",
      score: 50,
    };
    const retriever = maakFakeRetriever([fragment]);
    const verwachtAntwoord: Antwoord = { tekst: "Een antwoord.", bronnen: [fragment] };
    const llmProvider = maakFakeLLMProvider(verwachtAntwoord);
    const orchestrator = new Orchestrator(retriever, llmProvider);

    const antwoord = await orchestrator.beantwoord("Een vraag", "algemeen");

    expect(llmProvider.answer).toHaveBeenCalledWith("Een vraag", [fragment], "algemeen");
    expect(antwoord).toEqual(verwachtAntwoord);
  });

  it("roept de LLMProvider niet aan en geeft 'ik weet het niet' als er geen fragmenten gevonden zijn", async () => {
    const retriever = maakFakeRetriever([]);
    const llmProvider = maakFakeLLMProvider({
      tekst: "zou niet gebruikt moeten worden",
      bronnen: [],
    });
    const orchestrator = new Orchestrator(retriever, llmProvider);

    const antwoord = await orchestrator.beantwoord("Een ongedekte vraag", "algemeen");

    expect(llmProvider.answer).not.toHaveBeenCalled();
    expect(antwoord.tekst).toContain("geen betrouwbare informatie");
    expect(antwoord.bronnen).toEqual([]);
  });

  it("roept de LLMProvider niet aan als alle gevonden fragmenten onder de relevantiedrempel liggen", async () => {
    const zwakFragment: GevondenFragment = {
      id: "a",
      titel: "Titel A",
      inhoud: "Inhoud A",
      bestandspad: "a.md",
      score: 0.1,
    };
    const retriever = maakFakeRetriever([zwakFragment]);
    const llmProvider = maakFakeLLMProvider({
      tekst: "zou niet gebruikt moeten worden",
      bronnen: [],
    });
    const orchestrator = new Orchestrator(retriever, llmProvider);

    const antwoord = await orchestrator.beantwoord("Vage vraag", "algemeen");

    expect(llmProvider.answer).not.toHaveBeenCalled();
    expect(antwoord.bronnen).toEqual([]);
  });
});

describe("Orchestrator met een basisfragment (altijd meegegeven context)", () => {
  const basisFragment: Fragment = {
    id: "wat-is-autisme",
    titel: "Wat is autisme?",
    doelgroep: ["zelf", "ouder-naaste", "professional", "algemeen"],
    inhoud: "Autisme is een neuroontwikkelingsprofiel.",
    bestandspad: "wat-is-autisme.md",
  };

  it("voegt het basisfragment toe aan de context zodra er al minstens één relevant fragment gevonden is", async () => {
    const gevondenFragment: GevondenFragment = {
      id: "pgb-voor-ouders",
      titel: "PGB aanvragen als ouder",
      inhoud: "Ouders kunnen een pgb aanvragen.",
      bestandspad: "pgb-voor-ouders.md",
      score: 50,
    };
    const retriever = maakFakeRetriever([gevondenFragment]);
    const llmProvider = maakFakeLLMProvider({ tekst: "Een antwoord.", bronnen: [] });
    const orchestrator = new Orchestrator(retriever, llmProvider, basisFragment);

    await orchestrator.beantwoord("Hoe vraag ik een pgb aan?", "algemeen");

    const gebruikteFragmenten = (llmProvider.answer as ReturnType<typeof vi.fn>).mock
      .calls[0][1] as GevondenFragment[];
    expect(gebruikteFragmenten.map((f) => f.id)).toEqual(["pgb-voor-ouders", "wat-is-autisme"]);
  });

  it("voegt het basisfragment niet dubbel toe als het al bij de gevonden fragmenten zit", async () => {
    const gevondenBasisFragment: GevondenFragment = {
      id: "wat-is-autisme",
      titel: "Wat is autisme?",
      inhoud: "Autisme is een neuroontwikkelingsprofiel.",
      bestandspad: "wat-is-autisme.md",
      score: 50,
    };
    const retriever = maakFakeRetriever([gevondenBasisFragment]);
    const llmProvider = maakFakeLLMProvider({ tekst: "Een antwoord.", bronnen: [] });
    const orchestrator = new Orchestrator(retriever, llmProvider, basisFragment);

    await orchestrator.beantwoord("Wat is autisme?", "algemeen");

    const gebruikteFragmenten = (llmProvider.answer as ReturnType<typeof vi.fn>).mock
      .calls[0][1] as GevondenFragment[];
    expect(gebruikteFragmenten.filter((f) => f.id === "wat-is-autisme")).toHaveLength(1);
  });

  it("voegt het basisfragment niet toe als er geen relevante fragmenten zijn (hallucinatie-guard blijft intact)", async () => {
    const retriever = maakFakeRetriever([]);
    const llmProvider = maakFakeLLMProvider({
      tekst: "zou niet gebruikt moeten worden",
      bronnen: [],
    });
    const orchestrator = new Orchestrator(retriever, llmProvider, basisFragment);

    const antwoord = await orchestrator.beantwoord("Hoe repareer ik een lekkende kraan?", "algemeen");

    expect(llmProvider.answer).not.toHaveBeenCalled();
    expect(antwoord.tekst).toContain("geen betrouwbare informatie");
  });

  it("voegt het basisfragment niet toe als het niet zichtbaar is voor de gekozen doelgroep", async () => {
    const alleenProfessionalFragment: Fragment = { ...basisFragment, doelgroep: ["professional"] };
    const gevondenFragment: GevondenFragment = {
      id: "pgb-voor-ouders",
      titel: "PGB aanvragen als ouder",
      inhoud: "Ouders kunnen een pgb aanvragen.",
      bestandspad: "pgb-voor-ouders.md",
      score: 50,
    };
    const retriever = maakFakeRetriever([gevondenFragment]);
    const llmProvider = maakFakeLLMProvider({ tekst: "Een antwoord.", bronnen: [] });
    const orchestrator = new Orchestrator(retriever, llmProvider, alleenProfessionalFragment);

    await orchestrator.beantwoord("Hoe vraag ik een pgb aan?", "zelf");

    const gebruikteFragmenten = (llmProvider.answer as ReturnType<typeof vi.fn>).mock
      .calls[0][1] as GevondenFragment[];
    expect(gebruikteFragmenten.map((f) => f.id)).toEqual(["pgb-voor-ouders"]);
  });
});

describe("Orchestrator met KeywordRetriever (golden scenario's)", () => {
  // Gebruikt een fixture met een realistisch aantal documenten (vergelijkbaar met de
  // echte kennisbank), niet de minimale 2-document kennisbank-geldig-fixture: de
  // RELEVANTIE_DREMPEL-score is corpusgrootte-afhankelijk (meer documenten -> hogere IDF
  // voor een zeldzame term), dus een te kleine fixture geeft geen betrouwbaar beeld van
  // het gedrag tegen de echte kennisbank. Zie ADR-0009.
  const fragmenten = laadKennisbank(join(__dirname, "fixtures", "kennisbank-realistisch"));
  const retriever = new KeywordRetriever(fragmenten);

  it("geeft bij een gedekte vraag het antwoord van de LLMProvider, gebaseerd op de juiste bron", async () => {
    const llmProvider = maakFakeLLMProvider({ tekst: "Een gegrond antwoord.", bronnen: [] });
    const orchestrator = new Orchestrator(retriever, llmProvider);

    const antwoord = await orchestrator.beantwoord("Wat is autisme?", "algemeen");

    expect(llmProvider.answer).toHaveBeenCalled();
    const gebruikteFragmenten = (llmProvider.answer as ReturnType<typeof vi.fn>).mock
      .calls[0][1] as GevondenFragment[];
    expect(gebruikteFragmenten.some((f) => f.id === "wat-is-autisme")).toBe(true);
    expect(antwoord.tekst).toBe("Een gegrond antwoord.");
  });

  it("geeft bij een ongedekte vraag 'ik weet het niet', zonder de LLMProvider aan te roepen", async () => {
    const llmProvider = maakFakeLLMProvider({
      tekst: "zou niet gebruikt moeten worden",
      bronnen: [],
    });
    const orchestrator = new Orchestrator(retriever, llmProvider);

    const antwoord = await orchestrator.beantwoord(
      "Hoe repareer ik een lekkende kraan?",
      "algemeen",
    );

    expect(llmProvider.answer).not.toHaveBeenCalled();
    expect(antwoord.tekst).toContain("geen betrouwbare informatie");
  });
});
