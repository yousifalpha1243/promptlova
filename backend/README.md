# PromptLova Video Downloader — Backend

Ye backend aapke website ke "Video Downloader" tool ko chalane ke liye hai
(`pages/tools/video-downloader.html` + `js/downloader.js`).

Browser directly Twitter/Instagram/Facebook se video fetch nahi kar sakta
(CORS restriction). Isliye ye chhota server beech me kaam karta hai:
browser → is server → yt-dlp → video link.

## Requirements

1. **Node.js** (v18 ya usse upar) — https://nodejs.org
2. **yt-dlp** — command-line tool jo actual video URL nikaalta hai.
   - Windows: https://github.com/yt-dlp/yt-dlp/wiki/Installation se `yt-dlp.exe`
     download karke PATH me daal dein, YA:
     ```
     winget install yt-dlp
     ```
   - macOS:
     ```
     brew install yt-dlp
     ```
   - Linux:
     ```
     sudo apt install yt-dlp
     ```
     (ya `pip install -U yt-dlp`)

   Install ke baad check karein:
   ```
   yt-dlp --version
   ```

## Setup

```bash
cd backend
npm install
npm start
```

Server `http://localhost:5000` par chalega.

## Frontend ko connect karna

`js/downloader.js` file me ye line dhoondhein:

```js
const API_BASE_URL = "";
```

Isko badal dein:

```js
const API_BASE_URL = "http://localhost:5000";
```

Save karein, website reload karein — ab "Video Downloader" tool kaam karega
(jab tak dono, backend server aur website, chal rahe hain).

## Deploy karna (sirf local testing ke liye nahi, live site ke liye)

Agar aap ye live website par chalana chahte hain to:
1. Is backend ko kisi Node.js hosting par deploy karein (Render, Railway,
   VPS, etc.) — jahan aap `yt-dlp` bhi install kar sakein.
2. `API_BASE_URL` ko us hosted server ke URL se replace karein
   (jaise `https://aapka-backend.onrender.com`).
3. **Static hosting (GitHub Pages, Netlify static, etc.) par ye backend
   khud nahi chal sakta** — usko sirf ek alag Node.js server/host chahiye.

## Important — Legal/ToS note

- Ye sirf **public** posts ke liye kaam karega.
- Sirf apna content, ya jis content ko download karne ka aapko
  permission/right hai, wahi download karein.
- Twitter/X, Instagram, Facebook — teeno ke apne Terms of Service hain
  jo scraping/downloading restrict karte hain. Ye tool use karne ki
  zimmedari (copyright/ToS compliance) aapki hai.
- Is code me ek chhota allow-list hai (`ALLOWED_HOSTS` in `server.js`)
  taake ye endpoint arbitrary site scraper na ban jaye.
