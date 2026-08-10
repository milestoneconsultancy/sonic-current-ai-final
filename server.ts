import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import CryptoJS from 'crypto-js';
import { GoogleGenAI } from '@google/genai';

interface SearchIntent {
  correctedQuery: string;
  type: 'artist' | 'album' | 'movie' | 'genre' | 'mood' | 'era' | 'general';
  contextLabel: string;
  targetQueries: string[];
}

const aiSearchCache = new Map<string, { intent: SearchIntent; timestamp: number }>();

function getDeterministicSearchIntent(query: string): SearchIntent {
  const trimmed = query.trim().replace(/\s+/g, ' ');
  const lower = trimmed.toLowerCase();

  const norm = trimmed
    .replace(/\barjit singh\b/gi, 'Arijit Singh')
    .replace(/\bmre ram\b/gi, 'Mere Ram')
    .replace(/\bsanam teri kasm\b/gi, 'Sanam Teri Kasam')
    .replace(/\bhouseful 4\b/gi, 'Housefull 4')
    .replace(/\ba r rahman\b/gi, 'A.R. Rahman')
    .replace(/\bar rahman\b/gi, 'A.R. Rahman')
    .replace(/\bkumar sanm\b/gi, 'Kumar Sanu');

  const knownArtists = [
    'Arijit Singh', 'A.R. Rahman', 'Kumar Sanu', 'Lata Mangeshkar', 'Atif Aslam',
    'Shreya Ghoshal', 'Sonu Nigam', 'Badshah', 'Kishore Kumar', 'Neha Kakkar',
    'Jubin Nautiyal', 'Diljit Dosanjh', 'Darshan Raval', 'Pritam', 'Ankit Tiwari',
    'Himesh Reshammiya', 'Shankar Mahadevan', 'Alka Yagnik', 'Udit Narayan', 'K.K.', 'Sid Sriram'
  ];
  for (const artist of knownArtists) {
    if (lower.includes(artist.toLowerCase())) {
      return {
        correctedQuery: artist,
        type: 'artist',
        contextLabel: `Artist • ${artist}`,
        targetQueries: [norm, `${artist} songs`, `${artist} hits`]
      };
    }
  }

  const knownMovies = [
    'Housefull 4', 'Sanam Teri Kasam', 'Kabir Singh', 'Aashiqui 2', 'Animal',
    'Jawan', 'Pathaan', 'Brahmastra', 'Rockstar', 'Dilwale', 'Shershaah', 'Sita Ramam', 'Pushpa', 'KGF', 'RRR'
  ];
  for (const movie of knownMovies) {
    if (lower.includes(movie.toLowerCase())) {
      return {
        correctedQuery: movie,
        type: 'movie',
        contextLabel: `Movie • ${movie}`,
        targetQueries: [norm, `${movie} soundtrack`, `${movie} songs`]
      };
    }
  }

  if (lower.includes('ram') || lower.includes('devotional') || lower.includes('bhajan') || lower.includes('ganpati') || lower.includes('shiv') || lower.includes('krishna') || lower.includes('hanuman') || lower.includes('aarti') || lower.includes('mantra') || lower.includes('chalisa')) {
    return {
      correctedQuery: norm,
      type: 'genre',
      contextLabel: 'Genre • Devotional',
      targetQueries: [norm, 'devotional songs', 'popular bhajan']
    };
  }

  if (lower.includes('90s') || lower.includes('90\'s') || lower.includes('1990')) {
    return {
      correctedQuery: norm,
      type: 'era',
      contextLabel: 'Era • 90s Hits',
      targetQueries: [norm, '90s hindi songs', '90s romantic hits']
    };
  }
  if (lower.includes('80s') || lower.includes('80\'s') || lower.includes('1980')) {
    return {
      correctedQuery: norm,
      type: 'era',
      contextLabel: 'Era • 80s Hits',
      targetQueries: [norm, '80s hindi songs']
    };
  }
  if (lower.includes('retro') || lower.includes('old songs')) {
    return {
      correctedQuery: norm,
      type: 'era',
      contextLabel: 'Era • Retro Classics',
      targetQueries: [norm, 'old hindi classics']
    };
  }

  if (lower.includes('sad')) {
    return {
      correctedQuery: norm,
      type: 'mood',
      contextLabel: 'Mood • Sad',
      targetQueries: [norm, 'sad hindi songs']
    };
  }
  if (lower.includes('happy')) {
    return {
      correctedQuery: norm,
      type: 'mood',
      contextLabel: 'Mood • Happy',
      targetQueries: [norm, 'happy upbeat songs']
    };
  }
  if (lower.includes('romantic') || lower.includes('love')) {
    return {
      correctedQuery: norm,
      type: 'mood',
      contextLabel: 'Mood • Romantic',
      targetQueries: [norm, 'romantic love songs']
    };
  }
  if (lower.includes('party') || lower.includes('dance') || lower.includes('dj')) {
    return {
      correctedQuery: norm,
      type: 'mood',
      contextLabel: 'Mood • Party',
      targetQueries: [norm, 'party dance tracks']
    };
  }

  return {
    correctedQuery: norm,
    type: 'general',
    contextLabel: `Search • ${norm}`,
    targetQueries: [norm]
  };
}

