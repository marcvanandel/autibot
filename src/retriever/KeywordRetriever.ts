import MiniSearch from "minisearch";
import type { Fragment, Doelgroep } from "../kennisbank/types";
import type { GevondenFragment, Retriever } from "./Retriever";

const STANDAARD_TOP_N = 3;

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
