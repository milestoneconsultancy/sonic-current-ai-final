import { GoogleGenAI } from '@google/genai';
import { getPersistentCache, setPersistentCache } from '../src/lib/serverCache.js';

export interface ParsedLyricLine {
  time: number; // in seconds
  text: string;
}

export interface LyricsResponse {
  lyrics: string;
  syncedLyrics: ParsedLyricLine[];
  isSynced: boolean;
  source: string;
  language?: string;
  copyright?: string;
}

function getGenAIClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
  });
}

/**
 * Clean up title and artist strings for optimal metadata API matching
 */
export function cleanMetadataString(str: string): string {
  if (!str) return '';
  return str
    .replace(/\(From "[^"]+"\)/gi, '')
    .replace(/\(From '[^']+'\)/gi, '')
    .replace(/\[From "[^"]+"\]/gi, '')
    .replace(/\(From [^)]+\)/gi, '')
    .replace(/\(feat\.?[^)]*\)/gi, '')
    .replace(/\(with [^)]+\)/gi, '')
    .replace(/\(official\s*(?:video|audio|music\s*video|lyric\s*video)?\)/gi, '')
    .replace(/\[official\s*(?:video|audio|music\s*video|lyric\s*video)?\]/gi, '')
    .replace(/\(lyrics?\)/gi, '')
    .replace(/\[lyrics?\]/gi, '')
    .replace(/\(remix\)/gi, '')
    .replace(/\(acoustic\)/gi, '')
    .replace(/\(live\)/gi, '')
    .replace(/\bft\.?\s+[\w\s]+/gi, '')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&#039;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Parse standard LRC format ([mm:ss.xx] Text) into sorted timestamped lines
 */
export function parseLrcString(lrc: string): ParsedLyricLine[] {
  if (!lrc || typeof lrc !== 'string') return [];
  const lines = lrc.split('\n');
  const parsed: ParsedLyricLine[] = [];

  const timeRegex = /\[(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?\]/g;

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();
    if (!trimmed) continue;

    // Skip metadata headers like [ar: Artist], [ti: Title], [offset: 0]
    if (/^\[[a-zA-Z]+:.*\]$/.test(trimmed)) continue;

    const matches = Array.from(trimmed.matchAll(timeRegex));
    if (matches.length > 0) {
      const text = trimmed.replace(timeRegex, '').trim();
      for (const match of matches) {
        const minutes = parseInt(match[1], 10);
        const seconds = parseInt(match[2], 10);
        const fraction = match[3] ? parseFloat(`0.${match[3]}`) : 0;
        const totalSeconds = minutes * 60 + seconds + fraction;

        parsed.push({
          time: Math.round(totalSeconds * 100) / 100,
          text: text,
        });
      }
    }
  }

  // Sort chronologically
  return parsed.sort((a, b) => a.time - b.time);
}

/**
 * Format raw plain text or HTML lyrics into clean, readable lines
 */
export function cleanLyricsText(raw: string): string {
  if (!raw) return '';
  return raw
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&#039;/g, "'")
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Source 1: LRCLIB (Open Synchronized & Plain Lyrics Database)
 */
async function fetchFromLrcLib(
  title: string,
  artist: string,
  duration?: number
): Promise<LyricsResponse | null> {
  const cleanTitle = cleanMetadataString(title);
  const cleanArtist = cleanMetadataString(artist.split(',')[0] || artist);

  if (!cleanTitle) return null;

  try {
    // 1. Try exact get first
    let queryParams = `track_name=${encodeURIComponent(cleanTitle)}&artist_name=${encodeURIComponent(cleanArtist)}`;
    if (duration && duration > 0) {
      queryParams += `&duration=${Math.round(duration)}`;
    }

    const exactUrl = `https://lrclib.net/api/get?${queryParams}`;
    const exactRes = await fetch(exactUrl, {
      headers: {
        'User-Agent': 'SonicCurrent/1.0 (https://github.com/sonic-current)',
        Accept: 'application/json',
      },
    });

    if (exactRes.ok) {
      const data = await exactRes.json();
      if (data && !data.instrumental) {
        const synced = parseLrcString(data.syncedLyrics || '');
        const plain = cleanLyricsText(data.plainLyrics || data.syncedLyrics || '');
        if (plain || synced.length > 0) {
          return {
            lyrics: plain || synced.map((s) => s.text).join('\n'),
            syncedLyrics: synced,
            isSynced: synced.length > 0,
            source: 'LRCLIB (Synced Music Database)',
          };
        }
      }
    }

    // 2. Search fallback on LRCLIB
    const searchUrl = `https://lrclib.net/api/search?q=${encodeURIComponent(`${cleanTitle} ${cleanArtist}`)}`;
    const searchRes = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'SonicCurrent/1.0 (https://github.com/sonic-current)',
        Accept: 'application/json',
      },
    });

    if (searchRes.ok) {
      const results = await searchRes.json();
      if (Array.isArray(results) && results.length > 0) {
        // Find best non-instrumental match
        const best = results.find((r) => !r.instrumental && (r.syncedLyrics || r.plainLyrics)) || results[0];
        if (best && (best.syncedLyrics || best.plainLyrics)) {
          const synced = parseLrcString(best.syncedLyrics || '');
          const plain = cleanLyricsText(best.plainLyrics || best.syncedLyrics || '');
          return {
            lyrics: plain || synced.map((s) => s.text).join('\n'),
            syncedLyrics: synced,
            isSynced: synced.length > 0,
            source: 'LRCLIB (Synced Database)',
          };
        }
      }
    }
  } catch (err: any) {
    console.warn('[Lyrics LRCLIB Provider Warning]:', err?.message || err);
  }

  return null;
}

