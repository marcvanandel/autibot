import { readdirSync, readFileSync } from "node:fs";
import { join, basename, extname } from "node:path";
import matter from "gray-matter";
import type { Fragment, Doelgroep } from "./types";

const GELDIGE_DOELGROEPEN: Doelgroep[] = ["zelf", "ouder-naaste", "professional", "algemeen"];
const OVER_TE_SLAAN_BESTANDEN = new Set(["readme", "stijlgids"]);

export function laadKennisbank(map: string): Fragment[] {
  let bestanden: string[];
  try {
    bestanden = readdirSync(map).filter(
      (naam: string) =>
        extname(naam) === ".md" && !OVER_TE_SLAAN_BESTANDEN.has(basename(naam, ".md").toLowerCase()),
    );
  } catch (fout) {
    throw new Error(`Kan kennisbank-map niet lezen: ${map} (${(fout as Error).message})`);
  }

  if (bestanden.length === 0) {
    throw new Error(`Kennisbank-map is leeg: ${map}. Er is minimaal één .md-bestand nodig.`);
  }

  return bestanden.map((bestandsnaam) => {
    const pad = join(map, bestandsnaam);
    let ruw: string;
    try {
      ruw = readFileSync(pad, "utf-8");
    } catch (fout) {
      throw new Error(`Kan bestand niet lezen: ${pad} (${(fout as Error).message})`);
    }
    const { data, content } = matter(ruw);

    if (typeof data.titel !== "string" || data.titel.trim() === "") {
      throw new Error(`Ontbrekende of lege 'titel' in frontmatter van ${pad}`);
    }

    const doelgroepRuw: unknown[] = Array.isArray(data.doelgroep) ? data.doelgroep : [data.doelgroep];
    const doelgroep = doelgroepRuw.filter((d): d is Doelgroep =>
      GELDIGE_DOELGROEPEN.includes(d as Doelgroep),
    );
    if (doelgroep.length === 0) {
      throw new Error(
        `Ontbrekende of ongeldige 'doelgroep' in frontmatter van ${pad}. Geldige waarden: ${GELDIGE_DOELGROEPEN.join(", ")}`,
      );
    }

    return {
      id: basename(bestandsnaam, ".md"),
      titel: data.titel,
      doelgroep,
      inhoud: content.trim(),
      bestandspad: pad,
    };
  });
}
