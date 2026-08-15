import express from 'express';
import path from 'path';
import crypto from 'crypto';
import CryptoJS from 'crypto-js';
import { GoogleGenAI } from '@google/genai';
import { deduplicateSongs, verifyNoDuplicates } from './src/lib/dedupe.js';
import { getPersistentCache, setPersistentCache } from './src/lib/serverCache.js';
import { MultiProviderMusicManager } from './src/lib/providers/MusicProvider.js';
import { PrimaryJioSaavnProvider, SecondaryJioSaavnProvider } from './src/lib/providers/JioSaavnProvider.js';
import {
  generateVibeDJPlaylist,
  generatePersonalizedFeed,
  generateSmartQueueNext,
  parseVoiceCommand,
} from './server/aiFeatures.js';
import { getSongLyrics } from './server/lyricsService.js';

const musicManager = new MultiProviderMusicManager([
  new PrimaryJioSaavnProvider(),
  new SecondaryJioSaavnProvider(),
]);

interface SearchIntent {
  normalizedQuery: string;
  intent:
    | 'artist'
    | 'album'
    | 'movie'
    | 'lyrics'
    | 'genre'
    | 'mood'
    | 'theme'
    | 'era'
    | 'language'
    | 'activity'
    | 'occasion'
    | 'relationship'
    | 'combination'
    | 'general';
  entities: {
    artist?: string | null;
    album?: string | null;
    movie?: string | null;
    genre?: string | null;
    mood?: string | null;
    theme?: string | null;
    era?: string | null;
    language?: string | null;
    lyrics?: string | null;
  };
  searchQueries: string[];
  contextLabel: string;
  confidence?: number;
}

const aiSearchCache = new Map<string, { intent: SearchIntent; timestamp: number }>();

