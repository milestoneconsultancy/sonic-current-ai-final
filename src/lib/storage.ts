import { Song, SearchHistoryItem, RecentlyPlayedItem, RepeatMode } from '../types';

const FAVORITES_KEY = 'sonic_current_favorites';
const SEARCH_HISTORY_KEY = 'sonic_current_search_history';
const RECENTLY_PLAYED_KEY = 'sonic_current_recently_played';
const PLAYER_SETTINGS_KEY = 'sonic_current_player_settings';

// --- FAVORITES ---
export function getFavorites(): Song[] {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('Error reading favorites from localStorage', err);
    return [];
  }
}

export function isFavorite(songId: string): boolean {
  const list = getFavorites();
  return list.some((s) => s.id === songId);
}

export function toggleFavorite(song: Song): boolean {
  const list = getFavorites();
  const existsIndex = list.findIndex((s) => s.id === song.id);
  let isFavNow = false;

  if (existsIndex >= 0) {
    list.splice(existsIndex, 1);
    isFavNow = false;
  } else {
    list.unshift(song);
    isFavNow = true;
  }

  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(list));
  } catch (err) {
    console.error('Error saving favorites', err);
  }

  return isFavNow;
}

// --- SEARCH HISTORY ---
export function getSearchHistory(): SearchHistoryItem[] {
  try {
    const raw = localStorage.getItem(SEARCH_HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('Error reading search history', err);
    return [];
  }
}

export function addSearchHistory(query: string): SearchHistoryItem[] {
  const trimmed = query.trim();
  if (!trimmed) return getSearchHistory();

  let list = getSearchHistory();
  // Remove duplicate query if present
  list = list.filter((item) => item.query.toLowerCase() !== trimmed.toLowerCase());

  const newItem: SearchHistoryItem = {
    id: `sh_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    query: trimmed,
    timestamp: Date.now(),
  };

  list.unshift(newItem);
  // Cap at 50 entries
  if (list.length > 50) list = list.slice(0, 50);

  try {
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(list));
  } catch (err) {
    console.error('Error saving search history', err);
  }

  return list;
}

export function removeSearchHistoryItem(id: string): SearchHistoryItem[] {
  let list = getSearchHistory();
  list = list.filter((item) => item.id !== id);
  try {
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(list));
  } catch (err) {
    console.error('Error removing search history item', err);
  }
  return list;
}

export function clearSearchHistory(): void {
  try {
    localStorage.removeItem(SEARCH_HISTORY_KEY);
  } catch (err) {
    console.error('Error clearing search history', err);
  }
}

// --- RECENTLY PLAYED ---
export function getRecentlyPlayed(): RecentlyPlayedItem[] {
  try {
    const raw = localStorage.getItem(RECENTLY_PLAYED_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('Error reading recently played', err);
    return [];
  }
}

export function addRecentlyPlayed(song: Song): RecentlyPlayedItem[] {
  let list = getRecentlyPlayed();
  // Remove existing entry for same song
  list = list.filter((item) => item.song.id !== song.id);

  const newItem: RecentlyPlayedItem = {
    id: `rp_${Date.now()}_${song.id}`,
    song,
    timestamp: Date.now(),
  };

  list.unshift(newItem);
  // Cap at 100 entries
  if (list.length > 100) list = list.slice(0, 100);

  try {
    localStorage.setItem(RECENTLY_PLAYED_KEY, JSON.stringify(list));
  } catch (err) {
    console.error('Error saving recently played', err);
  }

  return list;
}

export function removeRecentlyPlayedItem(id: string): RecentlyPlayedItem[] {
  let list = getRecentlyPlayed();
  list = list.filter((item) => item.id !== id);
  try {
    localStorage.setItem(RECENTLY_PLAYED_KEY, JSON.stringify(list));
  } catch (err) {
    console.error('Error removing recently played item', err);
  }
  return list;
}

export function clearRecentlyPlayed(): void {
  try {
    localStorage.removeItem(RECENTLY_PLAYED_KEY);
  } catch (err) {
    console.error('Error clearing recently played', err);
  }
}

// --- PLAYER SETTINGS PERSISTENCE ---
export interface PlayerSettings {
  volume: number;
  isMuted: boolean;
  repeatMode: RepeatMode;
  shuffleMode: boolean;
}

export function getPlayerSettings(): PlayerSettings {
  try {
    const raw = localStorage.getItem(PLAYER_SETTINGS_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Error reading player settings', err);
  }
  return {
    volume: 1,
    isMuted: false,
    repeatMode: 'off',
    shuffleMode: false,
  };
}

export function savePlayerSettings(settings: Partial<PlayerSettings>): void {
  try {
    const current = getPlayerSettings();
    const updated = { ...current, ...settings };
    localStorage.setItem(PLAYER_SETTINGS_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Error saving player settings', err);
  }
}

// --- ACTIVE PLAYER STATE PERSISTENCE ---
const ACTIVE_PLAYER_STATE_KEY = 'sonic_current_active_player_state';

export interface ActivePlayerState {
  currentSong: Song | null;
  currentTime: number;
  queue: Song[];
  queueIndex: number;
  repeatMode: RepeatMode;
  shuffleMode: boolean;
}

export function saveActivePlayerState(state: ActivePlayerState): void {
  try {
    localStorage.setItem(ACTIVE_PLAYER_STATE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error('Error saving active player state', err);
  }
}

export function getActivePlayerState(): ActivePlayerState | null {
  try {
    const raw = localStorage.getItem(ACTIVE_PLAYER_STATE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    console.error('Error reading active player state', err);
    return null;
  }
}

