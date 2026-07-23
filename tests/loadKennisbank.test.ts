import { describe, expect, it } from "vitest";
import { join } from "node:path";
import { laadKennisbank } from "../src/kennisbank/loadKennisbank";

const FIXTURES = join(__dirname, "fixtures");

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

  it("negeert een README-bestand zonder frontmatter", () => {
    const fragmenten = laadKennisbank(join(FIXTURES, "kennisbank-met-readme"));

    expect(fragmenten).toHaveLength(1);
    expect(fragmenten[0]?.id).toBe("wat-is-autisme");
  });

  it("laadt de daadwerkelijke kennisbank-map in de repository zonder te crashen", () => {
    const echteKennisbank = join(__dirname, "..", "kennisbank");

    const fragmenten = laadKennisbank(echteKennisbank);

    expect(fragmenten.length).toBeGreaterThan(0);
    expect(fragmenten.some((f) => f.id.toLowerCase() === "readme")).toBe(false);
    expect(fragmenten.some((f) => f.id.toLowerCase() === "stijlgids")).toBe(false);
    fragmenten.forEach((fragment) => {
      expect(fragment.titel.length).toBeGreaterThan(0);
      expect(fragment.doelgroep.length).toBeGreaterThan(0);
    });
  });
});
