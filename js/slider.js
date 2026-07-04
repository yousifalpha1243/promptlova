/*
  slider.js
  Renders the homepage: hero (featured article), latest news grid,
  and the trending sidebar list.
*/
document.addEventListener("DOMContentLoaded", () => {
  const heroEl = document.getElementById("hero-section");
  if (!heroEl) return; // not on homepage

  loadNews().then((data) => {
    const articles = [...data.articles].sort(
      (a, b) => new Date(b.publishedAt) - new Date(a.publishedAt)
    );

    const featured = articles.find((a) => a.featured) || articles[0];
    heroEl.innerHTML = `
      <div class="hero-image">
        <img src="${imageUrl(featured)}" alt="${featured.title}" />
      </div>
      <div class="hero-content">
        <span class="badge">${featured.category}</span>
        <h1><a href="${articleUrl(featured)}">${featured.title}</a></h1>
        <p>${featured.excerpt}</p>
        <p class="meta">${formatDate(featured.publishedAt)} &middot; ${featured.author}</p>
      </div>
    `;

    const latest = articles.filter((a) => a.slug !== featured.slug).slice(0, 6);
    document.getElementById("latest-grid").innerHTML = latest.map(cardHtml).join("");

    const trending = [...articles].sort((a, b) => b.views - a.views).slice(0, 5);
    document.getElementById("trending-list").innerHTML = trending
      .map(trendingItemHtml)
      .join("");
  });
});
