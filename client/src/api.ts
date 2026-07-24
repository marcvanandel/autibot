import type { Antwoord, Doelgroep, FoutAntwoord } from "./types";

export async function stelVraag(
  vraag: string,
  doelgroep: Doelgroep,
): Promise<Antwoord | FoutAntwoord> {
  let response: Response;
  try {
    response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vraag, doelgroep }),
    });
  } catch {
    return { fout: "Kan de server niet bereiken. Controleer of Autibot draait." };
  }

  try {
    return (await response.json()) as Antwoord | FoutAntwoord;
  } catch {
    return { fout: "Kreeg een onverwachte reactie van de server." };
  }
}
