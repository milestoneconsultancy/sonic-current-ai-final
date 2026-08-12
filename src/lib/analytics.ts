import {
  ref,
  set,
  onValue,
  onDisconnect,
  serverTimestamp as rtdbServerTimestamp,
} from 'firebase/database';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  increment,
  writeBatch,
} from 'firebase/firestore';
import { rtdb, db, auth, markFirestoreDisabled, isFirestoreDisabled as checkIsDisabled } from './firebase';
import { Song } from '../types';

// ==========================================
// SESSION IDENTIFIER
// ==========================================
export function getSessionId(): string {
  let id = sessionStorage.getItem('sonic_session_id');
  if (!id) {
    id = 's_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now();
    sessionStorage.setItem('sonic_session_id', id);
  }
  return id;
}

// ==========================================
// REALTIME PRESENCE (RTDB)
// ==========================================
export function initRealtimePresence() {
  const sessionId = getSessionId();
  const sessionRef = ref(rtdb, `presence/${sessionId}`);
  const connectedRef = ref(rtdb, '.info/connected');

  onValue(connectedRef, (snap) => {
    if (snap.val() === true) {
      onDisconnect(sessionRef).remove();

      set(sessionRef, {
        sessionId,
        uid: auth.currentUser?.uid || 'anonymous',
        email: auth.currentUser?.email || 'anonymous',
        startedAt: rtdbServerTimestamp(),
        lastSeen: rtdbServerTimestamp(),
        userAgent: navigator.userAgent,
      });
    }
  });

  // Heartbeat every 25 seconds
  const interval = setInterval(() => {
    set(sessionRef, {
      sessionId,
      uid: auth.currentUser?.uid || 'anonymous',
      email: auth.currentUser?.email || 'anonymous',
      startedAt: rtdbServerTimestamp(),
      lastSeen: rtdbServerTimestamp(),
      userAgent: navigator.userAgent,
    }).catch(() => {});
  }, 25000);

  return () => {
    clearInterval(interval);
  };
}

export function subscribeToActiveUsers(callback: (count: number, users: any[]) => void) {
  const presenceRef = ref(rtdb, 'presence');
  return onValue(presenceRef, (snap) => {
    const val = snap.val();
    if (!val) {
      callback(0, []);
      return;
    }
    const userList = Object.values(val);
    callback(userList.length, userList);
  });
}

// ==========================================
// VISIT & EVENT ANALYTICS (FIRESTORE)
// ==========================================
function checkFirestoreErr(err: any) {
  const msg = String(err?.message || err || '');
  const code = String(err?.code || '');
  if (
    msg.includes('PERMISSION_DENIED') ||
    msg.includes('permission-denied') ||
    msg.includes('disabled') ||
    msg.includes('offline') ||
    code.includes('permission-denied')
  ) {
    markFirestoreDisabled();
  }
}

function getTodayDateStr(): string {
  const d = new Date();
  return d.toISOString().split('T')[0];
}

export async function trackEvent(
  eventType: 'visit' | 'search' | 'song_play' | 'song_completion' | 'download' | 'like',
  data: {
    query?: string;
    song?: Song;
    language?: string;
    page?: string;
  }
) {
  if (checkIsDisabled()) return;
  try {
    const today = getTodayDateStr();
    const sessionId = getSessionId();
    const uid = auth.currentUser?.uid || 'anonymous';
    const timestamp = new Date().toISOString();

    // Update Daily Aggregated Document
    const dailyRef = doc(db, 'analytics_daily', today);

    const updateFields: any = {
      date: today,
      lastUpdated: timestamp,
    };

    if (eventType === 'visit') {
      updateFields.visitsCount = increment(1);
    } else if (eventType === 'search' && data.query) {
      updateFields.searchesCount = increment(1);
    } else if (eventType === 'song_play' && data.song) {
      updateFields.songPlaysCount = increment(1);
    } else if (eventType === 'download' && data.song) {
      updateFields.downloadsCount = increment(1);
    } else if (eventType === 'like' && data.song) {
      updateFields.likesCount = increment(1);
    }

    await setDoc(dailyRef, updateFields, { merge: true });

    // Track detailed event for top lists & live feed
    const eventRef = doc(collection(db, 'analytics_events'));
    await setDoc(eventRef, {
      eventType,
      sessionId,
      uid,
      timestamp,
      date: today,
      query: data.query || null,
      songId: data.song?.id || null,
      songTitle: data.song?.title || null,
      songArtist: data.song?.artist || null,
      songAlbum: data.song?.album || null,
      language: data.language || null,
      page: data.page || null,
    });
  } catch (err) {
    checkFirestoreErr(err);
  }
}

