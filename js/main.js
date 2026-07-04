/*
  main.js
  Small shared page-init helpers (used by category.html and article.html).
  Keeping this separate from news.js/slider.js so each page only needs
  the scripts relevant to it — same layout you'd see in a plain HTML/CSS/JS site.
*/

function getQueryParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

// --- category.html ---
document.addEventListener("DOMContentLoaded", () => {
  const catTitleEl = document.getElementById("category-title");
  const catGridEl = document.getElementById("category-grid");
  if (!catTitleEl || !catGridEl) return;

  const slug = getQueryParam("slug");

  loadNews().then((data) => {
    const category = data.categories.find((c) => c.slug === slug);
    catTitleEl.textContent = category ? category.name : "Category";

    const matches = data.articles.filter((a) => a.category === slug);
    catGridEl.innerHTML = matches.length
      ? matches.map(cardHtml).join("")
      : `<p class="empty-state">Is category me abhi koi article nahi hai.</p>`;
  });
});

// --- article.html ---
document.addEventListener("DOMContentLoaded", () => {
  const bodyEl = document.getElementById("article-body");
  if (!bodyEl) return;

  const slug = getQueryParam("slug");

  loadNews().then((data) => {
    const article = data.articles.find((a) => a.slug === slug);
    if (!article) {
      document.getElementById("article-container").innerHTML =
        '<p class="empty-state">Article nahi mila.</p>';
      return;
    }

    document.title = article.title + " - PromptLova";
    document.getElementById("article-category").textContent = article.category;
    document.getElementById("article-title").textContent = article.title;
    document.getElementById("article-excerpt").textContent = article.excerpt;
    document.getElementById("article-author").textContent = article.author;
    document.getElementById("article-date").textContent = formatDate(article.publishedAt);
    document.getElementById("article-image").src = imageUrl(article);
    document.getElementById("article-image").alt = article.title;

    bodyEl.innerHTML = article.content
      .split("\n\n")
      .map((para) => `<p>${para}</p>`)
      .join("");
  });
});
