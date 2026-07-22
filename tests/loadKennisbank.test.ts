import { describe, expect, it } from "vitest";
import { join } from "node:path";
import { laadKennisbank } from "../src/kennisbank/loadKennisbank";

const FIXTURES = join(__dirname, "fixtures");
const KENNISBANK = join(__dirname, "..", "kennisbank");
const MIN_VERWACHTE_PARAGRAFEN = 5;

function telParagrafen(inhoud: string): number {
  return inhoud.split(/\n{2,}/).filter((paragraaf) => paragraaf.trim() !== "").length;
}

describe("laadKennisbank", () => {
  it("laadt geldige markdown-bestanden met frontmatter in fragmenten", () => {
    const fragmenten = laadKennisbank(join(FIXTURES, "kennisbank-geldig"));

    expect(fragmenten).toHaveLength(2);
    const watIsAutisme = fragmenten.find((f) => f.id === "wat-is-autisme");
    expect(watIsAutisme?.titel).toBe("Wat is autisme?");
    expect(watIsAutisme?.doelgroep).toEqual(["zelf", "ouder-naaste", "professional", "algemeen"]);
    expect(watIsAutisme?.inhoud).toContain("ontwikkelingsstoornis");
  });

  it("gooit een duidelijke fout als de kennisbank-map geen .md-bestanden bevat", () => {
    expect(() => laadKennisbank(join(FIXTURES, "kennisbank-leeg"))).toThrow(/leeg/i);
  });

  it("gooit een duidelijke fout als een bestand geen titel heeft", () => {
    expect(() => laadKennisbank(join(FIXTURES, "kennisbank-ongeldig"))).toThrow(/titel/i);
  });

  it("gooit een duidelijke fout als een bestand een ongeldige doelgroep heeft", () => {
    expect(() => laadKennisbank(join(FIXTURES, "kennisbank-ongeldig-doelgroep"))).toThrow(/doelgroep/i);
  });

  it("laadt kennisbankbestanden met de verwachte repository-inhoud", () => {
    const fragmenten = laadKennisbank(KENNISBANK);

    const watIsAutisme = fragmenten.find((f) => f.id === "wat-is-autisme");
    expect(watIsAutisme).toBeDefined();
    expect(telParagrafen(watIsAutisme!.inhoud)).toBeGreaterThanOrEqual(MIN_VERWACHTE_PARAGRAFEN);
    expect(watIsAutisme?.inhoud).toContain("neuroontwikkelingsprofiel");
    expect(watIsAutisme?.inhoud).toContain("Autisme is aangeboren");
    expect(watIsAutisme?.inhoud).toContain("sensorische gevoeligheid");
    expect(watIsAutisme?.inhoud).toContain("Autisme wordt beschreven als een spectrum");

    const pgbVoorOuders = fragmenten.find((f) => f.id === "pgb-voor-ouders");
    expect(pgbVoorOuders).toBeDefined();
    expect(telParagrafen(pgbVoorOuders!.inhoud)).toBeGreaterThanOrEqual(MIN_VERWACHTE_PARAGRAFEN);
    expect(pgbVoorOuders?.inhoud).toContain("ouders of verzorgers zelf zorg of begeleiding kunnen inkopen");
    expect(pgbVoorOuders?.inhoud).toContain("de gemeente, het zorgkantoor, de zorgverzekeraar of de Jeugdwet");
    expect(pgbVoorOuders?.inhoud).toContain("Aan een pgb zijn regels verbonden");
    expect(pgbVoorOuders?.inhoud).toContain("per financieringsvorm");
  });
});
