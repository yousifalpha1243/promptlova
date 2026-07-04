/*
  search.js
  Powers the search box in the header (redirects to pages/search.html?q=...)
  and the search results page itself.
*/
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("search-form");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const q = document.getElementById("search-input").value.trim();
      if (!q) return;
      window.location.href = BASE + "pages/search.html?q=" + encodeURIComponent(q);
    });
  }

  // Only runs the actual results-rendering logic on search.html
  const resultsEl = document.getElementById("search-results");
  if (!resultsEl) return;

  const params = new URLSearchParams(window.location.search);
  const query = (params.get("q") || "").toLowerCase();
  document.getElementById("search-query-label").textContent = query;

  loadNews().then((data) => {
    const matches = data.articles.filter(
      (a) =>
        a.title.toLowerCase().includes(query) ||
        a.excerpt.toLowerCase().includes(query)
    );

    if (matches.length === 0) {
      resultsEl.innerHTML = `<p class="empty-state">"${query}" ke liye koi article nahi mila.</p>`;
      return;
    }

    resultsEl.innerHTML = matches.map(cardHtml).join("");
  });
});
