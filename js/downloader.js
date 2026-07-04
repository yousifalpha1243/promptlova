/*
  downloader.js
  Video downloader UI.

  IMPORTANT (samjhein): ye tool kisi doosri website (Twitter/Instagram/Facebook)
  ka video link fetch karta hai, jo browser se seedha (bina server ke) CORS
  restriction ki wajah se possible nahi hai. Isliye ye static/local version
  ek chalta hua backend API chahता hai.

  Agar aap apna backend (artifacts/api-server) bhi chala rahe hain, to neeche
  API_BASE_URL me uska address daal dein, jaise:
    const API_BASE_URL = "http://localhost:5000";
  Agar khaali chhod denge, to ye sirf UI dikhayega aur ek helpful message dega.
*/
const API_BASE_URL = "http://localhost:5000";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("downloader-form");
  const resultEl = document.getElementById("downloader-result");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const url = document.getElementById("downloader-url").value.trim();
    if (!url) return;

    resultEl.classList.add("show");

    if (!API_BASE_URL) {
      resultEl.innerHTML = `
        <p><strong>Backend connected nahi hai.</strong></p>
        <p class="tool-note">
          Ye tool kaam karne ke liye ek chalta hua backend server chahiye
          (kyunki social media links browser se seedha fetch nahi ho sakte).
          <br />Agar aapke paas <code>artifacts/api-server</code> chal raha hai,
          to <code>js/downloader.js</code> file me <code>API_BASE_URL</code>
          set kar dein (jaise <code>http://localhost:5000</code>).
        </p>
      `;
      return;
    }

    resultEl.innerHTML = "<p>Fetching...</p>";
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/downloader?url=${encodeURIComponent(url)}`
      );
      const data = await res.json();
      if (data.videoUrl) {
        // data.videoUrl is a relative path like "/api/download?url=...".
        // It points back at OUR server (not the raw social media CDN link),
        // so the actual video file gets downloaded through the backend -
        // this avoids 403 errors from platforms that block direct CDN access.
        const fullDownloadUrl = `${API_BASE_URL}${data.videoUrl}`;
        resultEl.innerHTML = `
          <p><strong>Video mil gaya!</strong></p>
          <a class="btn" href="${fullDownloadUrl}">Download Video</a>
          <p class="tool-note">Click karne ke baad video file thoda time le sakti hai
          (server pehle video download karta hai, fir aapko bhejta hai).</p>
        `;
      } else {
        resultEl.innerHTML = `<p>${data.error || "Video nahi mila. Ye link public nahi hai ya support nahi karta."}</p>`;
      }
    } catch (err) {
      resultEl.innerHTML = `<p>Error: backend se connect nahi ho paya.</p>`;
    }
  });
});
