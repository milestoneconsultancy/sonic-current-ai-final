import { GoogleGenAI } from '@google/genai';
import { getPersistentCache, setPersistentCache } from '../src/lib/serverCache.js';
import { MultiProviderMusicManager } from '../src/lib/providers/MusicProvider.js';
import { PrimaryJioSaavnProvider, SecondaryJioSaavnProvider } from '../src/lib/providers/JioSaavnProvider.js';
import { deduplicateSongs } from '../src/lib/dedupe.js';

const musicManager = new MultiProviderMusicManager([
  new PrimaryJioSaavnProvider(),
  new SecondaryJioSaavnProvider(),
]);

function getGenAIClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
  });
}

/**
 * 2.1 AI Mood / Vibe DJ
 * Parses user prompt in any Indian language / Hinglish / Roman Marathi / Roman Punjabi and generates
 * a themed, ranked, deduplicated playlist with a short 1-line AI reason for each track.
 */
export async function generateVibeDJPlaylist(prompt: string, languages: string[] = ['Hindi']) {
  const cleanPrompt = prompt.trim();
  const cacheKey = `vibe_dj:${cleanPrompt.toLowerCase()}:${languages.join('_')}`;

  const cached = await getPersistentCache<any>(cacheKey);
  if (cached) return cached;

  const ai = getGenAIClient();
  let searchQueries = [cleanPrompt];
  let playlistTitle = `Vibe DJ • ${cleanPrompt}`;
  let playlistDescription = `Custom AI playlist tuned for "${cleanPrompt}"`;
  let songReasonsMap: Record<string, string> = {};

  if (ai) {
    try {
      const geminiPromise = ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: `You are the AI VIBE DJ for Free Music Wala (Sonic Current player).
User described their mood / activity / vibe: "${cleanPrompt}".
Selected User Languages: ${languages.join(', ')}.

TASK:
1. Understand the prompt in English, Hindi, Marathi, Hinglish, Roman Marathi, Roman Punjabi (e.g., "sad ghalvaycha mood aahe", "gym sathi energetic songs", "rain madhe chill songs", "dosti wale gaane").
2. Generate a catchy short playlist title (e.g. "Monsoon Chill Vibrations 🌧️", "High Energy Gym Beast ⚡", "Dil Ki Baat • Sad Hits 💔").
3. Generate a 1-sentence vibe description.
4. Provide 3-4 distinct search query strategies to fetch 15-20 relevant real songs from Indian music catalog.
5. Create a general reason formula/template for song picks (e.g. "Upbeat rhythm + energetic vocals fits your gym workout mood").

Return strictly JSON:
{
  "playlistTitle": "string",
  "playlistDescription": "string",
  "searchQueries": ["string"],
  "vibeReason": "string"
}`,
        config: { responseMimeType: 'application/json' },
      });

      const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Vibe DJ Gemini timeout')), 2800)
      );

      const res: any = await Promise.race([geminiPromise, timeout]);
      const json = JSON.parse(res.text || '{}');

      if (json.playlistTitle) playlistTitle = json.playlistTitle;
      if (json.playlistDescription) playlistDescription = json.playlistDescription;
      if (Array.isArray(json.searchQueries) && json.searchQueries.length > 0) {
        searchQueries = json.searchQueries;
      }
      if (json.vibeReason) {
        songReasonsMap['default'] = json.vibeReason;
      }
    } catch (err: any) {
      console.warn('[Vibe DJ Gemini Fallback]:', err?.message || err);
    }
  }

  // Fetch real songs from music manager using search queries
  let rawSongs: any[] = [];
  for (const q of searchQueries.slice(0, 4)) {
    const { songs } = await musicManager.search(q, 1);
    if (songs.length > 0) rawSongs.push(...songs);
  }

  if (rawSongs.length === 0) {
    const { songs } = await musicManager.search(cleanPrompt, 1);
    rawSongs = songs;
  }

  // Language filter if requested
  if (languages.length > 0 && !languages.map(l => l.toLowerCase()).includes('all indian languages')) {
    const allowed = languages.map(l => l.toLowerCase());
    const filtered = rawSongs.filter(s => {
      const sLang = (s.language || '').toLowerCase().trim();
      return !sLang || allowed.some(a => sLang.includes(a) || a.includes(sLang));
    });
    if (filtered.length >= 4) rawSongs = filtered;
  }

  const { uniqueSongs } = deduplicateSongs(rawSongs);

  // Attach whyPicked reasons
  const finalSongs = uniqueSongs.slice(0, 20).map((song, idx) => {
    const defaultReason = songReasonsMap['default'] || `Handpicked for your "${cleanPrompt}" vibe`;
    return {
      ...song,
      whyPicked: `${defaultReason} • Matches ${song.artist || 'featured artist'} tone`,
    };
  });

  const result = {
    title: playlistTitle,
    description: playlistDescription,
    prompt: cleanPrompt,
    songs: finalSongs,
  };

  await setPersistentCache(cacheKey, result, 1800);
  return result;
}

/**
 * 2.4 AI-personalized Home Feed
 * Generates custom "Made for You" sections based on anonymous session listening history.
 */
