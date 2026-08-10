export interface Song {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: string; // in seconds or string
  artwork: string;
  url: string; // media url
  permaUrl: string;
  contextLabel?: string;
}

export interface DownloadedSong {
  id: string;
  title: string;
  artist: string;
  album: string;
  artwork: string;
  duration: string;
  fileSize: number; // bytes
  timestamp: number;
  audioBlob: Blob;
}

export interface SearchHistoryItem {
  id: string;
  query: string;
  timestamp: number;
}

export interface RecentlyPlayedItem {
  id: string;
  song: Song;
  timestamp: number;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  createdAt: string;
  lastLoginAt: string;
}

export interface Playlist {
  id: string;
  userId: string;
  name: string;
  description?: string;
  trackCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PlaylistTrack {
  id: string;
  songId: string;
  title: string;
  artist: string;
  album: string;
  artwork: string;
  duration: string;
  url: string;
  position: number;
  addedAt: string;
}

export interface UserPreference {
  preferredQuality: string;
  autoplayEnabled: boolean;
  repeatMode: RepeatMode;
  shuffleEnabled: boolean;
  updatedAt: string;
}

export type TabType = 'home' | 'search' | 'history' | 'favorites' | 'downloads' | 'playlists' | 'account' | 'login' | 'signup';

export type RepeatMode = 'off' | 'one' | 'all';

