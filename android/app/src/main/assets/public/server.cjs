var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// server.ts
var server_exports = {};
__export(server_exports, {
  app: () => app
});
module.exports = __toCommonJS(server_exports);
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_crypto_js = __toESM(require("crypto-js"), 1);
var import_genai = require("@google/genai");
var aiSearchCache = /* @__PURE__ */ new Map();
function getDeterministicSearchIntent(query) {
  const trimmed = query.trim().replace(/\s+/g, " ");
  const lower = trimmed.toLowerCase();
  let norm = trimmed.replace(/\barjit singh\b/gi, "Arijit Singh").replace(/\barjit\b/gi, "Arijit Singh").replace(/\bmre ram\b/gi, "Mere Ram").replace(/\bsanam teri kasm\b/gi, "Sanam Teri Kasam").replace(/\bhouseful 4\b/gi, "Housefull 4").replace(/\ba r rahman\b/gi, "A.R. Rahman").replace(/\bar rahman\b/gi, "A.R. Rahman").replace(/\bkumar sanm\b/gi, "Kumar Sanu").replace(/\bshreya ghosal\b/gi, "Shreya Ghoshal").replace(/\bfrndship\b/gi, "friendship").replace(/\bromntic\b/gi, "romantic");
  const entities = {};
  let detectedIntent = "general";
  let contextLabel = `Search \u2022 ${norm}`;
  const searchQueriesSet = /* @__PURE__ */ new Set([norm]);
  const knownArtists = [
    "Arijit Singh",
    "A.R. Rahman",
    "Kumar Sanu",
    "Lata Mangeshkar",
    "Atif Aslam",
    "Shreya Ghoshal",
    "Sonu Nigam",
    "Badshah",
    "Kishore Kumar",
    "Neha Kakkar",
    "Jubin Nautiyal",
    "Diljit Dosanjh",
    "Darshan Raval",
    "Pritam",
    "Ankit Tiwari",
    "Himesh Reshammiya",
    "Shankar Mahadevan",
    "Alka Yagnik",
    "Udit Narayan",
    "K.K.",
    "Sid Sriram",
    "Yo Yo Honey Singh",
    "Sunidhi Chauhan",
    "Mohit Chauhan",
    "Jagjit Singh",
    "Asha Bhosle",
    "Mohammad Rafi",
    "R.D. Burman",
    "Gulzar",
    "Vishal-Shekhar",
    "Sachin-Jigar"
  ];
  for (const artist of knownArtists) {
    if (lower.includes(artist.toLowerCase())) {
      entities.artist = artist;
      detectedIntent = "artist";
      contextLabel = `Artist \u2022 ${artist}`;
      searchQueriesSet.add(artist);
      searchQueriesSet.add(`${artist} songs`);
      searchQueriesSet.add(`${artist} hits`);
      break;
    }
  }
  const knownMovies = [
    "Housefull 4",
    "Sanam Teri Kasam",
    "Kabir Singh",
    "Aashiqui 2",
    "Animal",
    "Jawan",
    "Pathaan",
    "Brahmastra",
    "Rockstar",
    "Dilwale",
    "Shershaah",
    "Sita Ramam",
    "Pushpa",
    "KGF",
    "RRR",
    "Yeh Jawaani Hai Deewani",
    "Kal Ho Naa Ho",
    "Jab We Met"
  ];
  for (const movie of knownMovies) {
    if (lower.includes(movie.toLowerCase())) {
      entities.movie = movie;
      if (detectedIntent === "artist") {
        detectedIntent = "combination";
        contextLabel = `${entities.artist} \u2022 ${movie}`;
      } else {
        detectedIntent = "movie";
        contextLabel = `Movie \u2022 ${movie}`;
      }
      searchQueriesSet.add(movie);
      searchQueriesSet.add(`${movie} soundtrack`);
      searchQueriesSet.add(`${movie} songs`);
      break;
    }
  }
  if (lower.includes("marathi") || lower.includes("madhla") || lower.includes("madhle") || lower.includes("gani") || lower.includes("che") || lower.includes("pahijet")) {
    entities.language = "Marathi";
    searchQueriesSet.add(`${norm} marathi`);
    searchQueriesSet.add(`marathi ${norm}`);
  } else if (lower.includes("punjabi")) {
    entities.language = "Punjabi";
    searchQueriesSet.add(`${norm} punjabi`);
  } else if (lower.includes("hindi")) {
    entities.language = "Hindi";
  }
  if (lower.includes("90s") || lower.includes("90's") || lower.includes("1990")) {
    entities.era = "90s";
    if (detectedIntent === "general") {
      detectedIntent = "era";
      contextLabel = "Era \u2022 90s Hits";
    }
    searchQueriesSet.add("90s hindi songs");
    searchQueriesSet.add("90s romantic hits");
  } else if (lower.includes("80s") || lower.includes("80's") || lower.includes("1980")) {
    entities.era = "80s";
    if (detectedIntent === "general") {
      detectedIntent = "era";
      contextLabel = "Era \u2022 80s Hits";
    }
    searchQueriesSet.add("80s hindi songs");
  } else if (lower.includes("retro") || lower.includes("old songs") || lower.includes("old classics")) {
    entities.era = "Retro";
    if (detectedIntent === "general") {
      detectedIntent = "era";
      contextLabel = "Era \u2022 Retro Classics";
    }
    searchQueriesSet.add("old hindi classics");
  }
  if (lower.includes("sad")) {
    entities.mood = "Sad";
    if (detectedIntent === "general") {
      detectedIntent = "mood";
      contextLabel = "Mood \u2022 Sad Hits";
    }
    searchQueriesSet.add("sad songs");
    searchQueriesSet.add("sad hindi songs");
  }
  if (lower.includes("romantic") || lower.includes("love")) {
    entities.mood = "Romantic";
    if (detectedIntent === "general") {
      detectedIntent = "mood";
      contextLabel = "Mood \u2022 Romantic Love";
    }
    searchQueriesSet.add("romantic songs");
    searchQueriesSet.add("love songs");
  }
  if (lower.includes("party") || lower.includes("dance") || lower.includes("dj")) {
    entities.mood = "Party";
    if (detectedIntent === "general") {
      detectedIntent = "mood";
      contextLabel = "Mood \u2022 Party & Dance";
    }
    searchQueriesSet.add("party songs");
    searchQueriesSet.add("dance songs");
  }
  if (lower.includes("friendship") || lower.includes("dosti") || lower.includes("yaari") || lower.includes("yaar")) {
    entities.theme = "Friendship";
    if (detectedIntent === "general") {
      detectedIntent = "theme";
      contextLabel = "Theme \u2022 Friendship";
    }
    searchQueriesSet.add("friendship songs");
    searchQueriesSet.add("dosti songs");
    searchQueriesSet.add("yaari songs");
  } else if (lower.includes("ram") || lower.includes("devotional") || lower.includes("bhajan") || lower.includes("ganpati") || lower.includes("shiv") || lower.includes("krishna") || lower.includes("bhakti")) {
    entities.genre = "Devotional";
    if (detectedIntent === "general") {
      detectedIntent = "genre";
      contextLabel = "Genre \u2022 Devotional";
    }
    searchQueriesSet.add("devotional songs");
    searchQueriesSet.add("bhajan");
  } else if (lower.includes("gym") || lower.includes("workout") || lower.includes("motivational")) {
    entities.theme = "Gym";
    if (detectedIntent === "general") {
      detectedIntent = "activity";
      contextLabel = "Activity \u2022 Gym & Workout";
    }
    searchQueriesSet.add("gym workout songs");
  } else if (lower.includes("maa") || lower.includes("mother") || lower.includes("mom") || lower.includes("mummy")) {
    entities.theme = "Maa";
    if (detectedIntent === "general") {
      detectedIntent = "theme";
      contextLabel = "Theme \u2022 Songs for Maa";
    }
    searchQueriesSet.add("maa songs");
    searchQueriesSet.add("meri maa");
    searchQueriesSet.add("tu kitni achhi hai");
  } else if (lower.includes("breakup") || lower.includes("dil tootne") || lower.includes("heartbreak")) {
    entities.mood = "Breakup";
    if (detectedIntent === "general") {
      detectedIntent = "mood";
      contextLabel = "Mood \u2022 Breakup Songs";
    }
    searchQueriesSet.add("breakup songs");
    searchQueriesSet.add("sad breakup songs");
  } else if (lower.includes("wedding") || lower.includes("shaadi") || lower.includes("sangeet")) {
    entities.theme = "Wedding";
    if (detectedIntent === "general") {
      detectedIntent = "occasion";
      contextLabel = "Occasion \u2022 Wedding & Shaadi";
    }
    searchQueriesSet.add("wedding songs");
    searchQueriesSet.add("shaadi songs");
  }
  if (entities.artist && (entities.mood || entities.movie || entities.era || entities.language)) {
    detectedIntent = "combination";
    const sub = entities.mood || entities.movie || entities.era || entities.language;
    contextLabel = `${entities.artist} \u2022 ${sub}`;
  } else if (entities.era && entities.mood) {
    detectedIntent = "combination";
    contextLabel = `Era ${entities.era} \u2022 ${entities.mood}`;
  }
  if (lower.includes("tum hi ho") || lower.includes("mere paas") || lower.includes("jisme") || lower.includes("line") || lower.includes("wo gana") || lower.includes("that song")) {
    detectedIntent = "lyrics";
    entities.lyrics = norm;
    contextLabel = "Lyrics \u2022 Matching Line Search";
    const cleanLyricPhrase = lower.replace(/wo gana jisme|that song jisme|line jisme|wo line jisme|song jisme/gi, "").replace(/ke bare me hai|ke baare me hai|ke bare me/gi, "").trim();
    if (cleanLyricPhrase) {
      searchQueriesSet.add(cleanLyricPhrase);
      const parts = cleanLyricPhrase.split(/\s+/);
      if (parts.length >= 2) {
        searchQueriesSet.add(parts.slice(0, 3).join(" "));
      }
    }
  }
  return {
    normalizedQuery: norm,
    intent: detectedIntent,
    entities,
    searchQueries: Array.from(searchQueriesSet).slice(0, 5),
    contextLabel,
    confidence: 0.8
  };
}
async function getAISearchIntent(query) {
  const normKey = query.trim().toLowerCase();
  const cached = aiSearchCache.get(normKey);
  if (cached && Date.now() - cached.timestamp < 10 * 60 * 1e3) {
    return cached.intent;
  }
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return getDeterministicSearchIntent(query);
  }
  try {
    const ai = new import_genai.GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
        }
      }
    });
    const geminiPromise = ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: `You are the DEEP AI MUSIC SEARCH INTELLIGENCE ENGINE for Sonic Current player.
Analyze user music query: "${query}".

TASK:
1. Parse deep user intent: "artist", "album", "movie", "lyrics", "genre", "mood", "theme", "era", "language", "activity", "occasion", "relationship", "combination", or "general".
2. Extract entities: artist, album, movie, genre, mood, theme, era, language, lyrics.
3. Detect lyrics fragments or line searches (e.g., "tum hi ho humesha mere paas", "wo line jisme dil tootne ki baat hai"). Extract core lyric keywords.
4. Correct spelling errors and typos (e.g. "arjit singh" -> "Arijit Singh", "mre ram" -> "Mere Ram", "sanam teri kasm" -> "Sanam Teri Kasam", "houseful 4" -> "Housefull 4").
5. Handle Hinglish, Roman Marathi, Roman Punjabi (e.g., "90s madhla sad song", "arijit che romantic songs", "yaar dosti wale songs", "ganpati che gani").
6. Generate 3 to 5 distinct, highly targeted search query strategies to fetch REAL songs from JioSaavn catalog.
7. Create a clean human-readable context label (e.g. "Artist \u2022 Arijit Singh", "Movie \u2022 Housefull 4", "Lyrics \u2022 Matching Lyric Search", "Theme \u2022 Friendship", "Era \u2022 90s Hits", "Mood \u2022 Romantic").

Return strictly JSON:
{
  "normalizedQuery": "string",
  "intent": "artist"|"album"|"movie"|"lyrics"|"genre"|"mood"|"theme"|"era"|"language"|"activity"|"occasion"|"relationship"|"combination"|"general",
  "entities": {
    "artist": "string or null",
    "album": "string or null",
    "movie": "string or null",
    "genre": "string or null",
    "mood": "string or null",
    "theme": "string or null",
    "era": "string or null",
    "language": "string or null",
    "lyrics": "string or null"
  },
  "searchQueries": ["string"],
  "contextLabel": "string",
  "confidence": 0.95
}`,
      config: {
        responseMimeType: "application/json"
      }
    });
    const timeoutPromise = new Promise(
      (_, reject) => setTimeout(() => reject(new Error("AI Search Intelligence timeout")), 2800)
    );
    const res = await Promise.race([geminiPromise, timeoutPromise]);
    const text = res.text || "";
    const parsed = JSON.parse(text);
    if (parsed && typeof parsed.normalizedQuery === "string" && Array.isArray(parsed.searchQueries) && parsed.searchQueries.length > 0) {
      const intent = {
        normalizedQuery: parsed.normalizedQuery,
        intent: parsed.intent || "general",
        entities: parsed.entities || {},
        searchQueries: parsed.searchQueries.slice(0, 5),
        contextLabel: parsed.contextLabel || `Search \u2022 ${parsed.normalizedQuery}`,
        confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0.9
      };
      aiSearchCache.set(normKey, { intent, timestamp: Date.now() });
      return intent;
    }
  } catch (err) {
    console.log("[AI Search Intelligence Fallback]:", err?.message || err);
  }
  const fallbackIntent = getDeterministicSearchIntent(query);
  aiSearchCache.set(normKey, { intent: fallbackIntent, timestamp: Date.now() });
  return fallbackIntent;
}
var ALLOWED_HOSTS = [
  "h.saavncdn.com",
  "aac.saavncdn.com",
  "preview.saavncdn.com",
  "www.jiosaavn.com",
  "jiosaavn.com",
  "jiotunepreview.jio.com",
  "jio.com"
];
function isHostAllowed(hostname) {
  return ALLOWED_HOSTS.some(
    (host) => hostname === host || hostname.endsWith(`.${host}`)
  );
}
function decryptMediaUrl(encryptedUrl) {
  if (!encryptedUrl) return "";
  try {
    const key = import_crypto_js.default.enc.Utf8.parse("38346591");
    const decrypted = import_crypto_js.default.DES.decrypt(
      import_crypto_js.default.lib.CipherParams.create({ ciphertext: import_crypto_js.default.enc.Base64.parse(encryptedUrl.trim()) }),
      key,
      { mode: import_crypto_js.default.mode.ECB, padding: import_crypto_js.default.pad.Pkcs7 }
    );
    const decStr = decrypted.toString(import_crypto_js.default.enc.Utf8);
    if (!decStr) return "";
    return decStr.replace("_96.mp4", "_320.mp4");
  } catch (error) {
    console.error("[DES Decryption Error]:", error);
    return "";
  }
}
function cleanString(str) {
  if (!str) return "";
  return str.replace(/&quot;/g, '"').replace(/&amp;/g, "&").replace(/&#039;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/\\\(From "([^"]+)"\\\)/g, "(From '$1')").trim();
}
async function searchSongsJioSaavn(query, page = 1) {
  if (!query || !query.trim()) return [];
  const normalizedQuery = query.trim().replace(/\s+/g, " ").toLowerCase().replace(/\barjit singh\b/g, "arijit singh").replace(/\bmre ram\b/g, "mere ram").replace(/\bsanam teri kasm\b/g, "sanam teri kasam").replace(/\bhouseful 4\b/g, "housefull 4");
  const pageNum = Math.max(1, page || 1);
  const searchUrl = "https://www.jiosaavn.com/api.php?__call=search.getResults&_format=json&_marker=0&cc=in&includeMetaTags=1&q=" + encodeURIComponent(normalizedQuery) + `&p=${pageNum}&n=50`;
  try {
    const searchRes = await fetch(searchUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      }
    });
    const rawText = await searchRes.text();
    let json = {};
    try {
      json = JSON.parse(rawText);
    } catch (e) {
      json = {};
    }
    const rawList = Array.isArray(json?.results) ? json.results : [];
    if (rawList.length > 0) {
      const formattedSongs = [];
      for (const song of rawList) {
        let mediaUrl = decryptMediaUrl(song.encrypted_media_url);
        if (!mediaUrl && song.media_preview_url) {
          mediaUrl = song.media_preview_url.replace("preview", "aac").replace("_96_p.mp4", "_320.mp4");
        }
        const title = cleanString(song.song || song.title || "Unknown Title");
        const artist = cleanString(
          song.primary_artists || song.singers || song.music || "Unknown Artist"
        );
        const album = cleanString(song.album || "");
        const duration = song.duration || "0";
        const image = (song.image || "").replace("150x150", "500x500").replace("50x50", "500x500");
        formattedSongs.push({
          id: String(song.id),
          title,
          song: title,
          artist,
          singers: artist,
          album,
          duration,
          image,
          artwork: image,
          perma_url: song.perma_url || "",
          url: mediaUrl,
          media_url: mediaUrl,
          has320: song["320kbps"] === "true" || mediaUrl.includes("_320")
        });
      }
      return formattedSongs;
    }
  } catch (err) {
    console.error("[Primary Search Error]:", err);
  }
  try {
    const autoUrl = "https://www.jiosaavn.com/api.php?__call=autocomplete.get&_format=json&_marker=0&cc=in&includeMetaTags=1&query=" + encodeURIComponent(query.trim());
    const autoRes = await fetch(autoUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      }
    });
    const rawAutoText = await autoRes.text();
    const cleanAutoText = rawAutoText.replace(/\\\(From "([^"]+)"\\\)/g, "(From '$1')");
    let autoJson = {};
    try {
      autoJson = JSON.parse(cleanAutoText);
    } catch (e) {
      autoJson = {};
    }
    const songList = autoJson?.songs?.data || [];
    const pids = songList.map((s) => s.id).filter(Boolean);
    if (pids.length === 0) return [];
    const detailsUrl = "https://www.jiosaavn.com/api.php?__call=song.getDetails&cc=in&_marker=0&_format=json&pids=" + pids.join(",");
    const detailsRes = await fetch(detailsUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      }
    });
    const detailsJson = await detailsRes.json();
    const formattedSongs = [];
    for (const pid of pids) {
      const song = detailsJson[pid];
      if (!song) continue;
      let mediaUrl = decryptMediaUrl(song.encrypted_media_url);
      if (!mediaUrl && song.media_preview_url) {
        mediaUrl = song.media_preview_url.replace("preview", "aac").replace("_96_p.mp4", "_320.mp4");
      }
      const title = cleanString(song.song || song.title || "Unknown Title");
      const artist = cleanString(
        song.singers || song.primary_artists || song.music || "Unknown Artist"
      );
      const album = cleanString(song.album || "");
      const duration = song.duration || "0";
      const image = (song.image || "").replace("150x150", "500x500").replace("50x50", "500x500");
      formattedSongs.push({
        id: String(song.id),
        title,
        song: title,
        artist,
        singers: artist,
        album,
        duration,
        image,
        artwork: image,
        perma_url: song.perma_url || "",
        url: mediaUrl,
        media_url: mediaUrl,
        has320: song["320kbps"] === "true" || mediaUrl.includes("_320")
      });
    }
    return formattedSongs;
  } catch (err) {
    console.error("[Fallback Search Error]:", err);
    return [];
  }
}
function scoreAndRankSongs(rawSongs, query, intent) {
  const normQuery = query.toLowerCase().trim();
  const queryTokens = normQuery.split(/\s+/).filter((t) => t.length > 1);
  const targetArtist = (intent.entities?.artist || "").toLowerCase().trim();
  const targetMovie = (intent.entities?.movie || intent.entities?.album || "").toLowerCase().trim();
  const targetLyrics = (intent.entities?.lyrics || "").toLowerCase().trim();
  const targetMood = (intent.entities?.mood || intent.entities?.genre || intent.entities?.theme || "").toLowerCase().trim();
  const scored = rawSongs.map((song, idx) => {
    let score = 0;
    const normTitle = (song.title || song.song || "").toLowerCase().trim();
    const normArtist = (song.artist || song.singers || "").toLowerCase().trim();
    const normAlbum = (song.album || "").toLowerCase().trim();
    if (normTitle === normQuery) {
      score += 100;
    } else if (normTitle.includes(normQuery)) {
      score += 65;
    } else if (normQuery.includes(normTitle) && normTitle.length > 3) {
      score += 45;
    }
    let titleMatches = 0;
    for (const token of queryTokens) {
      if (normTitle.includes(token)) titleMatches++;
    }
    if (queryTokens.length > 0) {
      score += titleMatches / queryTokens.length * 40;
    }
    if (targetArtist) {
      if (normArtist.includes(targetArtist)) {
        score += 60;
      } else if (targetArtist.includes(normArtist) && normArtist.length > 3) {
        score += 35;
      }
    } else {
      for (const token of queryTokens) {
        if (normArtist.includes(token)) score += 15;
      }
    }
    if (targetMovie) {
      if (normAlbum.includes(targetMovie) || normTitle.includes(targetMovie)) {
        score += 55;
      }
    }
    if (intent.intent === "lyrics" || targetLyrics) {
      const lQuery = targetLyrics || normQuery;
      const lTokens = lQuery.split(/\s+/).filter((t) => t.length > 2);
      let lMatches = 0;
      for (const token of lTokens) {
        if (normTitle.includes(token) || normAlbum.includes(token)) {
          lMatches++;
        }
      }
      score += lMatches * 25;
    }
    if (targetMood) {
      if (normTitle.includes(targetMood) || normAlbum.includes(targetMood) || normArtist.includes(targetMood)) {
        score += 30;
      }
    }
    const positionBonus = Math.max(0, 20 - idx * 0.4);
    score += positionBonus;
    return { song, score };
  });
  scored.sort((a, b) => b.score - a.score);
  const seenIds = /* @__PURE__ */ new Set();
  const seenPairs = /* @__PURE__ */ new Set();
  const deduplicatedSongs = [];
  for (const item of scored) {
    const s = item.song;
    const id = String(s.id || "").trim();
    const normTitle = (s.title || s.song || "").toLowerCase().replace(/\s*[\(\[\{].*?[\)\]\}]/g, "").replace(/[^a-z0-9]/g, "").trim();
    const primaryArtist = (s.artist || s.singers || "").toLowerCase().split(/,|&|\band\b|\bft\b|\bfeat\b/i)[0].replace(/[^a-z0-9]/g, "").trim();
    const pairKey = `${normTitle}::${primaryArtist}`;
    if (id && seenIds.has(id)) continue;
    if (pairKey.length > 4 && seenPairs.has(pairKey)) continue;
    if (id) seenIds.add(id);
    if (pairKey.length > 4) seenPairs.add(pairKey);
    deduplicatedSongs.push({
      ...s,
      contextLabel: intent.contextLabel
    });
  }
  return deduplicatedSongs;
}
var app = (0, import_express.default)();
var PORT = 3e3;
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Range, Authorization");
  res.setHeader("Access-Control-Expose-Headers", "X-Context-Label");
  if (req.method === "OPTIONS") {
    res.sendStatus(200);
    return;
  }
  if (req.url.startsWith("/.netlify/functions/api")) {
    req.url = req.url.substring("/.netlify/functions/api".length);
    if (!req.url.startsWith("/")) req.url = "/" + req.url;
  }
  if (req.url.startsWith("/api/api/")) {
    req.url = req.url.substring("/api".length);
  }
  next();
});
app.get(["/result", "/result/", "/api/result", "/api/search", "/api/jiosaavn"], async (req, res) => {
  let query = req.query.query || "";
  const rawPath = req.query.path || "";
  const pageParam = parseInt(req.query.page || "1", 10) || 1;
  if (!query && rawPath) {
    if (rawPath.includes("query=")) {
      const parts = rawPath.split("query=");
      query = decodeURIComponent(parts[1] || "");
    }
  }
  if (!query || !query.trim()) {
    res.json([]);
    return;
  }
  try {
    const intent = await getAISearchIntent(query);
    const targetQueries = intent.searchQueries && intent.searchQueries.length > 0 ? intent.searchQueries : [intent.normalizedQuery || query];
    let allSongs = [];
    for (const tq of targetQueries) {
      const resList = await searchSongsJioSaavn(tq, pageParam);
      if (resList.length > 0) {
        allSongs.push(...resList);
      }
    }
    if (pageParam === 1 && (intent.intent === "artist" || intent.intent === "movie" || intent.intent === "album" || intent.intent === "theme" || intent.intent === "genre" || intent.intent === "combination")) {
      const primaryQuery = targetQueries[0] || query;
      const page2List = await searchSongsJioSaavn(primaryQuery, 2);
      if (page2List.length > 0) {
        allSongs.push(...page2List);
      }
    }
    if (allSongs.length === 0) {
      allSongs = await searchSongsJioSaavn(query, pageParam);
    }
    const deduplicatedSongs = scoreAndRankSongs(allSongs, query, intent);
    res.setHeader("Cache-Control", "public, max-age=300, stale-while-revalidate=60");
    res.setHeader("X-Context-Label", encodeURIComponent(intent.contextLabel || ""));
    res.json(deduplicatedSongs);
  } catch (error) {
    console.error("[Search API Error]:", error);
    res.status(500).json({ error: "Failed to fetch song search results" });
  }
});
app.get(["/api/trending", "/trending"], async (req, res) => {
  try {
    const results = await searchSongsJioSaavn("latest trending hindi songs", 1);
    res.setHeader("Cache-Control", "public, max-age=600, stale-while-revalidate=120");
    res.json(results);
  } catch (error) {
    console.error("[Trending API Error]:", error);
    res.json([]);
  }
});
app.get(["/api/suggestions", "/api/autocomplete"], async (req, res) => {
  const query = req.query.query || "";
  if (!query || !query.trim()) {
    res.json([]);
    return;
  }
  try {
    const results = await searchSongsJioSaavn(query.trim(), 1);
    res.setHeader("Cache-Control", "public, max-age=300, stale-while-revalidate=60");
    res.json(results.slice(0, 8));
  } catch (error) {
    console.error("[Suggestions API Error]:", error);
    res.json([]);
  }
});
app.get("/api/audio", async (req, res) => {
  const rawUrl = req.query.url;
  if (!rawUrl) {
    res.status(400).json({ error: "Missing url parameter" });
    return;
  }
  const targetUrl = decodeURIComponent(rawUrl);
  try {
    const parsedUrl = new URL(targetUrl);
    if (!isHostAllowed(parsedUrl.hostname)) {
      console.warn(`[Audio Proxy] Blocked request to non-allowed host: ${parsedUrl.hostname}`);
      res.status(403).json({ error: "Host not permitted" });
      return;
    }
    const rangeHeader = req.headers.range;
    if (!rangeHeader) {
      res.redirect(302, targetUrl);
      return;
    }
    let start = 0;
    let end = 1048575;
    const rangeMatch = rangeHeader.match(/bytes=(\d+)-(\d+)?/);
    if (rangeMatch) {
      start = parseInt(rangeMatch[1], 10) || 0;
      if (rangeMatch[2]) {
        const reqEnd = parseInt(rangeMatch[2], 10);
        end = Math.min(reqEnd, start + 1048575);
      } else {
        end = start + 1048575;
      }
    }
    const headers = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Range": `bytes=${start}-${end}`
    };
    const response = await fetch(targetUrl, {
      headers,
      redirect: "follow"
    });
    if (!response.ok && response.status !== 206) {
      console.warn(`[Audio Proxy] Upstream status ${response.status} for ${targetUrl}`);
      res.status(response.status).json({ error: "Audio source unavailable" });
      return;
    }
    const contentType = response.headers.get("content-type") || "audio/mp4";
    const contentLength = response.headers.get("content-length");
    const contentRange = response.headers.get("content-range");
    res.status(206);
    res.setHeader("Content-Type", contentType);
    if (contentLength) res.setHeader("Content-Length", contentLength);
    if (contentRange) res.setHeader("Content-Range", contentRange);
    res.setHeader("Accept-Ranges", "bytes");
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    res.send(buffer);
    return;
  } catch (error) {
    console.error("[Audio Proxy Stream Error]:", error);
    res.status(502).json({ error: "Failed to stream audio file" });
  }
});
async function startServer() {
  if (!process.env.NETLIFY && !process.env.AWS_LAMBDA_FUNCTION_NAME && !process.env.LAMBDA_TASK_ROOT && !process.env.IS_NETLIFY_FUNCTION) {
    if (process.env.NODE_ENV !== "production") {
      const { createServer: createViteServer } = await import("vite");
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa"
      });
      app.use(vite.middlewares);
    } else {
      const distPath = import_path.default.join(process.cwd(), "dist");
      app.use(import_express.default.static(distPath));
      app.get("*", (req, res) => {
        res.sendFile(import_path.default.join(distPath, "index.html"));
      });
    }
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://0.0.0.0:${PORT}`);
    });
  }
}
var isMainScript = Boolean(process.argv[1]) && (process.argv[1].endsWith("/server.ts") || process.argv[1].endsWith("/server.cjs") || process.argv[1].endsWith("\\server.ts") || process.argv[1].endsWith("\\server.cjs"));
if (isMainScript && !process.env.NETLIFY && !process.env.AWS_LAMBDA_FUNCTION_NAME && !process.env.LAMBDA_TASK_ROOT && !process.env.IS_NETLIFY_FUNCTION) {
  startServer();
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  app
});
//# sourceMappingURL=server.cjs.map
