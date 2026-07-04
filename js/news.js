/*
  news.js
  Shared helper functions used across all pages.
  Loads data/news.json (works with VS Code Live Server, no backend needed).
*/

// Figures out how deep the current page is, so data/news.json and images
// can be found whether we're at the root, in /pages/, or /pages/tools/.
function getBasePath() {
  const path = window.location.pathname;
  if (path.includes("/pages/tools/")) return "../../";
  if (path.includes("/pages/")) return "../";
  return "./";
}

const BASE = getBasePath();

async function loadNews() {
  const res = await fetch(BASE + "data/news.json");
  if (!res.ok) throw new Error("Could not load news.json");
  return res.json();
}

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function articleUrl(article) {
  return BASE + "pages/article.html?slug=" + encodeURIComponent(article.slug);
}

function categoryUrl(slug) {
  return BASE + "pages/category.html?slug=" + encodeURIComponent(slug);
}

function imageUrl(article) {
  // article.image looks like "/images/tech-chip.png" -> strip leading slash
  return BASE + article.image.replace(/^\//, "");
}

function cardHtml(article) {
  return `
    <a class="card" href="${articleUrl(article)}">
      <div class="card-image">
        <span class="badge">${article.category}</span>
        <img src="${imageUrl(article)}" alt="${article.title}" />
      </div>
      <h3>${article.title}</h3>
      <p>${article.excerpt}</p>
    </a>
  `;
}

function trendingItemHtml(article, index) {
  return `
    <li class="trending-item">
      <span class="trending-rank">${String(index + 1).padStart(2, "0")}</span>
      <div>
        <span class="category-pill">${article.category}</span>
        <h4><a href="${articleUrl(article)}">${article.title}</a></h4>
      </div>
    </li>
  `;
}

// Renders the top navbar links + footer categories on every page
async function renderNavAndFooter() {
  const data = await loadNews();
  const navEl = document.getElementById("main-nav");
  if (navEl) {
    navEl.innerHTML = data.categories
      .map((c) => `<a href="${categoryUrl(c.slug)}">${c.name}</a>`)
      .join("");
  }
  const footerCatEl = document.getElementById("footer-categories");
  if (footerCatEl) {
    footerCatEl.innerHTML = data.categories
      .slice(0, 6)
      .map((c) => `<li><a href="${categoryUrl(c.slug)}">${c.name}</a></li>`)
      .join("");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  renderNavAndFooter().catch((err) => console.error(err));
});
