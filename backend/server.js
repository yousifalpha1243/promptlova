/*
  server.js
  PromptLova Video Downloader - Backend API

  Ye server do endpoints provide karta hai:

  1. GET /api/downloader?url=...
     Sirf check karta hai ke video mil sakta hai ya nahi (quick validation),
     aur ek "download" link deta hai jo isi server ke /api/download endpoint
     ki taraf point karta hai (Twitter/Instagram/Facebook ke CDN ki taraf
     seedha nahi - is se 403 errors avoid hote hain).

  2. GET /api/download?url=...
     Asal me yt-dlp se video ko server par download karta hai, fir use
     seedha browser ko file ke tor par bhej deta hai (Content-Disposition:
     attachment), aur bhejne ke baad temp file delete kar deta hai.

  IMPORTANT (samjhein):
  - Social media platforms (Twitter/X, Instagram, Facebook) apne video CDN
    par Referer/User-Agent jaise headers check karte hain. Isliye browser
    seedha unka CDN link nahi khol sakta (403 Forbidden aata hai). Ye
    server isliye video ko khud download karke serve karta hai.
  - Sirf PUBLIC posts ke liye kaam karega.
  - Sirf apna content ya jis content ko download karne ka aapko
    haq/permission hai, wahi download karein. Har platform ke apne Terms
    of Service hain jo scraping/downloading restrict karte hain - inko
    follow karna aapki zimmedari hai. Ye tool copyrighted content
    redistribute karne ke liye nahi hai.
*/

const express = require("express");
const cors = require("cors");
const { spawn, spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const os = require("os");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 5000;

// IMPORTANT: downloaded files are stored OUTSIDE the project folder, by
// default in the OS temp directory. If we stored them inside the project
// (e.g. a "backend/downloads" folder), tools like VS Code's "Live Server"
// that watch the whole workspace for changes would detect the new file
// and auto-refresh the browser tab - which resets the page right as the
// download finishes. Using os.tmpdir() avoids that.
//
// If your OS temp drive (usually C:) is low on disk space, set the
// DOWNLOAD_DIR environment variable to point somewhere else with free
// space, e.g. on Windows PowerShell before "npm start":
//   $env:DOWNLOAD_DIR = "D:\promptlova-temp"
//   npm start
const DOWNLOAD_DIR = process.env.DOWNLOAD_DIR
  ? process.env.DOWNLOAD_DIR
  : path.join(os.tmpdir(), "promptlova-downloader");

if (!fs.existsSync(DOWNLOAD_DIR)) fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });

// Prefer a yt-dlp.exe/yt-dlp binary sitting right next to server.js
// (useful on Windows where PATH setup can be a hassle). Falls back to
// running yt-dlp as a Python module (works even if the yt-dlp Scripts
// folder isn't on PATH, as long as `python` is). Falls back to a bare
// "yt-dlp" command as a last resort.
const LOCAL_BINARY_WIN = path.join(__dirname, "yt-dlp.exe");
const LOCAL_BINARY_UNIX = path.join(__dirname, "yt-dlp");

function commandWorks(cmd, args) {
  const result = spawnSync(cmd, args, { stdio: "ignore" });
  return !result.error && result.status === 0;
}

function resolveYtDlpCommand() {
  if (fs.existsSync(LOCAL_BINARY_WIN)) {
    return { cmd: LOCAL_BINARY_WIN, baseArgs: [] };
  }
  if (fs.existsSync(LOCAL_BINARY_UNIX)) {
    return { cmd: LOCAL_BINARY_UNIX, baseArgs: [] };
  }
  if (commandWorks("python", ["-m", "yt_dlp", "--version"])) {
    return { cmd: "python", baseArgs: ["-m", "yt_dlp"] };
  }
  if (commandWorks("python3", ["-m", "yt_dlp", "--version"])) {
    return { cmd: "python3", baseArgs: ["-m", "yt_dlp"] };
  }
  return { cmd: "yt-dlp", baseArgs: [] }; // rely on PATH
}

const YT_DLP = resolveYtDlpCommand();
console.log("Using yt-dlp via:", YT_DLP.cmd, YT_DLP.baseArgs.join(" "));

