/*
  namegen.js
  Fully client-side name generator (no backend needed).
*/
const SYLLABLES_1 = ["Nova", "Lyra", "Zen", "Kai", "Orin", "Vex", "Aeli", "Ryn", "Thal", "Mira"];
const SYLLABLES_2 = ["dra", "wave", "sha", "lin", "ven", "tor", "que", "mora", "lith", "sen"];
const SUFFIXES = ["Labs", "Studio", "Co", "Hub", "Works", "AI", "Media", "Collective"];

function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateNames(keyword, count) {
  const names = [];
  for (let i = 0; i < count; i++) {
    const base = keyword
      ? keyword.charAt(0).toUpperCase() + keyword.slice(1).toLowerCase()
      : randomFrom(SYLLABLES_1);
    const style = Math.random();
    let name;
    if (style < 0.34) {
      name = base + randomFrom(SYLLABLES_2);
    } else if (style < 0.67) {
      name = randomFrom(SYLLABLES_1) + (keyword || randomFrom(SYLLABLES_2));
    } else {
      name = base + " " + randomFrom(SUFFIXES);
    }
    names.push(name);
  }
  return [...new Set(names)];
}

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("namegen-form");
  const resultEl = document.getElementById("namegen-result");
  const listEl = document.getElementById("namegen-list");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const keyword = document.getElementById("namegen-keyword").value.trim();
    const names = generateNames(keyword, 8);
    listEl.innerHTML = names.map((n) => `<li>${n}</li>`).join("");
    resultEl.classList.add("show");
  });
});
