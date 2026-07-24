export type Doelgroep = "zelf" | "ouder-naaste" | "professional" | "algemeen";

export interface Bron {
  id: string;
  titel: string;
  inhoud: string;
  bestandspad: string;
  score: number;
}

export interface Antwoord {
  tekst: string;
  bronnen: Bron[];
}

export interface FoutAntwoord {
  fout: string;
}

export interface GesprekItem {
  id: string;
  vraag: string;
  bezig: boolean;
  antwoord?: Antwoord;
  fout?: string;
}
