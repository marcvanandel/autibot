import type { Doelgroep } from "../kennisbank/types";

export interface GevondenFragment {
  id: string;
  titel: string;
  inhoud: string;
  bestandspad: string;
  score: number;
}

export interface Retriever {
  search(vraag: string, doelgroep: Doelgroep, topN?: number): GevondenFragment[];
}