app.use(cors());
app.use(express.json());

// Simple allow-list so this endpoint isn't turned into an open scraper
// for arbitrary sites. Add/remove domains as needed.
const ALLOWED_HOSTS = [
  "twitter.com",
  "x.com",
  "instagram.com",
  "facebook.com",
  "fb.watch",
];

function isAllowedUrl(rawUrl) {
  try {
    const { hostname } = new URL(rawUrl);
    return ALLOWED_HOSTS.some(
      (host) => hostname === host || hostname.endsWith("." + host)
    );
  } catch {
    return false;
  }
}

function runYtDlp(args) {
  return new Promise((resolve, reject) => {
    const proc = spawn(YT_DLP.cmd, [...YT_DLP.baseArgs, ...args]);

    let stdout = "";
    let stderr = "";

    proc.stdout.on("data", (chunk) => (stdout += chunk.toString()));
    proc.stderr.on("data", (chunk) => (stderr += chunk.toString()));

    proc.on("error", (err) => {
      reject(new Error("yt-dlp_not_found: " + err.message));
    });

    proc.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(stderr.trim() || `yt-dlp exited with code ${code}`));
        return;
      }
      resolve(stdout.trim());
    });
  });
}

// Quick check: does yt-dlp recognize this URL & find a video at all.
function checkVideoExists(pageUrl) {
  return runYtDlp([
    "-g",
    "-f", "best[ext=mp4]/best",
    "--no-playlist",
    pageUrl,
  ]);
}

// Actually downloads the video file to disk and returns its path.
async function downloadVideoToDisk(pageUrl) {
  const id = crypto.randomBytes(8).toString("hex");
  const outputTemplate = path.join(DOWNLOAD_DIR, `${id}.%(ext)s`);

  await runYtDlp([
    "-f", "best[ext=mp4]/best",
    "--no-playlist",
    "-o", outputTemplate,
    pageUrl,
  ]);

  // Find the file that was actually created (extension may vary)
  const files = fs.readdirSync(DOWNLOAD_DIR).filter((f) => f.startsWith(id));
  if (files.length === 0) {
    throw new Error("Download completed but file not found on disk");
  }
  return path.join(DOWNLOAD_DIR, files[0]);
}

app.get("/api/downloader", async (req, res) => {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: "Missing 'url' query parameter" });
  }

  if (!isAllowedUrl(url)) {
    return res.status(400).json({
      error:
        "Ye URL supported nahi hai. Sirf Twitter/X, Instagram, ya Facebook ke public post links allowed hain.",
    });
  }

  try {
    await checkVideoExists(url);
    // Point the frontend at OUR download endpoint (same-origin-ish,
    // proper headers) instead of the raw CDN URL.
    const downloadUrl = `/api/download?url=${encodeURIComponent(url)}`;
    return res.json({ videoUrl: downloadUrl });
  } catch (err) {
    console.error("Downloader check error:", err.message);

    if (err.message.startsWith("yt-dlp_not_found")) {
      return res.status(500).json({
        error:
          "Server par 'yt-dlp' install nahi hai. README.md dekhein install instructions ke liye.",
      });
    }

    return res.status(404).json({
      error:
        "Video nahi mil saka. Ye link private ho sakta hai, expire ho chuka ho, ya is platform ka format support nahi karta.",
    });
  }
});

app.get("/api/download", async (req, res) => {
  const { url } = req.query;

  if (!url || !isAllowedUrl(url)) {
    return res.status(400).json({ error: "Invalid or missing url" });
  }

  let filePath;
  try {
    filePath = await downloadVideoToDisk(url);
  } catch (err) {
    console.error("Download error:", err.message);
    return res.status(500).json({ error: "Video download fail ho gaya." });
  }

  const filename = "video" + path.extname(filePath);

  res.download(filePath, filename, (err) => {
    // Clean up the temp file after sending (or if sending failed)
    fs.unlink(filePath, () => {});
    if (err) console.error("Send error:", err.message);
  });
});

app.get("/health", (req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`Downloader backend chal raha hai: http://localhost:${PORT}`);
});
