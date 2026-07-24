import type { GesprekItem } from "../types";
import { LaadIndicator } from "./LaadIndicator";

interface BerichtProps {
  item: GesprekItem;
}

export function Bericht({ item }: BerichtProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="ml-auto max-w-lg rounded-lg bg-blue-600 px-4 py-2 text-sm text-white">
        {item.vraag}
      </div>
      {item.bezig && <LaadIndicator />}
      {!item.bezig && item.fout && (
        <div className="max-w-lg rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          Fout: {item.fout}
        </div>
      )}
      {!item.bezig && item.antwoord && (
        <div className="max-w-lg rounded-lg bg-gray-100 px-4 py-2 text-sm text-gray-800 dark:bg-gray-800 dark:text-gray-100">
          <p className="whitespace-pre-wrap break-words">{item.antwoord.tekst}</p>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            {item.antwoord.bronnen.length > 0
              ? `Bronnen: ${item.antwoord.bronnen.map((bron) => bron.titel).join(", ")}`
              : "Geen bronnen (buiten de kennisbank)"}
          </p>
        </div>
      )}
    </div>
  );
}