function getDeterministicSearchIntent(query: string): SearchIntent {
  const trimmed = query.trim().replace(/\s+/g, ' ');
  const lower = trimmed.toLowerCase();

  // 1. Common Typo & Transliteration Normalization
  let norm = trimmed
    .replace(/\barjit singh\b/gi, 'Arijit Singh')
    .replace(/\barjit\b/gi, 'Arijit Singh')
    .replace(/\bmre ram\b/gi, 'Mere Ram')
    .replace(/\bsanam teri kasm\b/gi, 'Sanam Teri Kasam')
    .replace(/\bhouseful 4\b/gi, 'Housefull 4')
    .replace(/\ba r rahman\b/gi, 'A.R. Rahman')
    .replace(/\bar rahman\b/gi, 'A.R. Rahman')
    .replace(/\bkumar sanm\b/gi, 'Kumar Sanu')
    .replace(/\bshreya ghosal\b/gi, 'Shreya Ghoshal')
    .replace(/\bfrndship\b/gi, 'friendship')
    .replace(/\bromntic\b/gi, 'romantic');

  const entities: SearchIntent['entities'] = {};
  let detectedIntent: SearchIntent['intent'] = 'general';
  let contextLabel = `Search • ${norm}`;
  const searchQueriesSet = new Set<string>([norm]);

  // Known Artists
  const knownArtists = [
    'Arijit Singh', 'A.R. Rahman', 'Kumar Sanu', 'Lata Mangeshkar', 'Atif Aslam',
    'Shreya Ghoshal', 'Sonu Nigam', 'Badshah', 'Kishore Kumar', 'Neha Kakkar',
    'Jubin Nautiyal', 'Diljit Dosanjh', 'Darshan Raval', 'Pritam', 'Ankit Tiwari',
    'Himesh Reshammiya', 'Shankar Mahadevan', 'Alka Yagnik', 'Udit Narayan', 'K.K.',
    'Sid Sriram', 'Yo Yo Honey Singh', 'Sunidhi Chauhan', 'Mohit Chauhan', 'Jagjit Singh',
    'Asha Bhosle', 'Mohammad Rafi', 'R.D. Burman', 'Gulzar', 'Vishal-Shekhar', 'Sachin-Jigar'
  ];
  for (const artist of knownArtists) {
    if (lower.includes(artist.toLowerCase())) {
      entities.artist = artist;
      detectedIntent = 'artist';
      contextLabel = `Artist • ${artist}`;
      searchQueriesSet.add(artist);
      searchQueriesSet.add(`${artist} songs`);
      searchQueriesSet.add(`${artist} hits`);
      break;
    }
  }

  // Known Movies / Albums
  const knownMovies = [
    'Housefull 4', 'Sanam Teri Kasam', 'Kabir Singh', 'Aashiqui 2', 'Animal',
    'Jawan', 'Pathaan', 'Brahmastra', 'Rockstar', 'Dilwale', 'Shershaah', 'Sita Ramam',
    'Pushpa', 'KGF', 'RRR', 'Yeh Jawaani Hai Deewani', 'Kal Ho Naa Ho', 'Jab We Met'
  ];
  for (const movie of knownMovies) {
    if (lower.includes(movie.toLowerCase())) {
      entities.movie = movie;
      if (detectedIntent === 'artist') {
        detectedIntent = 'combination';
        contextLabel = `${entities.artist} • ${movie}`;
      } else {
        detectedIntent = 'movie';
        contextLabel = `Movie • ${movie}`;
      }
      searchQueriesSet.add(movie);
      searchQueriesSet.add(`${movie} soundtrack`);
      searchQueriesSet.add(`${movie} songs`);
      break;
    }
  }

  // Languages (Roman Marathi, Roman Punjabi, Hindi)
  if (lower.includes('marathi') || lower.includes('madhla') || lower.includes('madhle') || lower.includes('gani') || lower.includes('che') || lower.includes('pahijet')) {
    entities.language = 'Marathi';
    searchQueriesSet.add(`${norm} marathi`);
    searchQueriesSet.add(`marathi ${norm}`);
  } else if (lower.includes('punjabi')) {
    entities.language = 'Punjabi';
    searchQueriesSet.add(`${norm} punjabi`);
  } else if (lower.includes('hindi')) {
    entities.language = 'Hindi';
  }

  // Eras
  if (lower.includes('90s') || lower.includes('90\'s') || lower.includes('1990')) {
    entities.era = '90s';
    if (detectedIntent === 'general') {
      detectedIntent = 'era';
      contextLabel = 'Era • 90s Hits';
    }
    searchQueriesSet.add('90s hindi songs');
    searchQueriesSet.add('90s romantic hits');
  } else if (lower.includes('80s') || lower.includes('80\'s') || lower.includes('1980')) {
    entities.era = '80s';
    if (detectedIntent === 'general') {
      detectedIntent = 'era';
      contextLabel = 'Era • 80s Hits';
    }
    searchQueriesSet.add('80s hindi songs');
  } else if (lower.includes('retro') || lower.includes('old songs') || lower.includes('old classics')) {
    entities.era = 'Retro';
    if (detectedIntent === 'general') {
      detectedIntent = 'era';
      contextLabel = 'Era • Retro Classics';
    }
    searchQueriesSet.add('old hindi classics');
  }

  // Moods & Themes
  if (lower.includes('sad')) {
    entities.mood = 'Sad';
    if (detectedIntent === 'general') {
      detectedIntent = 'mood';
      contextLabel = 'Mood • Sad Hits';
    }
    searchQueriesSet.add('sad songs');
    searchQueriesSet.add('sad hindi songs');
  }
  if (lower.includes('romantic') || lower.includes('love')) {
    entities.mood = 'Romantic';
    if (detectedIntent === 'general') {
      detectedIntent = 'mood';
      contextLabel = 'Mood • Romantic Love';
    }
    searchQueriesSet.add('romantic songs');
    searchQueriesSet.add('love songs');
  }
  if (lower.includes('party') || lower.includes('dance') || lower.includes('dj')) {
    entities.mood = 'Party';
    if (detectedIntent === 'general') {
      detectedIntent = 'mood';
      contextLabel = 'Mood • Party & Dance';
    }
    searchQueriesSet.add('party songs');
    searchQueriesSet.add('dance songs');
  }
  if (lower.includes('friendship') || lower.includes('dosti') || lower.includes('yaari') || lower.includes('yaar')) {
    entities.theme = 'Friendship';
    if (detectedIntent === 'general') {
      detectedIntent = 'theme';
      contextLabel = 'Theme • Friendship';
    }
    searchQueriesSet.add('friendship songs');
    searchQueriesSet.add('dosti songs');
    searchQueriesSet.add('yaari songs');
  } else if (lower.includes('ram') || lower.includes('devotional') || lower.includes('bhajan') || lower.includes('ganpati') || lower.includes('shiv') || lower.includes('krishna') || lower.includes('bhakti')) {
    entities.genre = 'Devotional';
    if (detectedIntent === 'general') {
      detectedIntent = 'genre';
      contextLabel = 'Genre • Devotional';
    }
    searchQueriesSet.add('devotional songs');
    searchQueriesSet.add('bhajan');
  } else if (lower.includes('gym') || lower.includes('workout') || lower.includes('motivational')) {
    entities.theme = 'Gym';
    if (detectedIntent === 'general') {
      detectedIntent = 'activity';
      contextLabel = 'Activity • Gym & Workout';
    }
    searchQueriesSet.add('gym workout songs');
  } else if (lower.includes('maa') || lower.includes('mother') || lower.includes('mom') || lower.includes('mummy')) {
    entities.theme = 'Maa';
    if (detectedIntent === 'general') {
      detectedIntent = 'theme';
      contextLabel = 'Theme • Songs for Maa';
    }
    searchQueriesSet.add('maa songs');
    searchQueriesSet.add('meri maa');
    searchQueriesSet.add('tu kitni achhi hai');
  } else if (lower.includes('breakup') || lower.includes('dil tootne') || lower.includes('heartbreak')) {
    entities.mood = 'Breakup';
    if (detectedIntent === 'general') {
      detectedIntent = 'mood';
      contextLabel = 'Mood • Breakup Songs';
    }
    searchQueriesSet.add('breakup songs');
    searchQueriesSet.add('sad breakup songs');
  } else if (lower.includes('wedding') || lower.includes('shaadi') || lower.includes('sangeet')) {
    entities.theme = 'Wedding';
    if (detectedIntent === 'general') {
      detectedIntent = 'occasion';
      contextLabel = 'Occasion • Wedding & Shaadi';
    }
    searchQueriesSet.add('wedding songs');
    searchQueriesSet.add('shaadi songs');
  }

  // Combination Label Formatting
  if (entities.artist && (entities.mood || entities.movie || entities.era || entities.language)) {
    detectedIntent = 'combination';
    const sub = entities.mood || entities.movie || entities.era || entities.language;
    contextLabel = `${entities.artist} • ${sub}`;
  } else if (entities.era && entities.mood) {
    detectedIntent = 'combination';
    contextLabel = `Era ${entities.era} • ${entities.mood}`;
  }

  // Lyrics / Line Search Detection
  if (
    lower.includes('tum hi ho') ||
    lower.includes('mere paas') ||
    lower.includes('jisme') ||
    lower.includes('line') ||
    lower.includes('wo gana') ||
    lower.includes('that song')
  ) {
    detectedIntent = 'lyrics';
    entities.lyrics = norm;
    contextLabel = 'Lyrics • Matching Line Search';
    const cleanLyricPhrase = lower
      .replace(/wo gana jisme|that song jisme|line jisme|wo line jisme|song jisme/gi, '')
      .replace(/ke bare me hai|ke baare me hai|ke bare me/gi, '')
      .trim();

    if (cleanLyricPhrase) {
      searchQueriesSet.add(cleanLyricPhrase);
      const parts = cleanLyricPhrase.split(/\s+/);
      if (parts.length >= 2) {
        searchQueriesSet.add(parts.slice(0, 3).join(' '));
      }
    }
  }

  return {
    normalizedQuery: norm,
    intent: detectedIntent,
    entities,
    searchQueries: Array.from(searchQueriesSet).slice(0, 5),
    contextLabel,
    confidence: 0.8,
  };
}

