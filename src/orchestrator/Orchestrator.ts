import type { Doelgroep, Fragment } from "../kennisbank/types";
import { magFragmentZien } from "../kennisbank/magFragmentZien";
import type { GevondenFragment, Retriever } from "../retriever/Retriever";
import type { Antwoord, LLMProvider } from "../llm/LLMProvider";

// Empirisch afgesteld en herbevestigd tegen de echte kennisbank (niet alleen een kleine
// testfixture): zie ADR-0009 voor de herijking na het toevoegen van het stopwoordfilter,
// en ADR-0011 voor de titelmatch-bonus in KeywordRetriever die voorkomt dat een lang,
// opsommend artikel een kort, feitelijk relevant artikel overstemt.
const RELEVANTIE_DREMPEL = 5;

const IK_WEET_HET_NIET: Antwoord = {
  tekst:
    "Ik heb hier geen betrouwbare informatie over in mijn kennisbank. Ik kan dus geen antwoord geven op deze vraag.",
  bronnen: [],
};

// Score-plaatshouder voor een via voegBasisFragmentToe toegevoegd fragment: het heeft geen
// eigen retrieval-score (het wordt immers niet via retrieval gevonden). Losgekoppeld van
// RELEVANTIE_DREMPEL zodat hertuning van die drempel deze plaatshoudende waarde niet
// per ongeluk meeverandert.
const BASISFRAGMENT_SCORE = 5;

export class Orchestrator {
  constructor(
    private readonly retriever: Retriever,
    private readonly llmProvider: LLMProvider,
    // Fragment dat, zodra Autibot sowieso al gaat antwoorden, altijd als extra context wordt
    // meegegeven — ongeacht de eigen retrieval-score. Bedoeld voor een kort, definiërend
    // artikel (bijv. "Wat is autisme?") dat als basiskennis nuttig is bij vrijwel elke vraag,
    // ook als de vraag zelf geen titelmatch of hoge score oplevert (zie ADR-0012). Telt niet
    // mee voor de RELEVANTIE_DREMPEL-check: bij een evident ongedekte vraag blijft "ik weet
    // het niet" dus intact.
    private readonly basisFragment?: Fragment,
  ) {}

  async beantwoord(vraag: string, doelgroep: Doelgroep): Promise<Antwoord> {
    const fragmenten = this.retriever.search(vraag, doelgroep);
    const relevanteFragmenten = fragmenten.filter((f) => f.score >= RELEVANTIE_DREMPEL);

    if (relevanteFragmenten.length === 0) {
      return IK_WEET_HET_NIET;
    }

    const fragmentenVoorLLM = this.voegBasisFragmentToe(relevanteFragmenten, doelgroep);
    return this.llmProvider.answer(vraag, fragmentenVoorLLM, doelgroep);
  }

  private voegBasisFragmentToe(
    fragmenten: GevondenFragment[],
    doelgroep: Doelgroep,
  ): GevondenFragment[] {
    const basisFragment = this.basisFragment;
    if (!basisFragment) return fragmenten;
    if (fragmenten.some((f) => f.id === basisFragment.id)) return fragmenten;
    if (!magFragmentZien(basisFragment, doelgroep)) return fragmenten;

    return [
      ...fragmenten,
      {
        id: basisFragment.id,
        titel: basisFragment.titel,
        inhoud: basisFragment.inhoud,
        bestandspad: basisFragment.bestandspad,
        score: BASISFRAGMENT_SCORE,
      },
    ];
  }
}
