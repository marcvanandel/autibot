import { describe, expect, it, vi } from "vitest";
import { Orchestrator } from "../src/orchestrator/Orchestrator";
import { KeywordRetriever } from "../src/retriever/KeywordRetriever";
import { laadKennisbank } from "../src/kennisbank/loadKennisbank";
import type { Retriever, GevondenFragment } from "../src/retriever/Retriever";
import type { LLMProvider, Antwoord } from "../src/llm/LLMProvider";
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

describe("Orchestrator met KeywordRetriever (golden scenario's)", () => {
  const fragmenten = laadKennisbank(join(__dirname, "fixtures", "kennisbank-geldig"));
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
