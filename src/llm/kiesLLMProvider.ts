import { ClaudeProvider } from "./ClaudeProvider";
import { OpenAICompatibleProvider } from "./OpenAICompatibleProvider";
import type { LLMProvider } from "./LLMProvider";

export function kiesLLMProvider(
  env: Record<string, string | undefined> = process.env,
): LLMProvider {
  const providerNaam = env.LLM_PROVIDER ?? "claude";

  switch (providerNaam) {
    case "claude":
      console.log('LLM-provider actief: "claude"');
      return new ClaudeProvider();

    case "lokaal": {
      const baseURL = env.LOKAAL_LLM_BASE_URL;
      const model = env.LOKAAL_LLM_MODEL;

      if (!baseURL) {
        throw new Error(
          "LOKAAL_LLM_BASE_URL ontbreekt terwijl LLM_PROVIDER=lokaal is ingesteld.",
        );
      }
      if (!model) {
        throw new Error("LOKAAL_LLM_MODEL ontbreekt terwijl LLM_PROVIDER=lokaal is ingesteld.");
      }

      console.log(`LLM-provider actief: "lokaal" (model=${model}, baseURL=${baseURL})`);
      return new OpenAICompatibleProvider({ baseURL, model });
    }

    default:
      throw new Error(
        `Onbekende LLM_PROVIDER: "${providerNaam}". Geldige waarden zijn "claude" of "lokaal".`,
      );
  }
}