async function getAISearchIntent(query: string): Promise<SearchIntent> {
  const normKey = query.trim().toLowerCase();

  const cached = aiSearchCache.get(normKey);
  if (cached && Date.now() - cached.timestamp < 10 * 60 * 1000) {
    return cached.intent;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return getDeterministicSearchIntent(query);
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    const geminiPromise = ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: `You are an AI music intent parser for Sonic Current music player.
Analyze search query: "${query}".
Correct any spelling errors or typos (e.g. "arjit singh" -> "Arijit Singh", "mre ram" -> "Mere Ram", "sanam teri kasm" -> "Sanam Teri Kasam", "houseful 4" -> "Housefull 4").
Identify intent type: "artist", "album", "movie", "genre", "mood", "era", or "general".
Create a short clean contextLabel (e.g. "Artist • Arijit Singh", "Movie • Housefull 4", "Genre • Devotional", "Era • 90s", "Mood • Romantic", "Search • <Query>").
Provide 1-2 targeted search query strings to fetch real music results.

Output JSON only in this format:
{
  "correctedQuery": "string",
  "type": "artist"|"album"|"movie"|"genre"|"mood"|"era"|"general",
  "contextLabel": "string",
  "targetQueries": ["string"]
}`,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('AI Intent timeout')), 2200)
    );

    const res: any = await Promise.race([geminiPromise, timeoutPromise]);
    const text = res.text || '';
    const parsed = JSON.parse(text);

    if (
      parsed &&
      typeof parsed.correctedQuery === 'string' &&
      Array.isArray(parsed.targetQueries) &&
      parsed.targetQueries.length > 0
    ) {
      const intent: SearchIntent = {
        correctedQuery: parsed.correctedQuery,
        type: parsed.type || 'general',
        contextLabel: parsed.contextLabel || `Search • ${parsed.correctedQuery}`,
        targetQueries: parsed.targetQueries.slice(0, 2),
      };

      aiSearchCache.set(normKey, { intent, timestamp: Date.now() });
      return intent;
    }
  } catch (err: any) {
    console.log('[AI Search Intent Fallback]:', err?.message || err);
  }

  const fallbackIntent = getDeterministicSearchIntent(query);
  aiSearchCache.set(normKey, { intent: fallbackIntent, timestamp: Date.now() });
  return fallbackIntent;
}

const ALLOWED_HOSTS = [
  'h.saavncdn.com',
  'aac.saavncdn.com',
  'preview.saavncdn.com',
  'www.jiosaavn.com',
  'jiosaavn.com',
  'jiotunepreview.jio.com',
  'jio.com',
];

function isHostAllowed(hostname: string): boolean {
  return ALLOWED_HOSTS.some(
    host => hostname === host || hostname.endsWith(`.${host}`)
  );
}

// Decrypt encrypted_media_url using DES ECB with key '38346591'
function decryptMediaUrl(encryptedUrl: string): string {
  if (!encryptedUrl) return '';
  try {
    const key = CryptoJS.enc.Utf8.parse('38346591');
    const decrypted = CryptoJS.DES.decrypt(
      CryptoJS.lib.CipherParams.create({ ciphertext: CryptoJS.enc.Base64.parse(encryptedUrl.trim()) }),
      key,
      { mode: CryptoJS.mode.ECB, padding: CryptoJS.pad.Pkcs7 }
    );
    const decStr = decrypted.toString(CryptoJS.enc.Utf8);
    if (!decStr) return '';
    // Upgrade 96kbps to 320kbps full track
    return decStr.replace('_96.mp4', '_320.mp4');
  } catch (error) {
    console.error('[DES Decryption Error]:', error);
    return '';
  }
}

function cleanString(str: string): string {
  if (!str) return '';
  return str
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&#039;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\\\(From "([^"]+)"\\\)/g, "(From '$1')")
    .trim();
}

