import { join } from "node:path";
import { laadKennisbank } from "./kennisbank/loadKennisbank";
import { KeywordRetriever } from "./retriever/KeywordRetriever";
import { ClaudeProvider } from "./llm/ClaudeProvider";
import { Orchestrator } from "./orchestrator/Orchestrator";
import { maakServer } from "./server/server";

const KENNISBANK_MAP = process.env.KENNISBANK_MAP ?? join(__dirname, "..", "kennisbank");
const PUBLIC_MAP = join(__dirname, "server", "public");
const POORT = Number(process.env.POORT ?? 3000);

function start(): void {
  const fragmenten = laadKennisbank(KENNISBANK_MAP);
  const retriever = new KeywordRetriever(fragmenten);
  const llmProvider = new ClaudeProvider();
  const orchestrator = new Orchestrator(retriever, llmProvider);

  const server = maakServer(orchestrator, PUBLIC_MAP);
  server.listen(POORT, () => {
    console.log(`Autibot draait op http://localhost:${POORT}`);
  });
}

start();
