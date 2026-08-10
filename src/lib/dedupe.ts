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

export function getCanonicalSongKey(song: Partial<Song>): { id: string; pairKey: string } {
  const id = String(song.id || '').trim();
  const cleanTitle = normalizeText(song.title || '');
  const cleanArtist = normalizePrimaryArtist(song.artist || '');
  const pairKey = `${cleanTitle}::${cleanArtist}`;
  return { id, pairKey };
}

export function deduplicateSongs(
  songs: Song[],
  existingSeen?: { ids: Set<string>; pairs: Set<string> }
): {
  uniqueSongs: Song[];
  seenIds: Set<string>;
  seenPairs: Set<string>;
} {
  const seenIds = existingSeen?.ids ? new Set(existingSeen.ids) : new Set<string>();
  const seenPairs = existingSeen?.pairs ? new Set(existingSeen.pairs) : new Set<string>();
  const uniqueSongs: Song[] = [];

  for (const song of songs) {
    if (!song || (!song.id && !song.title)) continue;
    const { id, pairKey } = getCanonicalSongKey(song);

    if (id && seenIds.has(id)) continue;
    if (pairKey && pairKey.length > 4 && seenPairs.has(pairKey)) continue;

    if (id) seenIds.add(id);
    if (pairKey && pairKey.length > 4) seenPairs.add(pairKey);

    uniqueSongs.push(song);
  }

  return { uniqueSongs, seenIds, seenPairs };
}
