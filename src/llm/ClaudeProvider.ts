import Anthropic from "@anthropic-ai/sdk";
import type { Doelgroep } from "../kennisbank/types";
import type { GevondenFragment } from "../retriever/Retriever";
import type { Antwoord, LLMProvider } from "./LLMProvider";
import { bouwGebruikersprompt, bouwSystemPrompt } from "./prompts";

const MODEL = "claude-opus-4-8";
const MAX_TOKENS = 1024;

export class ClaudeProvider implements LLMProvider {
  private readonly client: Anthropic;

  constructor(client: Anthropic = new Anthropic()) {
    this.client = client;
  }

  async answer(
    vraag: string,
    fragmenten: GevondenFragment[],
    doelgroep: Doelgroep,
  ): Promise<Antwoord> {
    const response = await this.client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      thinking: { type: "adaptive" },
      system: bouwSystemPrompt(doelgroep),
      messages: [{ role: "user", content: bouwGebruikersprompt(vraag, fragmenten) }],
    });

    const tekstBlok = response.content.find(
      (blok): blok is Extract<typeof blok, { type: "text" }> => blok.type === "text",
    );

    return { tekst: tekstBlok?.text ?? "", bronnen: fragmenten };
  }
}
