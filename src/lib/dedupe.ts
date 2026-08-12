import { Song } from '../types';

export function normalizeText(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/\s*[\(\[\{].*?[\)\]\}]/g, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

export function normalizePrimaryArtist(artist: string): string {
  if (!artist) return '';
  const primary = artist.split(/,|&|\band\b|\bft\b|\bfeat\b/i)[0] || '';
  return normalizeText(primary);
}

export function getCanonicalSongKey(song: any): { id: string; pairKey: string } {
  const id = String(song?.id || '').trim();
  const rawTitle = song?.title || song?.song || '';
  const rawArtist = song?.artist || song?.singers || song?.primary_artists || '';
  const cleanTitle = normalizeText(rawTitle);
  const cleanArtist = normalizePrimaryArtist(rawArtist);
  const pairKey = `${cleanTitle}::${cleanArtist}`;
  return { id, pairKey };
}

export function deduplicateSongs<T = any>(
  songs: T[],
  existingSeen?: { ids: Set<string>; pairs: Set<string> }
): {
  uniqueSongs: T[];
  seenIds: Set<string>;
  seenPairs: Set<string>;
} {
  const seenIds = existingSeen?.ids ? new Set(existingSeen.ids) : new Set<string>();
  const seenPairs = existingSeen?.pairs ? new Set(existingSeen.pairs) : new Set<string>();
  const uniqueSongs: T[] = [];

  for (const song of songs) {
    if (!song) continue;
    const { id, pairKey } = getCanonicalSongKey(song);

    if (id && seenIds.has(id)) continue;
    if (pairKey && pairKey.length > 4 && seenPairs.has(pairKey)) continue;

    if (id) seenIds.add(id);
    if (pairKey && pairKey.length > 4) seenPairs.add(pairKey);

    uniqueSongs.push(song);
  }

  return { uniqueSongs, seenIds, seenPairs };
}

/**
 * Asserts whether a song list contains duplicates. Throws Error if duplicate found.
 */
export function verifyNoDuplicates<T = any>(songs: T[], contextName: string = 'SongList'): void {
  const seenIds = new Set<string>();
  const seenPairs = new Set<string>();

  for (const song of songs) {
    if (!song) continue;
    const { id, pairKey } = getCanonicalSongKey(song);

    if (id && seenIds.has(id)) {
      throw new Error(`[Dedupe Violation in ${contextName}] Duplicate Song ID found: "${id}"`);
    }
    if (pairKey && pairKey.length > 4 && seenPairs.has(pairKey)) {
      throw new Error(`[Dedupe Violation in ${contextName}] Duplicate Title+Artist pair found: "${pairKey}"`);
    }

    if (id) seenIds.add(id);
    if (pairKey && pairKey.length > 4) seenPairs.add(pairKey);
  }
}
