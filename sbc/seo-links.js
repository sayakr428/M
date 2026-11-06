// Adds links to the buyer guides at the end of every main-site page (after React has
// rendered the footer), so visitors and search engines can reach them.
(function () {
  function add() {
    if (document.getElementById("sbc-guides")) return;
    var footer = document.querySelector("footer");
    if (!footer) return;
    var nav = document.createElement("nav");
    nav.id = "sbc-guides";
    nav.setAttribute("aria-label", "Buyer guides");
    nav.style.cssText = "max-width:1120px;margin:0 auto;padding:16px;font-size:.85rem;display:flex;flex-wrap:wrap;gap:8px 18px;justify-content:center";
    [["/plots-in-baruipur/", "Plots for sale in Baruipur"], ["/bn/plots-in-baruipur/", "বারুইপুরে প্লট বিক্রি"],
     ["/plots-near-kolkata/", "Best plots to buy near Kolkata"], ["/shantiban-city-fact-sheet/", "Shantiban City fact sheet"]]
      .forEach(function (l) { var a = document.createElement("a"); a.href = l[0]; a.textContent = l[1]; a.style.color = "inherit"; nav.appendChild(a); });
    footer.appendChild(nav);
  }
  if (document.readyState === "complete") setTimeout(add, 500);
  else window.addEventListener("load", function () { setTimeout(add, 500); });
})();
