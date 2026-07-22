import type { Doelgroep } from "../kennisbank/types";
import type { Retriever } from "../retriever/Retriever";
import type { Antwoord, LLMProvider } from "../llm/LLMProvider";

// minisearch-scores zijn niet genormaliseerd naar een vaste 0-1-schaal; deze
// drempel is een startpunt en verdient bijstelling zodra er echte
// gebruikersvragen tegen de kennisbank getest zijn.
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
