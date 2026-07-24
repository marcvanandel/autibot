import { describe, expect, it, vi } from "vitest";
import { OpenAICompatibleProvider } from "../src/llm/OpenAICompatibleProvider";
import type { GevondenFragment } from "../src/retriever/Retriever";

describe("OpenAICompatibleProvider", () => {
  it("geeft de tekst van de eerste keuze terug, samen met de meegegeven bronnen", async () => {
    const fragmenten: GevondenFragment[] = [
      { id: "a", titel: "Titel A", inhoud: "Inhoud A", bestandspad: "a.md", score: 1 },
    ];
    const nepClient = {
      chat: {
        completions: {
          create: vi.fn().mockResolvedValue({
            choices: [{ message: { content: "Dit is het antwoord." } }],
          }),
        },
      },
    };

    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    const provider = new OpenAICompatibleProvider(
      { baseURL: "http://localhost:8000/v1", model: "test-model" },
      nepClient as any,
    );
    const antwoord = await provider.answer("Een vraag", fragmenten, "algemeen");

    expect(antwoord.tekst).toBe("Dit is het antwoord.");
    expect(antwoord.bronnen).toEqual(fragmenten);
    expect(nepClient.chat.completions.create).toHaveBeenCalledWith(
      expect.objectContaining({ model: "test-model" }),
    );
    const aanroep = nepClient.chat.completions.create.mock.calls[0][0];
    expect(aanroep.temperature).toBeUndefined();
    expect(aanroep.messages).toEqual([
      { role: "system", content: expect.any(String) },
      { role: "user", content: expect.any(String) },
    ]);
    expect(logSpy).toHaveBeenCalledWith(
      "[OpenAICompatibleProvider] Antwoord ontvangen van het lokale model.",
    );

    logSpy.mockRestore();
  });

  it("gooit een fout als het lokale model geen tekstantwoord geeft", async () => {
    const fragmenten: GevondenFragment[] = [
      { id: "a", titel: "Titel A", inhoud: "Inhoud A", bestandspad: "a.md", score: 1 },
    ];
    const nepClient = {
      chat: {
        completions: {
          create: vi.fn().mockResolvedValue({
            choices: [{ message: { content: null } }],
          }),
        },
      },
    };

    const provider = new OpenAICompatibleProvider(
      { baseURL: "http://localhost:8000/v1", model: "test-model" },
      nepClient as any,
    );

    await expect(provider.answer("Een vraag", fragmenten, "algemeen")).rejects.toThrow(
      "Het lokale model gaf geen tekstantwoord terug",
    );
  });
});
