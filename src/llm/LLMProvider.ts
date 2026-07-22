import type { Doelgroep } from "../kennisbank/types";
import type { GevondenFragment } from "../retriever/Retriever";

export interface Antwoord {
  tekst: string;
  bronnen: GevondenFragment[];
}

export interface LLMProvider {
  answer(vraag: string, fragmenten: GevondenFragment[], doelgroep: Doelgroep): Promise<Antwoord>;
}
