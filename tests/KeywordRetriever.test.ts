import { describe, expect, it } from "vitest";
import { KeywordRetriever } from "../src/retriever/KeywordRetriever";
import type { Fragment } from "../src/kennisbank/types";

const FRAGMENTEN: Fragment[] = [
  {
    id: "wat-is-autisme",
    titel: "Wat is autisme?",
    doelgroep: ["algemeen"],
    inhoud: "Autisme is een ontwikkelingsstoornis die de sociale communicatie beinvloedt.",
    bestandspad: "wat-is-autisme.md",
  },
  {
    id: "pgb-voor-ouders",
    titel: "PGB aanvragen als ouder",
    doelgroep: ["ouder-naaste"],
    inhoud: "Ouders kunnen een persoonsgebonden budget (pgb) aanvragen voor extra begeleiding.",
    bestandspad: "pgb-voor-ouders.md",
  },
  {
    id: "diagnostiek-professional",
    titel: "Diagnostisch proces voor professionals",
    doelgroep: ["professional"],
    inhoud: "Het diagnostisch proces volgt de DSM-5 criteria voor autismespectrumstoornis.",
    bestandspad: "diagnostiek-professional.md",
  },
];

describe("KeywordRetriever", () => {
  it("vindt het relevante fragment op basis van trefwoorden", () => {
    const retriever = new KeywordRetriever(FRAGMENTEN);

    const resultaten = retriever.search("Hoe vraag ik een pgb aan?", "ouder-naaste");

    expect(resultaten[0]?.id).toBe("pgb-voor-ouders");
  });

  it("filtert fragmenten die niet bij de gekozen doelgroep horen", () => {
    const retriever = new KeywordRetriever(FRAGMENTEN);

    const resultaten = retriever.search("DSM-5 criteria diagnostiek", "ouder-naaste");

    expect(resultaten.find((r) => r.id === "diagnostiek-professional")).toBeUndefined();
  });

  it("toont algemene fragmenten aan elke doelgroep", () => {
    const retriever = new KeywordRetriever(FRAGMENTEN);

    const resultaten = retriever.search("Wat is autisme", "professional");

    expect(resultaten.find((r) => r.id === "wat-is-autisme")).toBeDefined();
  });

  it("toont alle fragmenten aan de doelgroep 'algemeen'", () => {
    const retriever = new KeywordRetriever(FRAGMENTEN);

    const resultaten = retriever.search("persoonsgebonden budget", "algemeen");

    expect(resultaten.find((r) => r.id === "pgb-voor-ouders")).toBeDefined();
  });
});

// Grotere, kortere-documenten-fixture: reproduceert een regressie die met de kleine
// FRAGMENTEN-set hierboven niet zichtbaar wordt. Bij genoeg korte documenten kunnen
// hoogfrequente verbindingswoorden ("wat", "is", "de", "van", "om", "te") in een vraag
// een hoge score opleveren puur door woordoverlap, los van inhoudelijke relevantie.
const KORTE_DOCUMENTEN: Fragment[] = [
  {
    id: "wat-is-autisme",
    titel: "Wat is autisme?",
    doelgroep: ["algemeen"],
    inhoud:
      "Autisme is een ontwikkelingsstoornis die van invloed is op hoe iemand de wereld waarneemt en ermee omgaat.",
    bestandspad: "wat-is-autisme.md",
  },
  {
    id: "overprikkeling",
    titel: "Omgaan met overprikkeling",
    doelgroep: ["algemeen"],
    inhoud:
      "Overprikkeling is een toestand waarin de hoeveelheid of intensiteit van prikkels groter is dan iemand op dat moment goed kan verwerken. Wat effectief is, verschilt per persoon.",
    bestandspad: "overprikkeling.md",
  },
  {
    id: "vrouwen-en-meisjes",
    titel: "Autisme bij vrouwen en meisjes",
    doelgroep: ["algemeen"],
    inhoud:
      "Veel onderzoek naar autisme is historisch uitgevoerd met overwegend mannelijke deelnemers, waardoor de kenmerken van vrouwen en meisjes met autisme lange tijd onderbelicht zijn gebleven.",
    bestandspad: "vrouwen-en-meisjes.md",
  },
  {
    id: "diagnose",
    titel: "Diagnose van autisme",
    doelgroep: ["algemeen"],
    inhoud:
      "De diagnose van autisme wordt gesteld door een gekwalificeerde professional aan de hand van gedragsobservatie en ontwikkelingsgeschiedenis.",
    bestandspad: "diagnose.md",
  },
  {
    id: "ondersteuning",
    titel: "Ondersteuning en begeleiding",
    doelgroep: ["algemeen"],
    inhoud:
      "Ondersteuning en begeleiding voor mensen met autisme kan bestaan uit praktische hulp, coaching of therapie, afgestemd op de individuele behoefte.",
    bestandspad: "ondersteuning.md",
  },
  {
    id: "communicatie",
    titel: "Communicatie en autisme",
    doelgroep: ["algemeen"],
    inhoud:
      "Communicatie kan voor mensen met autisme anders verlopen, bijvoorbeeld door een voorkeur voor letterlijke taal in plaats van impliciete sociale signalen.",
    bestandspad: "communicatie.md",
  },
];

describe("KeywordRetriever met een grotere set korte documenten", () => {
  it("geeft een vraag die alleen uit verbindingswoorden bestaat geen score die relevantie suggereert", () => {
    const retriever = new KeywordRetriever(KORTE_DOCUMENTEN);

    const relevanteResultaten = retriever.search("Wat is autisme?", "algemeen");
    const irrelevanteResultaten = retriever.search(
      "Wat is de hoofdstad van Frankrijk?",
      "algemeen",
    );

    const hoogsteRelevanteScore = relevanteResultaten[0]?.score ?? 0;
    const hoogsteIrrelevanteScore = irrelevanteResultaten[0]?.score ?? 0;

    expect(hoogsteIrrelevanteScore).toBeLessThan(hoogsteRelevanteScore);
  });
});

// Reproduceert een regressie waarbij een lang, opsommend artikel (bijv. een
// literatuurlijst) de zoekterm zo vaak herhaalt dat het puur op woordfrequentie
// hoger scoort dan het korte artikel waar de vraag feitelijk over gaat. Zie ADR-0011.
const TITEL_VERSUS_HERHALING_DOCUMENTEN: Fragment[] = [
  {
    id: "wat-is-autisme",
    titel: "Wat is autisme?",
    doelgroep: ["algemeen"],
    inhoud:
      "Autisme is een ontwikkelingsstoornis die van invloed is op hoe iemand de wereld waarneemt en ermee omgaat.",
    bestandspad: "wat-is-autisme.md",
  },
  {
    id: "literatuur-en-bronnen",
    titel: "Literatuur en bronnen over autisme",
    doelgroep: ["algemeen"],
    inhoud: Array(20)
      .fill(
        "Dit boek gaat over autisme en wordt veel gebruikt door professionals die met autisme werken.",
      )
      .join(" "),
    bestandspad: "literatuur.md",
  },
];

describe("KeywordRetriever met een titel die de vraag bijna letterlijk beantwoordt", () => {
  it("laat het artikel met de exact overeenkomende titel winnen van een lang artikel dat de zoekterm vaker herhaalt", () => {
    const retriever = new KeywordRetriever(TITEL_VERSUS_HERHALING_DOCUMENTEN);

    const resultaten = retriever.search("Wat is autisme?", "algemeen");

    expect(resultaten[0]?.id).toBe("wat-is-autisme");
  });
});