// ==========================================
// DASHBOARD ANALYTICS QUERY
// ==========================================
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

  if (checkIsDisabled()) return result;

  try {
    const today = new Date();
    let daysToFetch = 30;
    if (timeRange === 'today') daysToFetch = 1;
    if (timeRange === 'yesterday') daysToFetch = 2;
    if (timeRange === '7d') daysToFetch = 7;
    if (timeRange === '14d') daysToFetch = 14;

    const dates: string[] = [];
    for (let i = daysToFetch - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      dates.push(d.toISOString().split('T')[0]);
    }

    // Fetch daily aggregated documents
    const dailySnaps = await Promise.all(
      dates.map((dateStr) => getDoc(doc(db, 'analytics_daily', dateStr)))
    );

    let totalVis = 0;
    let todayVis = 0;
    let totalPlays = 0;
    let totalSearches = 0;
    let totalDownloads = 0;
    let totalLikes = 0;

    const todayStr = getTodayDateStr();

    dailySnaps.forEach((snap, idx) => {
      const dateStr = dates[idx];
      if (snap.exists()) {
        const d = snap.data();
        const v = d.visitsCount || 0;
        const p = d.songPlaysCount || 0;
        const s = d.searchesCount || 0;
        const dw = d.downloadsCount || 0;
        const l = d.likesCount || 0;

        totalVis += v;
        totalPlays += p;
        totalSearches += s;
        totalDownloads += dw;
        totalLikes += l;

        if (dateStr === todayStr) {
          todayVis = v;
        }

        result.dailyData.push({ date: dateStr, visits: v, plays: p, searches: s });
      } else {
        result.dailyData.push({ date: dateStr, visits: 0, plays: 0, searches: 0 });
      }
    });

    result.totalVisits = totalVis;
    result.todayVisits = todayVis;
    result.songPlays = totalPlays;
    result.searches = totalSearches;
    result.downloads = totalDownloads;
    result.likes = totalLikes;

    // Query recent events for top lists & activity feed
    const eventsRef = collection(db, 'analytics_events');
    const qEvents = query(eventsRef, orderBy('timestamp', 'desc'), limit(200));
    const eventsSnap = await getDocs(qEvents);

    const searchMap = new Map<string, number>();
    const artistMap = new Map<string, number>();
    const songMap = new Map<string, { title: string; artist: string; count: number }>();
    const langMap = new Map<string, number>();
    const uniqueSessions = new Set<string>();

    const recentActs: any[] = [];

    eventsSnap.docs.forEach((docSnap) => {
      const e = docSnap.data();
      if (e.sessionId) uniqueSessions.add(e.sessionId);

      if (e.eventType === 'search' && e.query) {
        const qClean = e.query.trim();
        searchMap.set(qClean, (searchMap.get(qClean) || 0) + 1);
      }

      if ((e.eventType === 'song_play' || e.eventType === 'like' || e.eventType === 'download') && e.songTitle) {
        if (e.songArtist) {
          artistMap.set(e.songArtist, (artistMap.get(e.songArtist) || 0) + 1);
        }
        const key = `${e.songTitle} - ${e.songArtist || ''}`;
        const existing = songMap.get(key) || { title: e.songTitle, artist: e.songArtist || '', count: 0 };
        existing.count += 1;
        songMap.set(key, existing);
      }

      if (e.language) {
        langMap.set(e.language, (langMap.get(e.language) || 0) + 1);
      }

      if (recentActs.length < 20) {
        recentActs.push({
          id: docSnap.id,
          type: e.eventType,
          query: e.query,
          title: e.songTitle,
          artist: e.songArtist,
          timestamp: e.timestamp,
        });
      }
    });

    result.uniqueVisitors = uniqueSessions.size || Math.max(1, Math.floor(totalVis * 0.7));

    result.topSearches = Array.from(searchMap.entries())
      .map(([query, count]) => ({ query, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    result.topArtists = Array.from(artistMap.entries())
      .map(([artist, count]) => ({ artist, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    result.topSongs = Array.from(songMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    result.popularLanguages = Array.from(langMap.entries())
      .map(([language, count]) => ({ language, count }))
      .sort((a, b) => b.count - a.count);

    result.recentActivity = recentActs;

  } catch (err) {
    checkFirestoreErr(err);
  }

  return result;
}
