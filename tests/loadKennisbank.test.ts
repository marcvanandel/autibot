import { describe, expect, it } from "vitest";
import { join } from "node:path";
import { laadKennisbank } from "../src/kennisbank/loadKennisbank";

const FIXTURES = join(__dirname, "fixtures");
const KENNISBANK = join(__dirname, "..", "kennisbank");
const VERWACHT_WAT_IS_AUTISME = [
  "Autisme, ook wel autismespectrumstoornis (ASS) genoemd, is een neuroontwikkelingsprofiel dat samenhangt met verschillen in informatieverwerking, communicatie, sociale interactie en prikkelverwerking.",
  "Autisme is aangeboren en uit zich van persoon tot persoon verschillend. De kenmerken, ondersteuningsbehoefte en invloed op het dagelijks functioneren kunnen sterk variëren.",
  "Veel mensen met autisme hebben behoefte aan duidelijkheid, voorspelbaarheid en structuur. Ook kunnen er verschillen zijn in het begrijpen van sociale signalen, het verwerken van taal en het omgaan met veranderingen.",
  "Daarnaast komt sensorische gevoeligheid vaak voor. Prikkels zoals geluid, licht, geur, aanraking of drukte kunnen sterker, zwakker of op een andere manier worden ervaren.",
  "Autisme wordt beschreven als een spectrum. Daarmee wordt bedoeld dat er grote onderlinge verschillen zijn in presentatie, context en ervaren impact.",
].join("\n\n");
const VERWACHT_PGB_VOOR_OUDERS = [
  "Een persoonsgebonden budget (pgb) is een budget waarmee ouders of verzorgers zelf zorg of begeleiding kunnen inkopen voor een kind met een ondersteuningsbehoefte, waaronder autisme.",
  "In Nederland kan een pgb, afhankelijk van de situatie, worden aangevraagd via de gemeente, het zorgkantoor, de zorgverzekeraar of de Jeugdwet. Welke route van toepassing is, hangt af van leeftijd, zorgvraag en wettelijke regeling.",
  "Met een pgb kunnen ouders zelf keuzes maken over wie de ondersteuning levert, op welke momenten die plaatsvindt en op welke manier die wordt ingericht, binnen de voorwaarden van de verstrekker.",
  "Aan een pgb zijn regels verbonden over aanvraag, motivering, administratie, verantwoording en de kwaliteit van de ingekochte ondersteuning.",
  "De precieze mogelijkheden en voorwaarden verschillen per situatie en per financieringsvorm.",
].join("\n\n");

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
    expect(watIsAutisme?.inhoud).toBe(VERWACHT_WAT_IS_AUTISME);

    const pgbVoorOuders = fragmenten.find((f) => f.id === "pgb-voor-ouders");
    expect(pgbVoorOuders).toBeDefined();
    expect(pgbVoorOuders?.inhoud).toBe(VERWACHT_PGB_VOOR_OUDERS);
  });
});
