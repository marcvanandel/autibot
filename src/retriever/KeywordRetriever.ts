import MiniSearch from "minisearch";
import type { Fragment, Doelgroep } from "../kennisbank/types";
import type { GevondenFragment, Retriever } from "./Retriever";

const STANDAARD_TOP_N = 3;

// Hoogfrequente Nederlandse verbindingswoorden. Zonder filtering hiervan kan een vraag
// die vooral uit zulke woorden bestaat (bijv. "Wat is de ... van ...?") een hoge score
// krijgen puur door woordoverlap met vrijwel elk kort kennisbank-artikel, los van
// inhoudelijke relevantie — met genoeg korte documenten in de kennisbank overstijgt die
// score dan de RELEVANTIE_DREMPEL in de Orchestrator. Zie ADR-0009.
const STOPWOORDEN = new Set([
  "wat", "is", "de", "het", "een", "en", "van", "in", "op", "te", "om",
  "voor", "met", "aan", "bij", "dat", "die", "dit", "er", "als", "of",
  "ik", "je", "jij", "u", "hij", "zij", "we", "wij", "ze", "zijn", "was",
  "waren", "worden", "wordt", "kan", "kunnen", "niet", "ook", "dan", "naar",
  "uit", "over", "maar", "zo", "nog", "wel", "geen", "hoe", "waarom",
]);

function verwerkTerm(term: string): string | null {
  const genormaliseerd = term.toLowerCase();
  return STOPWOORDEN.has(genormaliseerd) ? null : genormaliseerd;
}

function magFragmentZien(fragment: Fragment, gekozenDoelgroep: Doelgroep): boolean {
  if (gekozenDoelgroep === "algemeen") return true;
  return fragment.doelgroep.includes(gekozenDoelgroep) || fragment.doelgroep.includes("algemeen");
}

export class KeywordRetriever implements Retriever {
  private readonly index: MiniSearch<Fragment>;
  private readonly fragmentenPerId: Map<string, Fragment>;

  constructor(fragmenten: Fragment[]) {
    this.fragmentenPerId = new Map(fragmenten.map((f) => [f.id, f]));
    this.index = new MiniSearch<Fragment>({
      idField: "id",
      fields: ["titel", "inhoud"],
      storeFields: ["titel", "inhoud", "bestandspad"],
      processTerm: verwerkTerm,
    });
    this.index.addAll(fragmenten);
  }

  search(vraag: string, doelgroep: Doelgroep, topN: number = STANDAARD_TOP_N): GevondenFragment[] {
    const resultaten = this.index.search(vraag, { prefix: true, fuzzy: 0.2 });

    return resultaten
      .filter((resultaat) => {
        const fragment = this.fragmentenPerId.get(String(resultaat.id));
        return fragment !== undefined && magFragmentZien(fragment, doelgroep);
      })
      .slice(0, topN)
      .map((resultaat) => {
        const fragment = this.fragmentenPerId.get(String(resultaat.id))!;
        return {
          id: fragment.id,
          titel: fragment.titel,
          inhoud: fragment.inhoud,
          bestandspad: fragment.bestandspad,
          score: resultaat.score,
        };
      });
  }
}
