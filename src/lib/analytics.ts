import {
  startDevicePresence,
  subscribeRealtimeActiveDevices,
  logRealtimeEvent,
  DevicePresenceRecord,
} from './db-sync';
import { Song } from '../types';
import { db, auth, isFirestoreDisabled } from './firebase';
import { collection, query, orderBy, limit, onSnapshot, getDocs, doc, getDoc } from 'firebase/firestore';

export interface AnalyticsSummary {
  totalVisits: number;
  todayVisits: number;
  uniqueVisitors: number;
  songPlays: number;
  searches: number;
  downloads: number;
  likes: number;
  dailyData: { date: string; visits: number; plays: number; searches: number }[];
  topSearches: { query: string; count: number }[];
  topArtists: { artist: string; count: number }[];
  topSongs: { title: string; artist: string; count: number }[];
  popularLanguages: { language: string; count: number }[];
  recentActivity: any[];
}

/**
 * Real-time device presence initializer.
 * Syncs presence to both server and Firestore across all devices (Mobile, Desktop, Tablet).
 */
export function initRealtimePresence(additionalData?: { currentPage?: string; currentSong?: Song | null }) {
  return startDevicePresence(additionalData);
}

/**
 * Real-time active devices subscriber for Admin Dashboard.
 * Accurately tracks all connected devices worldwide with their type, browser, page & playing song.
 */
export function subscribeToActiveUsers(callback: (count: number, users: any[]) => void) {
  return subscribeRealtimeActiveDevices(callback);
}

/**
 * Multi-device Event Tracker for plays, searches, visits, likes, downloads.
 */
export async function trackEvent(
  eventType: 'visit' | 'search' | 'song_play' | 'song_completion' | 'download' | 'like',
  data: {
    query?: string;
    song?: Song;
    language?: string;
    page?: string;
  }
) {
  return logRealtimeEvent(eventType, data);
}

/**
 * Live Realtime Action Stream subscriber.
 */
export function subscribeToLiveEvents(callback: (events: any[]) => void): () => void {
  // 1. Server-side event polling every 3 seconds
  let lastEventsJson = '';
  const pollServer = async () => {
    try {
      const res = await fetch('/api/analytics/summary');
      if (res.ok) {
        const json = await res.json();
        if (json && Array.isArray(json.recentEvents)) {
          const str = JSON.stringify(json.recentEvents);
          if (str !== lastEventsJson) {
            lastEventsJson = str;
            const mapped = json.recentEvents.map((e: any) => ({
              id: e.id || Math.random(),
              type: e.eventType,
              query: e.query,
              title: e.songTitle,
              artist: e.songArtist,
              timestamp: e.timestamp,
              device: e.device,
              deviceDetail: e.deviceDetail,
              email: e.email,
            }));
            callback(mapped);
          }
        }
      }
    } catch (_) {}
  };

  pollServer();
  const timer = setInterval(pollServer, 3000);

  // 2. Firestore stream fallback
  let unsubFirestore = () => {};
  if (!isFirestoreDisabled()) {
    try {
      const q = query(collection(db, 'analytics_events'), orderBy('timestamp', 'desc'), limit(30));
      unsubFirestore = onSnapshot(
        q,
        (snap) => {
          const mapped = snap.docs.map((d) => {
            const e = d.data();
            return {
              id: d.id,
              type: e.eventType,
              query: e.query,
              title: e.songTitle,
              artist: e.songArtist,
              timestamp: e.timestamp,
              device: e.device,
              deviceDetail: e.deviceDetail,
              email: e.email,
            };
          });
          if (mapped.length > 0) {
            callback(mapped);
          }
        },
        () => {}
      );
    } catch (_) {}
  }

  return () => {
    clearInterval(timer);
    unsubFirestore();
  };
}

/**
 * Fetches Comprehensive Multi-Device Analytics Summary for the Dashboard.
 */
export async function fetchAnalyticsSummary(
  timeRange: 'today' | 'yesterday' | '7d' | '14d' | '30d'
): Promise<AnalyticsSummary> {
  const result: AnalyticsSummary = {
    totalVisits: 0,
    todayVisits: 0,
    uniqueVisitors: 0,
    songPlays: 0,
    searches: 0,
    downloads: 0,
    likes: 0,
    dailyData: [],
    topSearches: [],
    topArtists: [],
    topSongs: [],
    popularLanguages: [],
    recentActivity: [],
  };

  // 1. Fetch from Server API
  try {
    const res = await fetch(`/api/analytics/summary?timeRange=${timeRange}`);
    if (res.ok) {
      const data = await res.json();
      result.totalVisits = data.totalVisits || 0;
      result.todayVisits = data.todayVisits || 0;
      result.uniqueVisitors = data.activeUsersCount || 1;
      result.songPlays = data.songPlays || 0;
      result.searches = data.searches || 0;
      result.downloads = data.downloads || 0;
      result.likes = data.likes || 0;
      result.dailyData = data.dailyData || [];
      result.topSearches = data.topSearches || [];
      result.topSongs = data.topSongs || [];
      result.topArtists = data.topArtists || [];
      result.popularLanguages = data.popularLanguages || [];
      if (Array.isArray(data.recentEvents)) {
        result.recentActivity = data.recentEvents.map((e: any) => ({
          id: e.id || Math.random(),
          type: e.eventType,
          query: e.query,
          title: e.songTitle,
          artist: e.songArtist,
          timestamp: e.timestamp,
          device: e.device,
          deviceDetail: e.deviceDetail,
          email: e.email,
        }));
      }
    }
  } catch (err) {
    console.error('Error fetching server analytics summary:', err);
  }

  // 2. Supplement from Firestore if enabled
  if (!isFirestoreDisabled()) {
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const dailySnap = await getDoc(doc(db, 'analytics_daily', todayStr));
      if (dailySnap.exists()) {
        const d = dailySnap.data();
        result.todayVisits = Math.max(result.todayVisits, d.visitsCount || 0);
        result.songPlays = Math.max(result.songPlays, d.songPlaysCount || 0);
        result.searches = Math.max(result.searches, d.searchesCount || 0);
        result.downloads = Math.max(result.downloads, d.downloadsCount || 0);
        result.likes = Math.max(result.likes, d.likesCount || 0);
      }
    } catch (_) {}
  }

  if (result.totalVisits === 0) result.totalVisits = 1;
  if (result.todayVisits === 0) result.todayVisits = 1;

  return result;
}
