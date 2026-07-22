import type { Doelgroep } from "../kennisbank/types";
import type { GevondenFragment } from "../retriever/Retriever";

const TOONINSTRUCTIE_PER_DOELGROEP: Record<Doelgroep, string> = {
  zelf: "Spreek de gebruiker direct aan en gebruik concrete, toegankelijke taal.",
  "ouder-naaste":
    "Leg uit hoe dit voor een naaste met autisme kan gelden en wat een ouder/naaste concreet kan doen.",
  professional:
    "Gebruik vaktaal waar relevant en verwijs naar onderliggende criteria of bronnen indien beschikbaar.",
  algemeen: "Gebruik heldere, neutrale taal die voor een breed publiek begrijpelijk is.",
};

export function bouwSystemPrompt(doelgroep: Doelgroep): string {
  return [
    "Je bent Autibot, een assistent die vragen over autisme (ASS) beantwoordt.",
    "Antwoord uitsluitend op basis van de context die hieronder in de gebruikersvraag wordt meegegeven.",
    "Als het antwoord niet in de gegeven context staat, zeg dat dan expliciet en verzin geen informatie.",
    TOONINSTRUCTIE_PER_DOELGROEP[doelgroep],
  ].join(" ");
}

export function bouwGebruikersprompt(vraag: string, fragmenten: GevondenFragment[]): string {
  const context = fragmenten
    .map((fragment, index) => `[Bron ${index + 1}: ${fragment.titel}]\n${fragment.inhoud}`)
    .join("\n\n");

  return `Context:\n${context}\n\nVraag: ${vraag}`;
}
