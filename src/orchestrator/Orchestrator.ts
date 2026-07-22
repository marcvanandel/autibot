import type { Doelgroep } from "../kennisbank/types";
import type { Retriever } from "../retriever/Retriever";
import type { Antwoord, LLMProvider } from "../llm/LLMProvider";

// Empirisch afgesteld tegen minisearch-scores op de test-kennisbank:
// "Hoe repareer ik een lekkende kraan?" (irrelevant) → 3.25
// "Wat is autisme?" (relevant) → 17.43
// Drempel = 5 ligt hier tussenin. Fit to small 2-doc fixture (zie ADR-0006);
// echte productie-kennisbank verdient hertuning tegen werkelijke scores.
const RELEVANTIE_DREMPEL = 5;

const IK_WEET_HET_NIET: Antwoord = {
  tekst:
    "Ik heb hier geen betrouwbare informatie over in mijn kennisbank. Ik kan dus geen antwoord geven op deze vraag.",
  bronnen: [],
};

export class Orchestrator {
  constructor(
    private readonly retriever: Retriever,
    private readonly llmProvider: LLMProvider,
  ) {}

  async beantwoord(vraag: string, doelgroep: Doelgroep): Promise<Antwoord> {
    const fragmenten = this.retriever.search(vraag, doelgroep);
    const relevanteFragmenten = fragmenten.filter((f) => f.score >= RELEVANTIE_DREMPEL);

    if (relevanteFragmenten.length === 0) {
      return IK_WEET_HET_NIET;
    }

    return this.llmProvider.answer(vraag, relevanteFragmenten, doelgroep);
  }
}