export async function generatePersonalizedFeed(recentHistory: any[], languages: string[] = ['Hindi']) {
  const historyKey = recentHistory
    .slice(0, 5)
    .map(s => `${s.title || s.song}:${s.artist}`)
    .join('|');
  const cacheKey = `personalized_feed:${historyKey}:${languages.join('_')}`;

  const cached = await getPersistentCache<any>(cacheKey);
  if (cached) return cached;

  const ai = getGenAIClient();
  let sections = [
    {
      title: 'Made For You • Recommended Hits',
      reason: "Based on songs you've played recently",
      query: recentHistory[0]?.artist ? `${recentHistory[0].artist} hits` : 'trending hindi songs',
    },
  ];

  if (ai && recentHistory.length > 0) {
    try {
      const historySummary = recentHistory
        .slice(0, 8)
        .map(s => `"${s.title || s.song}" by ${s.artist} (${s.language || 'Hindi'})`)
        .join(', ');

      const geminiPromise = ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: `You are the PERSONALIZATION ENGINE for Free Music Wala player.
User's Recent Listening History: [${historySummary}].
User Languages: ${languages.join(', ')}.

TASK:
Create 2 distinct, highly tailored recommendation sections. For each section:
1. "title": Catchy title (e.g., "Because You Listened to Arijit Singh 🎤", "90s Retro Romance Mix 💖", "Marathi Beats For You 🥁").
2. "reason": Short 1-sentence blurb explaining why this was picked for the user.
3. "query": 1 target search query to fetch songs from catalog.

Return strictly JSON array:
[
  { "title": "string", "reason": "string", "query": "string" }
]`,
        config: { responseMimeType: 'application/json' },
      });

      const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Personalization Gemini timeout')), 2800)
      );

      const res: any = await Promise.race([geminiPromise, timeout]);
      const json = JSON.parse(res.text || '[]');
      if (Array.isArray(json) && json.length > 0) {
        sections = json;
      }
    } catch (err: any) {
      console.warn('[Personalized Feed Gemini Fallback]:', err?.message || err);
    }
  }

  // Fetch real songs for each section
  const filledSections = [];
  for (const sec of sections) {
    const { songs } = await musicManager.search(sec.query, 1);
    const { uniqueSongs } = deduplicateSongs(songs);
    const songsWithReason = uniqueSongs.slice(0, 12).map(s => ({
      ...s,
      whyPicked: sec.reason,
    }));

    if (songsWithReason.length > 0) {
      filledSections.push({
        title: sec.title,
        reason: sec.reason,
        songs: songsWithReason,
      });
    }
  }

  await setPersistentCache(cacheKey, filledSections, 1800);
  return filledSections;
}

/**
 * 2.6 AI Smart Queue / Autoplay
 * Recommends next songs when queue ends or autoplay triggers.
 */
export async function generateSmartQueueNext(
  currentSong: any,
  recentSongs: any[],
  playedIds: string[] = [],
  languages: string[] = ['Hindi']
) {
  if (!currentSong) return [];

  const ai = getGenAIClient();
  let targetQueries = [`songs like ${currentSong.title || currentSong.song}`, `${currentSong.artist} hits`];

  if (ai) {
    try {
      const recentArtist = currentSong.artist || '';
      const recentTitle = currentSong.title || currentSong.song || '';

      const geminiPromise = ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: `You are the SMART AUTOPLAY QUEUE ENGINE for Free Music Wala.
Current playing song: "${recentTitle}" by ${recentArtist} (${currentSong.language || 'Hindi'}).
User recent songs: ${recentSongs.map(s => s.title || s.song).slice(0, 3).join(', ')}.

Generate 2-3 search queries to find the next seamlessly matching songs (preserving mood, genre, artist continuity).

Return strictly JSON:
{ "queries": ["string"] }`,
        config: { responseMimeType: 'application/json' },
      });

      const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Smart Queue Gemini timeout')), 2800)
      );

      const res: any = await Promise.race([geminiPromise, timeout]);
      const json = JSON.parse(res.text || '{}');
      if (Array.isArray(json.queries) && json.queries.length > 0) {
        targetQueries = json.queries;
      }
    } catch (err: any) {
      console.warn('[Smart Queue Gemini Fallback]:', err?.message || err);
    }
  }

  let candidates: any[] = [];
  for (const q of targetQueries.slice(0, 3)) {
    const { songs } = await musicManager.search(q, 1);
    candidates.push(...songs);
  }

  // Filter out already played songs
  const seenSet = new Set(playedIds.map(String));
  const unplayed = candidates.filter(s => !seenSet.has(String(s.id)));

  const { uniqueSongs } = deduplicateSongs(unplayed);
  return uniqueSongs.slice(0, 8).map(s => ({
    ...s,
    whyPicked: `Smart Autoplay • Fits flow after "${currentSong.title || currentSong.song}"`,
  }));
}

/**
 * 2.2 Voice Commands Parser
 * Parses spoken text in any language into playback action or search intent.
 */
export async function parseVoiceCommand(transcript: string) {
  const norm = transcript.trim().toLowerCase();

  // Quick local playback command rules
  if (norm.includes('pause') || norm.includes('rok') || norm.includes('thamba') || norm.includes('stop')) {
    return { type: 'playback', action: 'pause' };
  }
  if (norm.includes('play') || norm.includes('chalu kar') || norm.includes('chalao') || norm.includes('suru kar')) {
    if (norm === 'play' || norm === 'play music' || norm === 'gana chalao' || norm === 'chalu kar') {
      return { type: 'playback', action: 'play' };
    }
  }
  if (norm.includes('next') || norm.includes('agla') || norm.includes('pudhcha') || norm.includes('change')) {
    return { type: 'playback', action: 'next' };
  }
  if (norm.includes('previous') || norm.includes('pichhla') || norm.includes('magsa')) {
    return { type: 'playback', action: 'previous' };
  }
  if (norm.includes('similar') || norm.includes('milte julte') || norm.includes('yasaarkhi')) {
    return { type: 'playback', action: 'similar' };
  }

  // Default to search / vibe DJ query
  return { type: 'search', query: transcript.trim() };
}