async function searchSongsJioSaavn(query: string, page: number = 1) {
  if (!query || !query.trim()) return [];

  // Lightweight normalization and typo tolerance mapping
  const normalizedQuery = query.trim()
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .replace(/\barjit singh\b/g, 'arijit singh')
    .replace(/\bmre ram\b/g, 'mere ram')
    .replace(/\bsanam teri kasm\b/g, 'sanam teri kasam')
    .replace(/\bhouseful 4\b/g, 'housefull 4');

  const pageNum = Math.max(1, page || 1);
  const searchUrl =
    'https://www.jiosaavn.com/api.php?__call=search.getResults&_format=json&_marker=0&cc=in&includeMetaTags=1&q=' +
    encodeURIComponent(normalizedQuery) +
    `&p=${pageNum}&n=50`;

  try {
    const searchRes = await fetch(searchUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    const rawText = await searchRes.text();
    let json: any = {};
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
          mediaUrl = song.media_preview_url
            .replace('preview', 'aac')
            .replace('_96_p.mp4', '_320.mp4');
        }

        const title = cleanString(song.song || song.title || 'Unknown Title');
        const artist = cleanString(
          song.primary_artists || song.singers || song.music || 'Unknown Artist'
        );
        const album = cleanString(song.album || '');
        const duration = song.duration || '0';
        const image = (song.image || '')
          .replace('150x150', '500x500')
          .replace('50x50', '500x500');

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
          perma_url: song.perma_url || '',
          url: mediaUrl,
          media_url: mediaUrl,
          has320: song['320kbps'] === 'true' || mediaUrl.includes('_320'),
        });
      }
      return formattedSongs;
    }
  } catch (err) {
    console.error('[Primary Search Error]:', err);
  }

  // Fallback to autocomplete.get -> song.getDetails if search.getResults returned 0 items
  try {
    const autoUrl =
      'https://www.jiosaavn.com/api.php?__call=autocomplete.get&_format=json&_marker=0&cc=in&includeMetaTags=1&query=' +
      encodeURIComponent(query.trim());

    const autoRes = await fetch(autoUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    const rawAutoText = await autoRes.text();
    const cleanAutoText = rawAutoText.replace(/\\\(From "([^"]+)"\\\)/g, "(From '$1')");
    let autoJson: any = {};
    try {
      autoJson = JSON.parse(cleanAutoText);
    } catch (e) {
      autoJson = {};
    }

    const songList = autoJson?.songs?.data || [];
    const pids = songList.map((s: any) => s.id).filter(Boolean);
    if (pids.length === 0) return [];

    const detailsUrl =
      'https://www.jiosaavn.com/api.php?__call=song.getDetails&cc=in&_marker=0&_format=json&pids=' +
      pids.join(',');

    const detailsRes = await fetch(detailsUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    const detailsJson = await detailsRes.json();

    const formattedSongs = [];
    for (const pid of pids) {
      const song = detailsJson[pid];
      if (!song) continue;

      let mediaUrl = decryptMediaUrl(song.encrypted_media_url);

      if (!mediaUrl && song.media_preview_url) {
        mediaUrl = song.media_preview_url
          .replace('preview', 'aac')
          .replace('_96_p.mp4', '_320.mp4');
      }

      const title = cleanString(song.song || song.title || 'Unknown Title');
      const artist = cleanString(
        song.singers || song.primary_artists || song.music || 'Unknown Artist'
      );
      const album = cleanString(song.album || '');
      const duration = song.duration || '0';
      const image = (song.image || '')
        .replace('150x150', '500x500')
        .replace('50x50', '500x500');

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
        perma_url: song.perma_url || '',
        url: mediaUrl,
        media_url: mediaUrl,
        has320: song['320kbps'] === 'true' || mediaUrl.includes('_320'),
      });
    }

    return formattedSongs;
  } catch (err) {
    console.error('[Fallback Search Error]:', err);
    return [];
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // 1. Result & Search API (compatible with cyberboysumanjay/JioSaavnAPI architecture)
  app.get(['/result', '/result/', '/api/result', '/api/search', '/api/jiosaavn'], async (req, res) => {
    let query = (req.query.query as string) || '';
    const rawPath = (req.query.path as string) || '';
    const pageParam = parseInt((req.query.page as string) || '1', 10) || 1;

    if (!query && rawPath) {
      if (rawPath.includes('query=')) {
        const parts = rawPath.split('query=');
        query = decodeURIComponent(parts[1] || '');
      }
    }

    if (!query || !query.trim()) {
      res.json([]);
      return;
    }

    try {
      const intent = await getAISearchIntent(query);
      const targetQueries =
        intent.targetQueries && intent.targetQueries.length > 0
          ? intent.targetQueries
          : [intent.correctedQuery || query];

      let allSongs: any[] = [];
      for (const tq of targetQueries) {
        const resList = await searchSongsJioSaavn(tq, pageParam);
        if (resList.length > 0) {
          allSongs.push(...resList);
        }
      }

      if (allSongs.length === 0) {
        allSongs = await searchSongsJioSaavn(query, pageParam);
      }

      // Deduplicate by song ID and title+artist pair
      const seenIds = new Set<string>();
      const seenPairs = new Set<string>();
      const deduplicatedSongs: any[] = [];

      for (const song of allSongs) {
        const id = String(song.id);
        const pairKey = `${(song.title || '').toLowerCase().trim()}_${(song.artist || '').toLowerCase().trim()}`;
        if (!seenIds.has(id) && !seenPairs.has(pairKey)) {
          seenIds.add(id);
          seenPairs.add(pairKey);
          deduplicatedSongs.push({
            ...song,
            contextLabel: intent.contextLabel,
          });
        }
      }

      res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=60');
      res.setHeader('X-Context-Label', encodeURIComponent(intent.contextLabel || ''));
      res.json(deduplicatedSongs);
    } catch (error) {
      console.error('[Search API Error]:', error);
      res.status(500).json({ error: 'Failed to fetch song search results' });
    }
  });

  // 1b. Autocomplete suggestions endpoint (returns array of clean song titles only)
  app.get(['/api/suggestions', '/api/autocomplete'], async (req, res) => {
    const query = (req.query.query as string) || '';
    if (!query || !query.trim()) {
      res.json([]);
      return;
    }

    try {
      const searchUrl =
        'https://www.jiosaavn.com/api.php?__call=autocomplete.get&_format=json&_marker=0&cc=in&includeMetaTags=1&query=' +
        encodeURIComponent(query.trim());

      const response = await fetch(searchUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      });

      const rawText = await response.text();
      const cleanText = rawText.replace(/\\\(From "([^"]+)"\\\)/g, "(From '$1')");
      let json: any = {};
      try {
        json = JSON.parse(cleanText);
      } catch (e) {
        json = {};
      }

      const songTitlesSet = new Set<string>();

      // Extract from songs
      const songsList = json?.songs?.data || [];
      for (const s of songsList) {
        const rawTitle = s.title || s.song;
        if (rawTitle) {
          const cleanTitle = cleanString(rawTitle);
          if (cleanTitle) songTitlesSet.add(cleanTitle);
        }
      }

      // Extract from topquery if song
      const topList = json?.topquery?.data || [];
      for (const t of topList) {
        if (t.type === 'song' || t.type === 'music') {
          const rawTitle = t.title || t.song;
          if (rawTitle) {
            const cleanTitle = cleanString(rawTitle);
            if (cleanTitle) songTitlesSet.add(cleanTitle);
          }
        }
      }

      res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=60');
      res.json(Array.from(songTitlesSet).slice(0, 8));
    } catch (error) {
      console.error('[Suggestions API Error]:', error);
      res.json([]);
    }
  });

  // 2. Audio Stream Proxy Endpoint with HTTP Range support
  app.get('/api/audio', async (req, res) => {
    const rawUrl = req.query.url as string;
    if (!rawUrl) {
      res.status(400).json({ error: 'Missing url parameter' });
      return;
    }

    const targetUrl = decodeURIComponent(rawUrl);

    try {
      const parsedUrl = new URL(targetUrl);
      if (!isHostAllowed(parsedUrl.hostname)) {
        console.warn(`[Audio Proxy] Blocked request to non-allowed host: ${parsedUrl.hostname}`);
        res.status(403).json({ error: 'Host not permitted' });
        return;
      }

      const headers: Record<string, string> = {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      };

      if (req.headers.range) {
        headers['Range'] = req.headers.range as string;
      }

      const response = await fetch(targetUrl, {
        headers,
        redirect: 'follow',
      });

      if (!response.ok && response.status !== 206) {
        console.warn(`[Audio Proxy] Upstream status ${response.status} for ${targetUrl}`);
        res.status(response.status).json({ error: 'Audio source unavailable' });
        return;
      }

      const contentType = response.headers.get('content-type') || 'audio/mpeg';
      const contentLength = response.headers.get('content-length');
      const contentRange = response.headers.get('content-range');
      const acceptRanges = response.headers.get('accept-ranges');

      res.status(response.status);
      res.setHeader('Content-Type', contentType);
      if (contentLength) res.setHeader('Content-Length', contentLength);
      if (contentRange) res.setHeader('Content-Range', contentRange);
      if (acceptRanges) res.setHeader('Accept-Ranges', acceptRanges);
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');

      if (response.body) {
        const reader = response.body.getReader();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          res.write(Buffer.from(value));
        }
        res.end();
        return;
      }
    } catch (error) {
      console.error('[Audio Proxy Stream Error]:', error);
      res.status(502).json({ error: 'Failed to stream audio file' });
    }
  });

  // Vite middleware for dev
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

