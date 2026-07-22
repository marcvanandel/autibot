export type Doelgroep = "zelf" | "ouder-naaste" | "professional" | "algemeen";

export interface Fragment {
  id: string;
  titel: string;
  doelgroep: Doelgroep[];
  inhoud: string;
  bestandspad: string;
}
