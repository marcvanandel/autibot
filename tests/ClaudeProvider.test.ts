import { describe, expect, it, vi } from "vitest";
import { ClaudeProvider } from "../src/llm/ClaudeProvider";
import type { GevondenFragment } from "../src/retriever/Retriever";

describe("ClaudeProvider", () => {
  it("geeft de tekst van het eerste text-blok terug, samen met de meegegeven bronnen", async () => {
    const fragmenten: GevondenFragment[] = [
      { id: "a", titel: "Titel A", inhoud: "Inhoud A", bestandspad: "a.md", score: 1 },
    ];
    const nepClient = {
      messages: {
        create: vi.fn().mockResolvedValue({
          content: [
            { type: "thinking", thinking: "..." },
            { type: "text", text: "Dit is het antwoord." },
          ],
        }),
      },
    };

    const provider = new ClaudeProvider(nepClient as any);
    const antwoord = await provider.answer("Een vraag", fragmenten, "algemeen");

    expect(antwoord.tekst).toBe("Dit is het antwoord.");
    expect(antwoord.bronnen).toEqual(fragmenten);
    expect(nepClient.messages.create).toHaveBeenCalledWith(
      expect.objectContaining({ model: "claude-opus-4-8" }),
    );
    const aanroep = nepClient.messages.create.mock.calls[0][0];
    expect(aanroep.temperature).toBeUndefined();
  });

  it("gooit een fout als Claude geen tekstantwoord geeft (bijv. weigering of leeg antwoord)", async () => {
    const fragmenten: GevondenFragment[] = [
      { id: "a", titel: "Titel A", inhoud: "Inhoud A", bestandspad: "a.md", score: 1 },
    ];
    const nepClient = {
      messages: {
        create: vi.fn().mockResolvedValue({
          content: [{ type: "thinking", thinking: "..." }],
        }),
      },
    };

    const provider = new ClaudeProvider(nepClient as any);

    await expect(provider.answer("Een vraag", fragmenten, "algemeen")).rejects.toThrow(
      "Claude gaf geen tekstantwoord terug (mogelijk een weigering of leeg antwoord).",
    );
  });
});
