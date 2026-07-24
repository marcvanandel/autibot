import OpenAI from "openai";
import type { Doelgroep } from "../kennisbank/types";
import type { GevondenFragment } from "../retriever/Retriever";
import type { Antwoord, LLMProvider } from "./LLMProvider";
import { bouwGebruikersprompt, bouwSystemPrompt } from "./prompts";

export interface OpenAICompatibleProviderOpties {
  baseURL: string;
  model: string;
}

export class OpenAICompatibleProvider implements LLMProvider {
  private readonly client: OpenAI;
  private readonly model: string;

  constructor(opties: OpenAICompatibleProviderOpties, client?: OpenAI) {
    this.model = opties.model;
    // Lokale OpenAI-compatibele servers (zoals lemonade-server) controleren doorgaans
    // geen API-key; de openai-package vereist desondanks een niet-lege waarde.
    this.client = client ?? new OpenAI({ baseURL: opties.baseURL, apiKey: "niet-gebruikt-lokaal" });
  }

  async answer(
    vraag: string,
    fragmenten: GevondenFragment[],
    doelgroep: Doelgroep,
  ): Promise<Antwoord> {
    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        { role: "system", content: bouwSystemPrompt(doelgroep) },
        { role: "user", content: bouwGebruikersprompt(vraag, fragmenten) },
      ],
    });

    const tekst = response.choices[0]?.message?.content;

    if (!tekst) {
      throw new Error(
        "Het lokale model gaf geen tekstantwoord terug (mogelijk een leeg antwoord).",
      );
    }

    return { tekst, bronnen: fragmenten };
  }
}
