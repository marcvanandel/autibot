import MiniSearch from "minisearch";
import type { Fragment, Doelgroep } from "../kennisbank/types";
import { magFragmentZien } from "../kennisbank/magFragmentZien";
import type { GevondenFragment, Retriever } from "./Retriever";

const STANDAARD_TOP_N = 3;

// In een kennisbank die vrijwel uitsluitend over autisme gaat, komt het woord "autisme"
// in bijna elk artikel voor. De IDF (inverse document frequency) van die term is daardoor
// nagenoeg nul, waardoor de MiniSearch-score voor een vraag als "Wat is autisme?" bijna
// volledig wordt bepaald door de ruwe term-frequency: een lang, opsommend artikel dat de
// term vaak herhaalt (bijv. een literatuurlijst) kan zo hoger scoren dan het korte artikel
// waar de vraag feitelijk over gaat. Zie ADR-0011.
//
// Om dit te corrigeren krijgt een fragment waarvan de titel — na dezelfde stopwoordfilter
// als de zoekvraag — precies dezelfde kernwoorden bevat als de vraag (niet slechts een
// deelverzameling, want vrijwel elke titel in deze kennisbank bevat "autisme") een vaste
// scorebonus. Empirisch afgestemd tegen de echte kennisbank (zie ADR-0011).
const TITEL_MATCH_FACTOR = 10;

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

const tokeniseer = MiniSearch.getDefault("tokenize") as (tekst: string) => string[];

function kernTermen(tekst: string): Set<string> {
  const termen = tokeniseer(tekst)
    .map(verwerkTerm)
    .filter((term): term is string => term !== null);
  return new Set(termen);
}

// Een "exacte titelmatch" vereist gelijke verzamelingen (niet slechts dat de vraagtermen
// een deelverzameling van de titeltermen zijn): anders zou elk artikel met "autisme" in de
// titel al meetellen, en die term staat in vrijwel elke titel in deze kennisbank.
function magTitelBonus(vraag: string, titel: string): boolean {
  const vraagTermen = kernTermen(vraag);
  if (vraagTermen.size === 0) return false;
  const titelTermen = kernTermen(titel);
  if (vraagTermen.size !== titelTermen.size) return false;
  for (const term of vraagTermen) {
    if (!titelTermen.has(term)) return false;
  }
  return true;
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
      .map((resultaat) => {
        const fragment = this.fragmentenPerId.get(String(resultaat.id))!;
        const score = magTitelBonus(vraag, fragment.titel)
          ? resultaat.score * TITEL_MATCH_FACTOR
          : resultaat.score;
        return {
          id: fragment.id,
          titel: fragment.titel,
          inhoud: fragment.inhoud,
          bestandspad: fragment.bestandspad,
          score,
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, topN);
  }
}