async function getAISearchIntent(query: string): Promise<SearchIntent> {
  const normKey = query.trim().toLowerCase();

  const cached = await getPersistentCache<SearchIntent>(`intent:${normKey}`);
  if (cached) {
    return cached;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return getDeterministicSearchIntent(query);
  }

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const geminiPromise = ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: `You are the DEEP AI MUSIC SEARCH INTELLIGENCE ENGINE for Sonic Current player.
Analyze user music query: "${query}".

TASK:
1. Parse deep user intent: "artist", "album", "movie", "lyrics", "genre", "mood", "theme", "era", "language", "activity", "occasion", "relationship", "combination", or "general".
2. Extract entities: artist, album, movie, genre, mood, theme, era, language, lyrics.
3. Detect lyrics fragments or line searches (e.g., "tum hi ho humesha mere paas", "wo line jisme dil tootne ki baat hai"). Extract core lyric keywords.
4. Correct spelling errors and typos (e.g. "arjit singh" -> "Arijit Singh", "mre ram" -> "Mere Ram", "sanam teri kasm" -> "Sanam Teri Kasam", "houseful 4" -> "Housefull 4").
5. Handle Hinglish, Roman Marathi, Roman Punjabi (e.g., "90s madhla sad song", "arijit che romantic songs", "yaar dosti wale songs", "ganpati che gani").
6. Generate 3 to 5 distinct, highly targeted search query strategies to fetch REAL songs from JioSaavn catalog.
7. Create a clean human-readable context label (e.g. "Artist • Arijit Singh", "Movie • Housefull 4", "Lyrics • Matching Lyric Search", "Theme • Friendship", "Era • 90s Hits", "Mood • Romantic").

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
        responseMimeType: 'application/json',
      },
    });

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('AI Search Intelligence timeout')), 2800)
    );

    const res: any = await Promise.race([geminiPromise, timeoutPromise]);
    const text = res.text || '';
    const parsed = JSON.parse(text);

    if (
      parsed &&
      typeof parsed.normalizedQuery === 'string' &&
      Array.isArray(parsed.searchQueries) &&
      parsed.searchQueries.length > 0
    ) {
      const intent: SearchIntent = {
        normalizedQuery: parsed.normalizedQuery,
        intent: parsed.intent || 'general',
        entities: parsed.entities || {},
        searchQueries: parsed.searchQueries.slice(0, 5),
        contextLabel: parsed.contextLabel || `Search • ${parsed.normalizedQuery}`,
        confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.9,
      };

      await setPersistentCache(`intent:${normKey}`, intent, 1800);
      return intent;
    }
  } catch (err: any) {
    console.log('[AI Search Intelligence Fallback]:', err?.message || err);
  }

  const fallbackIntent = getDeterministicSearchIntent(query);
  await setPersistentCache(`intent:${normKey}`, fallbackIntent, 1800);
  return fallbackIntent;
}

const ALLOWED_HOSTS = [
  'saavncdn.com',
  'jiosaavn.com',
  'jio.com',
  'saavn.com',
  'h.saavncdn.com',
  'aac.saavncdn.com',
  'preview.saavncdn.com',
  'www.jiosaavn.com',
  'jiotunepreview.jio.com',
];

function isHostAllowed(hostname: string): boolean {
  if (!hostname) return false;
  const h = hostname.toLowerCase();
  return (
    h.includes('saavncdn.com') ||
    h.includes('jiosaavn.com') ||
    h.includes('jio.com') ||
    h.includes('saavn.com') ||
    ALLOWED_HOSTS.some(host => h === host || h.endsWith(`.${host}`))
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
        const songLang = cleanString(song.language || 'Hindi');

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
          language: songLang,
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
      const songLang = cleanString(song.language || 'Hindi');

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
        language: songLang,
        has320: song['320kbps'] === 'true' || mediaUrl.includes('_320'),
      });
    }

    return formattedSongs;
  } catch (err) {
    console.error('[Fallback Search Error]:', err);
    return [];
  }
}

function scoreAndRankSongs(rawSongs: any[], query: string, intent: SearchIntent): any[] {
  const normQuery = query.toLowerCase().trim();
  const queryTokens = normQuery.split(/\s+/).filter((t) => t.length > 1);

  const targetArtist = (intent.entities?.artist || '').toLowerCase().trim();
  const targetMovie = (intent.entities?.movie || intent.entities?.album || '').toLowerCase().trim();
  const targetLyrics = (intent.entities?.lyrics || '').toLowerCase().trim();
  const targetMood = (intent.entities?.mood || intent.entities?.genre || intent.entities?.theme || '').toLowerCase().trim();

  const scored = rawSongs.map((song, idx) => {
    let score = 0;
    const normTitle = (song.title || song.song || '').toLowerCase().trim();
    const normArtist = (song.artist || song.singers || '').toLowerCase().trim();
    const normAlbum = (song.album || '').toLowerCase().trim();

    // 1. Title Exact Match & Substring
    if (normTitle === normQuery) {
      score += 100;
    } else if (normTitle.includes(normQuery)) {
      score += 65;
    } else if (normQuery.includes(normTitle) && normTitle.length > 3) {
      score += 45;
    }

    // 2. Token overlap with Title
    let titleMatches = 0;
    for (const token of queryTokens) {
      if (normTitle.includes(token)) titleMatches++;
    }
    if (queryTokens.length > 0) {
      score += (titleMatches / queryTokens.length) * 40;
    }

    // 3. Artist Matching
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

    // 4. Movie / Album Matching
    if (targetMovie) {
      if (normAlbum.includes(targetMovie) || normTitle.includes(targetMovie)) {
        score += 55;
      }
    }

    // 5. Lyrics / Line Matching
    if (intent.intent === 'lyrics' || targetLyrics) {
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

    // 6. Mood / Theme / Genre Matching
    if (targetMood) {
      if (normTitle.includes(targetMood) || normAlbum.includes(targetMood) || normArtist.includes(targetMood)) {
        score += 30;
      }
    }

    // 7. Original Catalog Order Bias
    const positionBonus = Math.max(0, 20 - idx * 0.4);
    score += positionBonus;

    return { song, score };
  });

  scored.sort((a, b) => b.score - a.score);

  const songsWithContext = scored.map((item) => ({
    ...item.song,
    contextLabel: intent.contextLabel,
  }));

  const { uniqueSongs } = deduplicateSongs(songsWithContext);
  return uniqueSongs;
}

export const app = express();
const PORT = 3000;

// Body Parser for JSON APIs
app.use(express.json());

// ==========================================
// SECURE ADMIN AUTHENTICATION (TIMING-SAFE)
// ==========================================
const ADMIN_PASSWORD = (process.env.ADMIN_PASSWORD || 'Pk@12345').trim();
const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'sonic_secure_secret_key_849203_admin_safe';

function verifyAdminPassword(inputPass: string): boolean {
  if (!inputPass) return false;
  const inputHash = crypto.createHash('sha256').update(inputPass.trim()).digest();
  const targetHash = crypto.createHash('sha256').update(ADMIN_PASSWORD).digest();
  return crypto.timingSafeEqual(inputHash, targetHash);
}

function generateAdminToken(): { token: string; expiresAt: number } {
  const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  const payload = JSON.stringify({ role: 'admin', exp: expiresAt, iat: Date.now() });
  const payloadB64 = Buffer.from(payload).toString('base64url');
  const signature = crypto.createHmac('sha256', ADMIN_JWT_SECRET).update(payloadB64).digest('hex');
  return { token: `${payloadB64}.${signature}`, expiresAt };
}

function verifyAdminToken(token: string): boolean {
  if (!token || typeof token !== 'string') return false;
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  const [payloadB64, signature] = parts;
  const expectedSignature = crypto.createHmac('sha256', ADMIN_JWT_SECRET).update(payloadB64).digest('hex');

  const sigBuffer = Buffer.from(signature);
  const expectedSigBuffer = Buffer.from(expectedSignature);
  if (sigBuffer.length !== expectedSigBuffer.length || !crypto.timingSafeEqual(sigBuffer, expectedSigBuffer)) {
    return false;
  }

  try {
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
    if (payload.role !== 'admin' || !payload.exp || Date.now() > payload.exp) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

// 1. Admin Login Endpoint
app.post(['/api/admin/login', '/admin/login'], (req, res) => {
  try {
    const { password } = req.body || {};
    if (!password || typeof password !== 'string') {
      res.status(400).json({ success: false, error: 'Password is required' });
      return;
    }

    if (!verifyAdminPassword(password)) {
      res.status(401).json({ success: false, error: 'Invalid Admin Password' });
      return;
    }

    const { token, expiresAt } = generateAdminToken();
    res.json({
      success: true,
      token,
      expiresAt,
      message: 'Admin authentication successful',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Authentication failed' });
  }
});

// 2. Admin Verify Token Endpoint
app.all(['/api/admin/verify-token', '/admin/verify-token'], (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    let token = '';
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7).trim();
    } else if (req.body && req.body.token) {
      token = req.body.token;
    } else if (req.query && req.query.token) {
      token = String(req.query.token);
    }

    if (verifyAdminToken(token)) {
      res.json({ success: true, valid: true });
    } else {
      res.status(401).json({ success: false, valid: false, error: 'Unauthorized or expired session' });
    }
  } catch (err) {
    res.status(401).json({ success: false, valid: false });
  }
});

// ==========================================
// REALTIME MULTI-DEVICE PRESENCE & ANALYTICS
// ==========================================
interface ServerActiveSession {
  id: string;
  sessionId: string;
  uid: string;
  email: string;
  device: 'Mobile' | 'Desktop' | 'Tablet';
  deviceDetail: string;
  browser: string;
  os: string;
  page: string;
  activeSong: string | null;
  activeArtist?: string | null;
  lastSeen: number;
  lastSeenISO: string;
  isOnline: boolean;
}

const serverActiveSessions = new Map<string, ServerActiveSession>();
const serverAnalyticsEvents: any[] = [];
const serverDailyStats: Record<string, { visits: number; plays: number; searches: number; downloads: number; likes: number }> = {};

function pruneInactiveSessions() {
  const now = Date.now();
  for (const [sid, session] of serverActiveSessions.entries()) {
    if (now - session.lastSeen > 35000) {
      serverActiveSessions.delete(sid);
    }
  }
}

// 1. Presence Ping from any device (Mobile/Desktop/Tablet)
app.post(['/api/presence/ping', '/presence/ping'], (req, res) => {
  try {
    const body = req.body || {};
    const sessionId = body.sessionId || body.id;
    if (!sessionId) {
      res.status(400).json({ error: 'Missing sessionId' });
      return;
    }

    const session: ServerActiveSession = {
      id: sessionId,
      sessionId,
      uid: body.uid || 'guest',
      email: body.email || 'Guest Visitor',
      device: body.device || 'Desktop',
      deviceDetail: body.deviceDetail || `${body.os || ''} ${body.browser || ''}`.trim() || 'Device',
      browser: body.browser || 'Browser',
      os: body.os || 'OS',
      page: body.page || 'home',
      activeSong: body.activeSong || null,
      activeArtist: body.activeArtist || null,
      lastSeen: Date.now(),
      lastSeenISO: new Date().toISOString(),
      isOnline: true,
    };

    serverActiveSessions.set(sessionId, session);
    pruneInactiveSessions();
    res.json({ status: 'ok', activeCount: serverActiveSessions.size });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'Error' });
  }
});

// 2. Active Devices List for Admin Dashboard
app.get(['/api/presence/active', '/presence/active'], (req, res) => {
  pruneInactiveSessions();
  const users = Array.from(serverActiveSessions.values()).sort((a, b) => b.lastSeen - a.lastSeen);
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.json({
    count: users.length,
    users,
  });
});

// 3. Presence Leave
app.post(['/api/presence/leave', '/presence/leave'], (req, res) => {
  try {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch (_) {}
    }
    const sessionId = body?.sessionId || body?.id;
    if (sessionId) {
      serverActiveSessions.delete(sessionId);
    }
    res.json({ status: 'ok' });
  } catch (e) {
    res.json({ status: 'ok' });
  }
});

// 4. Multi-device Event Tracking (plays, searches, visits, etc.)
app.post(['/api/analytics/track', '/analytics/track'], (req, res) => {
  try {
    const event = req.body || {};
    if (event.eventType) {
      serverAnalyticsEvents.unshift({
        ...event,
        serverReceivedAt: Date.now(),
      });
      if (serverAnalyticsEvents.length > 500) {
        serverAnalyticsEvents.length = 500;
      }

      const today = event.date || new Date().toISOString().split('T')[0];
      if (!serverDailyStats[today]) {
        serverDailyStats[today] = { visits: 0, plays: 0, searches: 0, downloads: 0, likes: 0 };
      }
      if (event.eventType === 'visit') serverDailyStats[today].visits++;
      if (event.eventType === 'song_play') serverDailyStats[today].plays++;
      if (event.eventType === 'search') serverDailyStats[today].searches++;
      if (event.eventType === 'download') serverDailyStats[today].downloads++;
      if (event.eventType === 'like') serverDailyStats[today].likes++;
    }
    res.json({ status: 'ok' });
  } catch (e) {
    res.status(500).json({ error: 'Failed to record event' });
  }
});

// 5. Analytics Summary API for Dashboard
app.get(['/api/analytics/summary', '/analytics/summary'], (req, res) => {
  pruneInactiveSessions();
  const timeRange = (req.query.timeRange as string) || 'today';
  let days = 30;
  if (timeRange === 'today') days = 1;
  if (timeRange === 'yesterday') days = 2;
  if (timeRange === '7d') days = 7;
  if (timeRange === '14d') days = 14;

  const dates: string[] = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().split('T')[0]);
  }

  const todayStr = dates[dates.length - 1];
  let totalVisits = 0;
  let totalPlays = 0;
  let totalSearches = 0;
  let totalDownloads = 0;
  let totalLikes = 0;
  const dailyData: any[] = [];

  dates.forEach((dStr) => {
    const stat = serverDailyStats[dStr] || { visits: 0, plays: 0, searches: 0, downloads: 0, likes: 0 };
    totalVisits += stat.visits;
    totalPlays += stat.plays;
    totalSearches += stat.searches;
    totalDownloads += stat.downloads;
    totalLikes += stat.likes;
    dailyData.push({
      date: dStr,
      visits: stat.visits,
      plays: stat.plays,
      searches: stat.searches,
    });
  });

  const searchCounts = new Map<string, number>();
  const songCounts = new Map<string, { title: string; artist: string; count: number }>();
  const artistCounts = new Map<string, number>();
  const langCounts = new Map<string, number>();

  serverAnalyticsEvents.forEach((ev) => {
    if (ev.eventType === 'search' && ev.query) {
      const q = String(ev.query).trim();
      searchCounts.set(q, (searchCounts.get(q) || 0) + 1);
    }
    if ((ev.eventType === 'song_play' || ev.eventType === 'like') && ev.songTitle) {
      const key = `${ev.songTitle} - ${ev.songArtist || ''}`;
      const ex = songCounts.get(key) || { title: ev.songTitle, artist: ev.songArtist || '', count: 0 };
      ex.count++;
      songCounts.set(key, ex);
      if (ev.songArtist) {
        artistCounts.set(ev.songArtist, (artistCounts.get(ev.songArtist) || 0) + 1);
      }
    }
    if (ev.language) {
      const l = String(ev.language).trim();
      langCounts.set(l, (langCounts.get(l) || 0) + 1);
    }
  });

  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.json({
    activeUsersCount: serverActiveSessions.size,
    totalVisits: Math.max(totalVisits, serverAnalyticsEvents.filter(e => e.eventType === 'visit').length, 1),
    todayVisits: Math.max(serverDailyStats[todayStr]?.visits || 0, 1),
    songPlays: Math.max(totalPlays, serverAnalyticsEvents.filter(e => e.eventType === 'song_play').length),
    searches: Math.max(totalSearches, serverAnalyticsEvents.filter(e => e.eventType === 'search').length),
    downloads: Math.max(totalDownloads, serverAnalyticsEvents.filter(e => e.eventType === 'download').length),
    likes: Math.max(totalLikes, serverAnalyticsEvents.filter(e => e.eventType === 'like').length),
    dailyData,
    topSearches: Array.from(searchCounts.entries()).map(([query, count]) => ({ query, count })).sort((a, b) => b.count - a.count).slice(0, 10),
    topSongs: Array.from(songCounts.values()).sort((a, b) => b.count - a.count).slice(0, 10),
    topArtists: Array.from(artistCounts.entries()).map(([artist, count]) => ({ artist, count })).sort((a, b) => b.count - a.count).slice(0, 10),
    popularLanguages: Array.from(langCounts.entries()).map(([language, count]) => ({ language, count })).sort((a, b) => b.count - a.count),
    recentEvents: serverAnalyticsEvents.slice(0, 30),
  });
});

// 1. Result & Search API (compatible with cyberboysumanjay/JioSaavnAPI architecture)
app.get(['/result', '/result/', '/api/result', '/api/search', '/api/jiosaavn'], async (req, res) => {
    let query = (req.query.query as string) || '';
    const rawPath = (req.query.path as string) || '';
    const pageParam = parseInt((req.query.page as string) || '1', 10) || 1;
    const languagesParam = (req.query.languages as string || req.query.language as string || '').trim();

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
      
      // Parse allowed languages
      let allowedLangs: string[] = [];
      if (languagesParam && !languagesParam.toLowerCase().includes('all indian languages')) {
        allowedLangs = languagesParam.split(',').map(l => l.trim().toLowerCase()).filter(Boolean);
      }

      // If user specified languages and search query doesn't explicitly mention language, append primary language to target queries
      const targetQueries =
        intent.searchQueries && intent.searchQueries.length > 0
          ? intent.searchQueries
          : [intent.normalizedQuery || query];

      const searchQueriesWithLang: string[] = [];
      for (const tq of targetQueries) {
        searchQueriesWithLang.push(tq);
        if (allowedLangs.length > 0 && !allowedLangs.some(l => tq.toLowerCase().includes(l))) {
          searchQueriesWithLang.push(`${tq} ${allowedLangs[0]}`);
        }
      }

      let allSongs: any[] = [];
      for (const tq of searchQueriesWithLang.slice(0, 6)) {
        const { songs } = await musicManager.search(tq, pageParam);
        if (songs.length > 0) {
          allSongs.push(...songs);
        }
      }

      // Expand catalog if needed
      if (
        pageParam === 1 &&
        (intent.intent === 'artist' ||
          intent.intent === 'movie' ||
          intent.intent === 'album' ||
          intent.intent === 'theme' ||
          intent.intent === 'genre' ||
          intent.intent === 'combination')
      ) {
        const primaryQuery = searchQueriesWithLang[0] || query;
        const { songs: page2List } = await musicManager.search(primaryQuery, 2);
        if (page2List.length > 0) {
          allSongs.push(...page2List);
        }
      }

      if (allSongs.length === 0) {
        const { songs: fallbackSongs } = await musicManager.search(query, pageParam);
        allSongs = fallbackSongs;
      }

      const deduplicatedSongs = scoreAndRankSongs(allSongs, query, intent);

      // STRICT DATA-LEVEL LANGUAGE FILTERING
      let finalSongs = deduplicatedSongs;
      let detectedUnselectedLang = '';

      if (allowedLangs.length > 0) {
        finalSongs = deduplicatedSongs.filter(song => {
          const sLang = (song.language || '').toLowerCase().trim();
          if (!sLang) return true;
          const isAllowed = allowedLangs.some(al => sLang.includes(al) || al.includes(sLang));
          if (!isAllowed && !detectedUnselectedLang) {
            detectedUnselectedLang = song.language || 'Hindi';
          }
          return isAllowed;
        });
      }

      res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=60');
      res.setHeader('X-Context-Label', encodeURIComponent(intent.contextLabel || ''));
      if (detectedUnselectedLang && finalSongs.length === 0) {
        res.setHeader('X-Detected-Language', encodeURIComponent(detectedUnselectedLang));
      }
      res.json(finalSongs);
    } catch (error) {
      console.error('[Search API Error]:', error);
      res.status(500).json({ error: 'Failed to fetch song search results' });
    }
  });

  // 1c. Trending Songs Endpoint with Language Filter, Provider Failover & Deduplication
  app.get(['/api/trending', '/trending'], async (req, res) => {
    try {
      const languagesParam = (req.query.languages as string || '').trim();
      let allowedLangs: string[] = [];

      if (languagesParam && !languagesParam.toLowerCase().includes('all indian languages')) {
        allowedLangs = languagesParam.split(',').map(l => l.trim().toLowerCase()).filter(Boolean);
      }

      const cacheKey = `trending:${allowedLangs.join('_') || 'all'}`;
      const cached = await getPersistentCache<any[]>(cacheKey);
      if (cached && Array.isArray(cached) && cached.length > 0) {
        res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=60');
        res.json(cached);
        return;
      }

      const { songs } = await musicManager.getTrending(allowedLangs);
      const { uniqueSongs } = deduplicateSongs(songs);

      let finalResults = uniqueSongs;
      if (allowedLangs.length > 0) {
        finalResults = uniqueSongs.filter(s => {
          const sLang = (s.language || '').toLowerCase().trim();
          if (!sLang) return true;
          return allowedLangs.some(al => sLang.includes(al) || al.includes(sLang));
        });
      }

      await setPersistentCache(cacheKey, finalResults, 600);

      res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=60');
      res.json(finalResults);
    } catch (error) {
      console.error('[Trending API Error]:', error);
      res.json([]);
    }
  });

  app.get(['/api/suggestions', '/api/autocomplete'], async (req, res) => {
    const query = (req.query.query as string) || '';
    if (!query || !query.trim()) {
      res.json([]);
      return;
    }

    try {
      const languagesParam = (req.query.languages as string || '').trim();
      let allowedLangs: string[] = [];
      if (languagesParam && !languagesParam.toLowerCase().includes('all indian languages')) {
        allowedLangs = languagesParam.split(',').map(l => l.trim().toLowerCase()).filter(Boolean);
      }

      const { songs } = await musicManager.search(query.trim(), 1);
      const { uniqueSongs } = deduplicateSongs(songs);

      let filtered = uniqueSongs;
      if (allowedLangs.length > 0) {
        filtered = uniqueSongs.filter(s => {
          const sLang = (s.language || '').toLowerCase().trim();
          if (!sLang) return true;
          return allowedLangs.some(al => sLang.includes(al) || al.includes(sLang));
        });
      }
      res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=60');
      res.json(filtered.slice(0, 8));
    } catch (error) {
      console.error('[Suggestions API Error]:', error);
      res.json([]);
    }
  });

  // 1d. AI Vibe DJ Playlist Endpoint
  app.post(['/api/vibe-dj', '/vibe-dj'], async (req, res) => {
    try {
      const { prompt, languages } = req.body || {};
      if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
        res.status(400).json({ error: 'Missing prompt parameter' });
        return;
      }
      const playlist = await generateVibeDJPlaylist(
        prompt,
        Array.isArray(languages) ? languages : ['Hindi']
      );
      res.json(playlist);
    } catch (error) {
      console.error('[Vibe DJ API Error]:', error);
      res.status(500).json({ error: 'Failed to generate Vibe DJ playlist' });
    }
  });

  // 1e. AI Personalized Feed Endpoint
  app.post(['/api/personalized-feed', '/personalized-feed'], async (req, res) => {
    try {
      const { recentHistory, languages } = req.body || {};
      const historyList = Array.isArray(recentHistory) ? recentHistory : [];
      const userLangs = Array.isArray(languages) ? languages : ['Hindi'];
      const feed = await generatePersonalizedFeed(historyList, userLangs);
      res.json(feed);
    } catch (error) {
      console.error('[Personalized Feed API Error]:', error);
      res.status(500).json({ error: 'Failed to generate personalized feed' });
    }
  });

  // 1f. AI Smart Queue / Autoplay Endpoint
  app.post(['/api/smart-queue', '/smart-queue'], async (req, res) => {
    try {
      const { currentSong, recentSongs, playedIds, languages } = req.body || {};
      const nextSongs = await generateSmartQueueNext(
        currentSong,
        Array.isArray(recentSongs) ? recentSongs : [],
        Array.isArray(playedIds) ? playedIds : [],
        Array.isArray(languages) ? languages : ['Hindi']
      );
      res.json(nextSongs);
    } catch (error) {
      console.error('[Smart Queue API Error]:', error);
      res.status(500).json({ error: 'Failed to generate smart queue suggestions' });
    }
  });

  // 1g. Voice Command Parser Endpoint
  app.post(['/api/voice-command', '/voice-command'], async (req, res) => {
    try {
      const { transcript } = req.body || {};
      if (!transcript || typeof transcript !== 'string') {
        res.status(400).json({ error: 'Missing transcript' });
        return;
      }
      const parsed = await parseVoiceCommand(transcript);
      res.json(parsed);
    } catch (error) {
      console.error('[Voice Command API Error]:', error);
      res.status(500).json({ error: 'Failed to parse voice command' });
    }
  });

  // 1h. Song Lyrics Metadata Endpoint
  app.get(['/api/lyrics', '/lyrics'], async (req, res) => {
    try {
      const songId = (req.query.id as string) || '';
      const title = (req.query.title as string) || '';
      const artist = (req.query.artist as string) || '';
      const album = (req.query.album as string) || '';
      const durationParam = req.query.duration ? parseFloat(req.query.duration as string) : undefined;

      if (!title && !songId) {
        res.status(400).json({ error: 'Missing title or id parameter' });
        return;
      }

      const lyricsData = await getSongLyrics({
        songId,
        title,
        artist,
        album,
        duration: durationParam,
      });

      if (!lyricsData || (!lyricsData.lyrics && (!lyricsData.syncedLyrics || lyricsData.syncedLyrics.length === 0))) {
        res.status(404).json({ error: 'Lyrics not found for this track' });
        return;
      }

      res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=3600');
      res.json(lyricsData);
    } catch (error) {
      console.error('[Lyrics API Error]:', error);
      res.status(500).json({ error: 'Failed to fetch song lyrics' });
    }
  });

  // Helper to fetch upstream audio with automatic bitrate fallback (320kbps -> 160kbps -> 96kbps -> original)
  async function fetchUpstreamAudio(
    targetUrl: string,
    extraHeaders: Record<string, string> = {}
  ): Promise<{ response: Response; finalUrl: string } | null> {
    const urlsToTry: string[] = [targetUrl];

    if (targetUrl.includes('_320.mp4')) {
      urlsToTry.push(targetUrl.replace('_320.mp4', '_160.mp4'));
      urlsToTry.push(targetUrl.replace('_320.mp4', '_96.mp4'));
      urlsToTry.push(targetUrl.replace('_320.mp4', '_128.mp4'));
    } else if (targetUrl.includes('_160.mp4')) {
      urlsToTry.push(targetUrl.replace('_160.mp4', '_96.mp4'));
    }

    const defaultHeaders = {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Referer': 'https://www.jiosaavn.com/',
      'Accept': '*/*',
      ...extraHeaders,
    };

    for (const url of urlsToTry) {
      try {
        console.log(`[AUDIO Proxy] Attempting upstream fetch: ${url}`);
        const response = await fetch(url, {
          headers: defaultHeaders,
          redirect: 'follow',
        });

        if (response.ok || response.status === 206) {
          const contentType = (response.headers.get('content-type') || '').toLowerCase();
          if (!contentType.includes('text/html') && !contentType.includes('application/json')) {
            console.log(`[AUDIO Proxy] Upstream fetch succeeded (${response.status}): ${url}`);
            return { response, finalUrl: url };
          }
        }
        console.warn(`[AUDIO Proxy] Upstream URL status ${response.status} or invalid content-type (${response.headers.get('content-type')}) for: ${url}`);
      } catch (err: any) {
        console.error(`[AUDIO Proxy] Upstream fetch exception for ${url}:`, err?.message || err);
      }
    }

    return null;
  }

  // 2. Audio Stream Proxy Endpoint with HTTP Range support & direct download proxy
  app.get('/api/audio', async (req, res) => {
    const rawUrl = req.query.url as string;
    if (!rawUrl) {
      res.status(400).json({ error: 'Missing url parameter' });
      return;
    }

    let targetUrl = '';
    try {
      targetUrl = decodeURIComponent(rawUrl);
    } catch (e) {
      targetUrl = rawUrl;
    }

    const isDownload = req.query.download === 'true';
    const filenameParam = (req.query.filename as string) || 'song.mp3';

    try {
      const parsedUrl = new URL(targetUrl);
      if (!isHostAllowed(parsedUrl.hostname)) {
        console.warn(`[AUDIO Proxy] Blocked request to host: ${parsedUrl.hostname}`);
        res.status(403).json({ error: `Host not permitted: ${parsedUrl.hostname}` });
        return;
      }

      const rangeHeader = req.headers.range as string | undefined;

      // Non-ranged full download OR non-ranged stream
      if (isDownload || !rangeHeader) {
        const upstream = await fetchUpstreamAudio(targetUrl);
        if (!upstream) {
          console.error(`[AUDIO Proxy] All upstream URLs failed for: ${targetUrl}`);
          res.status(502).json({ error: 'Audio source unavailable' });
          return;
        }

        const { response: upRes } = upstream;
        const rawContentType = upRes.headers.get('content-type') || '';
        const contentType =
          rawContentType && (rawContentType.startsWith('audio/') || rawContentType.startsWith('video/'))
            ? rawContentType
            : 'audio/mpeg';

        res.status(200);
        res.setHeader('Content-Type', contentType);
        const contentLength = upRes.headers.get('content-length');
        if (contentLength) res.setHeader('Content-Length', contentLength);
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        if (isDownload) {
          res.setHeader(
            'Content-Disposition',
            `attachment; filename="${encodeURIComponent(filenameParam)}"`
          );
        }

        if (upRes.body) {
          const reader = upRes.body.getReader();
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            res.write(Buffer.from(value));
          }
          res.end();
        } else {
          const arrayBuffer = await upRes.arrayBuffer();
          res.send(Buffer.from(arrayBuffer));
        }
        return;
      }

      // Range request handling
      const extraHeaders: Record<string, string> = { Range: rangeHeader };
      const upstream = await fetchUpstreamAudio(targetUrl, extraHeaders);

      if (!upstream) {
        console.error(`[AUDIO Proxy] Upstream range request failed for: ${targetUrl}`);
        res.status(502).json({ error: 'Audio source unavailable' });
        return;
      }

      const { response: upRes } = upstream;
      const status = upRes.status === 206 ? 206 : 200;
      const rawContentType = upRes.headers.get('content-type') || '';
      const contentType =
        rawContentType && (rawContentType.startsWith('audio/') || rawContentType.startsWith('video/'))
          ? rawContentType
          : 'audio/mpeg';

      const contentLength = upRes.headers.get('content-length');
      const contentRange = upRes.headers.get('content-range');

      res.status(status);
      res.setHeader('Content-Type', contentType);
      if (contentLength) res.setHeader('Content-Length', contentLength);
      if (contentRange) res.setHeader('Content-Range', contentRange);
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');

      if (upRes.body) {
        const reader = upRes.body.getReader();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          res.write(Buffer.from(value));
        }
        res.end();
      } else {
        const arrayBuffer = await upRes.arrayBuffer();
        res.send(Buffer.from(arrayBuffer));
      }
      return;
    } catch (error: any) {
      console.error('[AUDIO Proxy Error]:', error?.message || error);
      res.status(502).json({ error: 'Failed to stream audio file' });
    }
  });

async function startServer() {
  // Vite middleware for dev / static server for standalone production
  if (!process.env.NETLIFY && !process.env.AWS_LAMBDA_FUNCTION_NAME && !process.env.LAMBDA_TASK_ROOT && !process.env.IS_NETLIFY_FUNCTION) {
    if (process.env.NODE_ENV !== 'production') {
      const { createServer: createViteServer } = await import('vite');
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
}

const isMainScript =
  Boolean(process.argv[1]) &&
  (process.argv[1].endsWith('/server.ts') ||
   process.argv[1].endsWith('/server.cjs') ||
   process.argv[1].endsWith('\\server.ts') ||
   process.argv[1].endsWith('\\server.cjs'));

if (isMainScript && !process.env.NETLIFY && !process.env.AWS_LAMBDA_FUNCTION_NAME && !process.env.LAMBDA_TASK_ROOT && !process.env.IS_NETLIFY_FUNCTION) {
  startServer();
}

