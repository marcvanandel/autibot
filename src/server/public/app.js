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
    const bronnenTekst = data.bronnen.length
      ? `Bronnen: ${data.bronnen.map((b) => b.titel).join(", ")}`
      : "Geen bronnen (buiten de kennisbank)";
    blok.innerHTML = `<p><strong>Vraag:</strong> ${vraag}</p><p>${data.tekst}</p><p class="bronnen">${bronnenTekst}</p>`;
  }
  container.prepend(blok);
});
