import type { Doelgroep, Fragment } from "./types";

export function magFragmentZien(fragment: Fragment, gekozenDoelgroep: Doelgroep): boolean {
  if (gekozenDoelgroep === "algemeen") return true;
  return fragment.doelgroep.includes(gekozenDoelgroep) || fragment.doelgroep.includes("algemeen");
}
