import { join } from "node:path";
import { laadKennisbank } from "./kennisbank/loadKennisbank";
import { KeywordRetriever } from "./retriever/KeywordRetriever";
import { kiesLLMProvider } from "./llm/kiesLLMProvider";
import { Orchestrator } from "./orchestrator/Orchestrator";
import { maakServer } from "./server/server";

const KENNISBANK_MAP = process.env.KENNISBANK_MAP ?? join(__dirname, "..", "kennisbank");
const PUBLIC_MAP = join(__dirname, "server", "public");
const POORT = Number(process.env.POORT ?? 3000);
const BASISFRAGMENT_ID = "wat-is-autisme";

function start(): void {
  const fragmenten = laadKennisbank(KENNISBANK_MAP);
  const retriever = new KeywordRetriever(fragmenten);
  const llmProvider = kiesLLMProvider();
  const basisFragment = fragmenten.find((f) => f.id === BASISFRAGMENT_ID);
  if (!basisFragment) {
    console.warn(
      `[Autibot] Basisfragment '${BASISFRAGMENT_ID}' niet gevonden in de kennisbank; ` +
        "dit fragment wordt dan niet automatisch als context meegegeven.",
    );
  }
  const orchestrator = new Orchestrator(retriever, llmProvider, basisFragment);

  const server = maakServer(orchestrator, PUBLIC_MAP);
  server.listen(POORT, () => {
    console.log(`Autibot draait op http://localhost:${POORT}`);
  });
}

start();
