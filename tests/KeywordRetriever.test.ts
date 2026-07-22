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