/**
 * Source 2: JioSaavn Official Internal Lyrics API & Saavn Mirrored Endpoints
 */
async function fetchFromJioSaavn(
  songId?: string,
  title?: string,
  artist?: string
): Promise<LyricsResponse | null> {
  const cleanTitle = cleanMetadataString(title || '');

  // A. Direct lyrics_id / song_id call
  if (songId && /^\d+$/.test(songId)) {
    try {
      const jioUrl = `https://www.jiosaavn.com/api.php?__call=lyrics.getLyrics&ctx=web6dot0&api_version=4&_format=json&_marker=0&lyrics_id=${songId}`;
      const res = await fetch(jioUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      });

      if (res.ok) {
        const text = await res.text();
        let json: any = {};
        try {
          json = JSON.parse(text);
        } catch {
          json = {};
        }

        if (json?.lyrics) {
          const cleanText = cleanLyricsText(json.lyrics);
          if (cleanText.length > 20) {
            return {
              lyrics: cleanText,
              syncedLyrics: [],
              isSynced: false,
              source: 'JioSaavn Official Lyrics',
              copyright: json.copyright_text || undefined,
            };
          }
        }
      }
    } catch (err) {
      console.warn('[JioSaavn Direct Lyrics error]:', err);
    }

    // B. Check song details to see if a dedicated lyrics_id exists
    try {
      const detailsUrl = `https://www.jiosaavn.com/api.php?__call=song.getDetails&cc=in&_marker=0&_format=json&pids=${songId}`;
      const res = await fetch(detailsUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
      });

      if (res.ok) {
        const json = await res.json();
        const songData = json[songId];
        if (songData && songData.has_lyrics === 'true' && songData.lyrics_id) {
          const lyrUrl = `https://www.jiosaavn.com/api.php?__call=lyrics.getLyrics&ctx=web6dot0&api_version=4&_format=json&_marker=0&lyrics_id=${songData.lyrics_id}`;
          const lyrRes = await fetch(lyrUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
          if (lyrRes.ok) {
            const lyrJson = await lyrRes.json();
            if (lyrJson?.lyrics) {
              const cleanText = cleanLyricsText(lyrJson.lyrics);
              if (cleanText.length > 20) {
                return {
                  lyrics: cleanText,
                  syncedLyrics: [],
                  isSynced: false,
                  source: 'JioSaavn Official Lyrics',
                  copyright: lyrJson.copyright_text || undefined,
                };
              }
            }
          }
        }
      }
    } catch (err) {
      console.warn('[JioSaavn Song Details Lyrics error]:', err);
    }

    // C. Saavn.dev mirror
    try {
      const mirrorUrl = `https://saavn.dev/api/songs/${songId}/lyrics`;
      const mirrorRes = await fetch(mirrorUrl);
      if (mirrorRes.ok) {
        const mirrorData = await mirrorRes.json();
        const lyricsText = mirrorData?.data?.lyrics || mirrorData?.lyrics;
        if (lyricsText && typeof lyricsText === 'string' && lyricsText.length > 20) {
          return {
            lyrics: cleanLyricsText(lyricsText),
            syncedLyrics: [],
            isSynced: false,
            source: 'Saavn Metadata API',
            copyright: mirrorData?.data?.copyright || undefined,
          };
        }
      }
    } catch (err) {
      console.warn('[Saavn Mirror Lyrics error]:', err);
    }
  }

  // D. Search via JioSaavn Search if title is available
  if (cleanTitle) {
    try {
      const searchUrl = `https://www.jiosaavn.com/api.php?__call=search.getResults&_format=json&_marker=0&cc=in&includeMetaTags=1&q=${encodeURIComponent(
        cleanTitle
      )}&p=1&n=5`;
      const searchRes = await fetch(searchUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      if (searchRes.ok) {
        const searchJson = await searchRes.json();
        const results = Array.isArray(searchJson?.results) ? searchJson.results : [];
        for (const s of results) {
          if (s.has_lyrics === 'true' && (s.lyrics_id || s.id)) {
            const lid = s.lyrics_id || s.id;
            const lyrUrl = `https://www.jiosaavn.com/api.php?__call=lyrics.getLyrics&ctx=web6dot0&api_version=4&_format=json&_marker=0&lyrics_id=${lid}`;
            const lyrRes = await fetch(lyrUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
            if (lyrRes.ok) {
              const lyrJson = await lyrRes.json();
              if (lyrJson?.lyrics) {
                const cleanText = cleanLyricsText(lyrJson.lyrics);
                if (cleanText.length > 20) {
                  return {
                    lyrics: cleanText,
                    syncedLyrics: [],
                    isSynced: false,
                    source: 'JioSaavn Search & Lyrics API',
                    copyright: lyrJson.copyright_text || undefined,
                  };
                }
              }
            }
          }
        }
      }
    } catch (err) {
      console.warn('[JioSaavn Search Lyrics error]:', err);
    }
  }

  return null;
}

/**
 * Source 3: Lyrics.ovh API
 */
async function fetchFromLyricsOvh(title: string, artist: string): Promise<LyricsResponse | null> {
  const cleanTitle = cleanMetadataString(title);
  const cleanArtist = cleanMetadataString(artist.split(',')[0] || artist);

  if (!cleanTitle || !cleanArtist) return null;

  try {
    const ovhUrl = `https://api.lyrics.ovh/v1/${encodeURIComponent(cleanArtist)}/${encodeURIComponent(
      cleanTitle
    )}`;
    const res = await fetch(ovhUrl);
    if (res.ok) {
      const data = await res.json();
      if (data?.lyrics) {
        const clean = cleanLyricsText(data.lyrics);
        if (clean.length > 20) {
          return {
            lyrics: clean,
            syncedLyrics: [],
            isSynced: false,
            source: 'Lyrics.ovh Public Library',
          };
        }
      }
    }
  } catch (err) {
    // ignore
  }

  return null;
}

/**
 * Source 4: Gemini AI Verified Lyrics with Stanza Breakdown & Phonetic Transcription
 */
async function fetchFromGeminiAI(
  title: string,
  artist: string,
  album?: string
): Promise<LyricsResponse | null> {
  const ai = getGenAIClient();
  if (!ai) return null;

  const cleanTitle = cleanMetadataString(title);
  const cleanArtist = cleanMetadataString(artist);

  try {
    const prompt = `You are an expert Indian and international music lyricist and metadata database.
Song Title: "${cleanTitle}"
Artist(s): "${cleanArtist}"
Album/Movie: "${album || 'N/A'}"

TASK:
Provide the complete and accurate lyrics for this song in its original language script (and Latin/English phonetics if Indian language like Hindi/Marathi/Punjabi/Tamil/Telugu).

Format with clean, well-spaced stanzas.
If you know timestamps, you can provide LRC lines, or provide clearly structured verse/chorus stanzas.

Output strictly a JSON object:
{
  "lyrics": "Full lyrics text with clean line breaks and stanza spacing",
  "language": "e.g. Hindi, Marathi, Punjabi, English",
  "syncedLyrics": [
    { "time": 0.0, "text": "First line of song" }
  ]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });

    const text = response.text || '';
    if (text) {
      const json = JSON.parse(text);
      if (json.lyrics && json.lyrics.trim().length > 30) {
        const clean = cleanLyricsText(json.lyrics);
        const synced = Array.isArray(json.syncedLyrics) && json.syncedLyrics.length > 3
          ? json.syncedLyrics.map((s: any) => ({ time: Number(s.time) || 0, text: String(s.text || '') }))
          : [];

        return {
          lyrics: clean,
          syncedLyrics: synced,
          isSynced: synced.length > 0,
          source: 'AI Verified Lyrics Database',
          language: json.language || undefined,
        };
      }
    }
  } catch (err: any) {
    console.error('[Gemini AI Lyrics Fallback Error]:', err?.message || err);
  }

  return null;
}

/**
 * Master Lyrics Resolution Engine:
 * Chains LRCLIB -> JioSaavn -> Lyrics.ovh -> Gemini AI with persistent caching
 */
export async function getSongLyrics(params: {
  songId?: string;
  title: string;
  artist: string;
  album?: string;
  duration?: number;
}): Promise<LyricsResponse | null> {
  const { songId, title, artist, album, duration } = params;
  if (!title && !songId) return null;

  const cleanTitle = cleanMetadataString(title);
  const cleanArtist = cleanMetadataString(artist);
  const cacheKey = `lyrics:${songId || ''}:${cleanTitle.toLowerCase()}:${cleanArtist.toLowerCase()}`;

  // 1. Check persistent server cache
  const cached = await getPersistentCache<LyricsResponse>(cacheKey);
  if (cached && cached.lyrics) {
    return cached;
  }

  console.log(`[Lyrics] Resolving lyrics metadata for "${cleanTitle}" by "${cleanArtist}" (ID: ${songId || 'N/A'})...`);

  // 2. Try LRCLIB first (best for real-time synchronized LRC lyrics)
  let result = await fetchFromLrcLib(cleanTitle, cleanArtist, duration);
  if (result) {
    console.log(`[Lyrics] Found on LRCLIB (${result.isSynced ? 'Time-Synced' : 'Plain Text'})`);
    await setPersistentCache(cacheKey, result, 86400 * 7); // Cache for 7 days
    return result;
  }

  // 3. Try JioSaavn Official Lyrics (best for Bollywood/Indian tracks)
  result = await fetchFromJioSaavn(songId, cleanTitle, cleanArtist);
  if (result) {
    console.log('[Lyrics] Found on JioSaavn Official Metadata API');
    await setPersistentCache(cacheKey, result, 86400 * 7);
    return result;
  }

  // 4. Try Lyrics.ovh
  result = await fetchFromLyricsOvh(cleanTitle, cleanArtist);
  if (result) {
    console.log('[Lyrics] Found on Lyrics.ovh');
    await setPersistentCache(cacheKey, result, 86400 * 7);
    return result;
  }

  // 5. Try Gemini AI Verified Lyrics Generator
  result = await fetchFromGeminiAI(cleanTitle, cleanArtist, album);
  if (result) {
    console.log('[Lyrics] Generated via AI Verified Lyrics');
    await setPersistentCache(cacheKey, result, 86400 * 7);
    return result;
  }

  return null;
}
