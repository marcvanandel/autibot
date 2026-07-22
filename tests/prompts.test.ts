import { describe, expect, it } from "vitest";
import { bouwGebruikersprompt, bouwSystemPrompt } from "../src/llm/prompts";
import type { GevondenFragment } from "../src/retriever/Retriever";

describe("bouwSystemPrompt", () => {
  it("bevat de grounding-instructie en een doelgroep-specifieke toonaanwijzing", () => {
    const prompt = bouwSystemPrompt("professional");

    expect(prompt).toContain("uitsluitend op basis van de context");
    expect(prompt).toContain("vaktaal");
  });
});

describe("bouwGebruikersprompt", () => {
  it("neemt de titel en inhoud van elk fragment op als genummerde bron", () => {
    const fragmenten: GevondenFragment[] = [
      { id: "a", titel: "Titel A", inhoud: "Inhoud A", bestandspad: "a.md", score: 1 },
      { id: "b", titel: "Titel B", inhoud: "Inhoud B", bestandspad: "b.md", score: 0.5 },
    ];

    const prompt = bouwGebruikersprompt("Wat is X?", fragmenten);

    expect(prompt).toContain("[Bron 1: Titel A]");
    expect(prompt).toContain("Inhoud A");
    expect(prompt).toContain("[Bron 2: Titel B]");
    expect(prompt).toContain("Vraag: Wat is X?");
  });
});
