import type { Doelgroep } from "../types";

interface Optie {
  waarde: Doelgroep;
  label: string;
}

const OPTIES: Optie[] = [
  { waarde: "zelf", label: "Ikzelf (ik heb autisme)" },
  { waarde: "ouder-naaste", label: "Ouder / naaste" },
  { waarde: "professional", label: "Professional" },
  { waarde: "algemeen", label: "Weet ik niet / algemeen" },
];

interface ZijbalkProps {
  doelgroep: Doelgroep | null;
  onKiezen: (doelgroep: Doelgroep) => void;
}

export function Zijbalk({ doelgroep, onKiezen }: ZijbalkProps) {
  return (
    <aside className="w-64 shrink-0 border-r border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900">
      <h1 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">Autibot</h1>
      <p className="mb-2 text-sm text-gray-600 dark:text-gray-400">Voor wie zoek je deze informatie?</p>
      <div className="flex flex-col gap-2">
        {OPTIES.map((optie) => (
          <button
            key={optie.waarde}
            type="button"
            onClick={() => onKiezen(optie.waarde)}
            className={`rounded-lg px-3 py-2 text-left text-sm transition-colors ${
              doelgroep === optie.waarde
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
            }`}
          >
            {optie.label}
          </button>
        ))}
      </div>
    </aside>
  );
}
