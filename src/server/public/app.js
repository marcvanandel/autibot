let gekozenDoelgroep = null;

document.querySelectorAll("#doelgroepkeuze button").forEach((knop) => {
  knop.addEventListener("click", () => {
    gekozenDoelgroep = knop.dataset.doelgroep;
    document.getElementById("doelgroepkeuze").style.display = "none";
    document.getElementById("chat").style.display = "block";
  });
});

document.getElementById("vraagFormulier").addEventListener("submit", async (event) => {
  event.preventDefault();
  const invoer = document.getElementById("vraagInvoer");
  const vraag = invoer.value.trim();
  if (!vraag) return;
  invoer.value = "";

  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ vraag, doelgroep: gekozenDoelgroep }),
  });
  const data = await response.json();

  const container = document.getElementById("antwoorden");
  const blok = document.createElement("div");
  blok.className = "antwoord";

  if (data.fout) {
    blok.textContent = `Fout: ${data.fout}`;
  } else {
    const vraagParagraaf = document.createElement("p");
    const vraagLabel = document.createElement("strong");
    vraagLabel.textContent = "Vraag:";
    vraagParagraaf.append(vraagLabel, ` ${vraag}`);

    const antwoordParagraaf = document.createElement("p");
    antwoordParagraaf.textContent = data.tekst;

    const bronnenParagraaf = document.createElement("p");
    bronnenParagraaf.className = "bronnen";
    bronnenParagraaf.textContent = data.bronnen.length
      ? `Bronnen: ${data.bronnen.map((b) => b.titel).join(", ")}`
      : "Geen bronnen (buiten de kennisbank)";

    blok.append(vraagParagraaf, antwoordParagraaf, bronnenParagraaf);
  }
  container.prepend(blok);
});
