import { describe, expect, it } from "vitest";
import { kiesLLMProvider } from "../src/llm/kiesLLMProvider";
import { ClaudeProvider } from "../src/llm/ClaudeProvider";
import { OpenAICompatibleProvider } from "../src/llm/OpenAICompatibleProvider";

describe("kiesLLMProvider", () => {
  it("geeft een ClaudeProvider terug als LLM_PROVIDER 'claude' is", () => {
    const provider = kiesLLMProvider({ LLM_PROVIDER: "claude" });
    expect(provider).toBeInstanceOf(ClaudeProvider);
  });

  it("geeft een ClaudeProvider terug als LLM_PROVIDER ontbreekt (default)", () => {
    const provider = kiesLLMProvider({});
    expect(provider).toBeInstanceOf(ClaudeProvider);
  });

  it("geeft een OpenAICompatibleProvider terug als LLM_PROVIDER 'lokaal' is, met geldige config", () => {
    const provider = kiesLLMProvider({
      LLM_PROVIDER: "lokaal",
      LOKAAL_LLM_BASE_URL: "http://localhost:8000/v1",
      LOKAAL_LLM_MODEL: "qwen2.5-7b-instruct",
    });
    expect(provider).toBeInstanceOf(OpenAICompatibleProvider);
  });

  it("gooit een fout als LOKAAL_LLM_BASE_URL ontbreekt terwijl LLM_PROVIDER 'lokaal' is", () => {
    expect(() =>
      kiesLLMProvider({ LLM_PROVIDER: "lokaal", LOKAAL_LLM_MODEL: "qwen2.5-7b-instruct" }),
    ).toThrow("LOKAAL_LLM_BASE_URL");
  });

  it("gooit een fout als LOKAAL_LLM_MODEL ontbreekt terwijl LLM_PROVIDER 'lokaal' is", () => {
    expect(() =>
      kiesLLMProvider({ LLM_PROVIDER: "lokaal", LOKAAL_LLM_BASE_URL: "http://localhost:8000/v1" }),
    ).toThrow("LOKAAL_LLM_MODEL");
  });

  it("gooit een fout bij een onbekende LLM_PROVIDER-waarde", () => {
    expect(() => kiesLLMProvider({ LLM_PROVIDER: "onzin" })).toThrow(/Onbekende LLM_PROVIDER/);
    expect(() => kiesLLMProvider({ LLM_PROVIDER: "onzin" })).toThrow(/onzin/);
  });
});
