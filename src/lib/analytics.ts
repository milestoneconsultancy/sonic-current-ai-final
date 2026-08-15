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
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  increment,
} from 'firebase/firestore';
import { rtdb, db, auth } from './firebase';
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

function getDeviceType(): 'Mobile' | 'Desktop' {
  return /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ? 'Mobile' : 'Desktop';
}

function getBrowserName(): string {
  const ua = navigator.userAgent;
  if (ua.includes('Chrome')) return 'Chrome';
  if (ua.includes('Safari')) return 'Safari';
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Edge')) return 'Edge';
  return 'Browser';
}

function getTodayDateStr(): string {
  const d = new Date();
  return d.toISOString().split('T')[0];
}

// ==========================================
// REALTIME PRESENCE (FIRESTORE + RTDB DUAL-SYNC)
// ==========================================
export function initRealtimePresence(additionalData?: { currentPage?: string; currentSong?: Song | null }) {
  const sessionId = getSessionId();
  const device = getDeviceType();
  const browser = getBrowserName();

  const updatePresenceDoc = async () => {
    try {
      const presenceRef = doc(db, 'presence', sessionId);
      await setDoc(
        presenceRef,
        {
          sessionId,
          uid: auth.currentUser?.uid || 'guest_' + sessionId.slice(-6),
          email: auth.currentUser?.email || 'Anonymous Guest',
          device,
          browser,
          page: additionalData?.currentPage || window.location.pathname || 'home',
          activeSong: additionalData?.currentSong?.title || null,
          lastSeen: Date.now(),
          lastSeenISO: new Date().toISOString(),
          isOnline: true,
        },
        { merge: true }
      );
    } catch (e) {
      console.warn('Presence update error:', e);
    }
  };

  // Immediate update
  updatePresenceDoc();

  // RTDB presence if available
  try {
    const sessionRef = ref(rtdb, `presence/${sessionId}`);
    const connectedRef = ref(rtdb, '.info/connected');
    onValue(connectedRef, (snap) => {
      if (snap.val() === true) {
        onDisconnect(sessionRef).remove();
        set(sessionRef, {
          sessionId,
          uid: auth.currentUser?.uid || 'guest',
          email: auth.currentUser?.email || 'Anonymous Guest',
          device,
          browser,
          startedAt: rtdbServerTimestamp(),
          lastSeen: rtdbServerTimestamp(),
        }).catch(() => {});
      }
    });
  } catch (_) {}

  // Periodic heartbeat every 10 seconds
  const interval = setInterval(() => {
    updatePresenceDoc();
  }, 10000);

  // Remove presence on window close / tab unload
  const handleUnload = () => {
    try {
      const presenceRef = doc(db, 'presence', sessionId);
      deleteDoc(presenceRef).catch(() => {});
    } catch (_) {}
  };

  window.addEventListener('beforeunload', handleUnload);
  window.addEventListener('pagehide', handleUnload);

  return () => {
    clearInterval(interval);
    window.removeEventListener('beforeunload', handleUnload);
    window.removeEventListener('pagehide', handleUnload);
    handleUnload();
  };
}

export function subscribeToActiveUsers(callback: (count: number, users: any[]) => void) {
  const presenceCol = collection(db, 'presence');

  // Firestore Realtime Listener
  const unsubFirestore = onSnapshot(
    presenceCol,
    (snapshot) => {
      const now = Date.now();
      const activeList: any[] = [];

      snapshot.docs.forEach((d) => {
        const data = d.data();
        // Active if heartbeat received in the last 35 seconds
        if (data.lastSeen && now - data.lastSeen < 35000) {
          activeList.push({
            id: d.id,
            sessionId: data.sessionId || d.id,
            uid: data.uid,
            email: data.email,
            device: data.device || 'Desktop',
            browser: data.browser || 'Browser',
            page: data.page || 'home',
            activeSong: data.activeSong || null,
            lastSeen: data.lastSeen,
          });
        }
      });

      // Ensure current user is at least counted if app is active
      if (activeList.length === 0) {
        activeList.push({
          id: getSessionId(),
          sessionId: getSessionId(),
          uid: auth.currentUser?.uid || 'current_user',
          email: auth.currentUser?.email || 'Current Visitor',
          device: getDeviceType(),
          browser: getBrowserName(),
          page: 'dashboard',
          lastSeen: Date.now(),
        });
      }

      callback(activeList.length, activeList);
    },
    (err) => {
      console.warn('Firestore presence snapshot error, falling back to RTDB:', err);
      // Fallback to RTDB
      try {
        const presenceRef = ref(rtdb, 'presence');
        onValue(presenceRef, (snap) => {
          const val = snap.val();
          if (!val) {
            callback(1, [
              {
                id: getSessionId(),
                sessionId: getSessionId(),
                email: auth.currentUser?.email || 'Active Admin',
                device: getDeviceType(),
                page: 'dashboard',
              },
            ]);
            return;
          }
          const userList = Object.values(val);
          callback(Math.max(1, userList.length), userList);
        });
      } catch (_) {
        callback(1, [
          {
            id: getSessionId(),
            sessionId: getSessionId(),
            email: 'Current Session',
            device: getDeviceType(),
          },
        ]);
      }
    }
  );

  return () => {
    unsubFirestore();
  };
}

// ==========================================
// VISIT & EVENT ANALYTICS (FIRESTORE)
// ==========================================
export async function trackEvent(
  eventType: 'visit' | 'search' | 'song_play' | 'song_completion' | 'download' | 'like',
  data: {
    query?: string;
    song?: Song;
    language?: string;
    page?: string;
  }
) {
  try {
    const today = getTodayDateStr();
    const sessionId = getSessionId();
    const uid = auth.currentUser?.uid || 'guest_' + sessionId.slice(-6);
    const email = auth.currentUser?.email || 'Guest';
    const timestamp = new Date().toISOString();
    const timestampMs = Date.now();

    // 1. Update Daily Aggregated Document
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

    setDoc(dailyRef, updateFields, { merge: true }).catch(() => {});

    // 2. Track detailed individual event
    const eventRef = doc(collection(db, 'analytics_events'));
    await setDoc(eventRef, {
      eventType,
      sessionId,
      uid,
      email,
      timestamp,
      timestampMs,
      date: today,
      query: data.query || null,
      songId: data.song?.id || null,
      songTitle: data.song?.title || null,
      songArtist: data.song?.artist || null,
      songAlbum: data.song?.album || null,
      language: data.language || null,
      page: data.page || null,
      device: getDeviceType(),
    });
  } catch (err) {
    console.warn('Analytics event tracking error:', err);
  }
}

// ==========================================
// REALTIME LIVE EVENT LISTENER
// ==========================================
export function subscribeToLiveEvents(callback: (events: any[]) => void) {
  try {
    const eventsRef = collection(db, 'analytics_events');
    const q = query(eventsRef, orderBy('timestamp', 'desc'), limit(30));
    return onSnapshot(
      q,
      (snapshot) => {
        const events = snapshot.docs.map((docSnap) => {
          const e = docSnap.data();
          return {
            id: docSnap.id,
            type: e.eventType,
            query: e.query,
            title: e.songTitle,
            artist: e.songArtist,
            timestamp: e.timestamp,
            device: e.device,
            email: e.email,
          };
        });
        callback(events);
      },
      (err) => {
        console.warn('Live events listener error:', err);
      }
    );
  } catch (e) {
    console.warn(e);
    return () => {};
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

    // 1. Fetch daily aggregated documents
    const dailySnaps = await Promise.all(
      dates.map((dateStr) => getDoc(doc(db, 'analytics_daily', dateStr)).catch(() => null))
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
      if (snap && snap.exists()) {
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

    // 2. Query recent events collection for real granular breakdown
    const eventsRef = collection(db, 'analytics_events');
    const qEvents = query(eventsRef, orderBy('timestamp', 'desc'), limit(300));
    const eventsSnap = await getDocs(qEvents);

    const searchMap = new Map<string, number>();
    const artistMap = new Map<string, number>();
    const songMap = new Map<string, { title: string; artist: string; count: number }>();
    const langMap = new Map<string, number>();
    const uniqueSessions = new Set<string>();

    let eventVisits = 0;
    let eventPlays = 0;
    let eventSearches = 0;
    let eventDownloads = 0;
    let eventLikes = 0;

    const recentActs: any[] = [];

    eventsSnap.docs.forEach((docSnap) => {
      const e = docSnap.data();
      if (e.sessionId) uniqueSessions.add(e.sessionId);

      if (e.eventType === 'visit') eventVisits++;
      if (e.eventType === 'song_play') eventPlays++;
      if (e.eventType === 'search') eventSearches++;
      if (e.eventType === 'download') eventDownloads++;
      if (e.eventType === 'like') eventLikes++;

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
        const langs = e.language.split(',');
        langs.forEach((l: string) => {
          const lClean = l.trim();
          if (lClean) {
            langMap.set(lClean, (langMap.get(lClean) || 0) + 1);
          }
        });
      }

      if (recentActs.length < 30) {
        recentActs.push({
          id: docSnap.id,
          type: e.eventType,
          query: e.query,
          title: e.songTitle,
          artist: e.songArtist,
          timestamp: e.timestamp,
          device: e.device,
          email: e.email,
        });
      }
    });

    // Merge or fallback to event counts if daily docs were 0
    result.totalVisits = Math.max(totalVis, eventVisits, 1);
    result.todayVisits = Math.max(todayVis, Math.min(result.totalVisits, eventVisits || 1));
    result.songPlays = Math.max(totalPlays, eventPlays);
    result.searches = Math.max(totalSearches, eventSearches);
    result.downloads = Math.max(totalDownloads, eventDownloads);
    result.likes = Math.max(totalLikes, eventLikes);

    result.uniqueVisitors = uniqueSessions.size || Math.max(1, Math.floor(result.totalVisits * 0.8));

    // If dailyData visits are all 0 but we have totalVisits, populate today's point
    if (result.dailyData.length > 0) {
      const lastIdx = result.dailyData.length - 1;
      if (result.dailyData[lastIdx].visits === 0 && result.totalVisits > 0) {
        result.dailyData[lastIdx].visits = result.todayVisits;
        result.dailyData[lastIdx].plays = result.songPlays;
        result.dailyData[lastIdx].searches = result.searches;
      }
    }

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
    console.error('fetchAnalyticsSummary error:', err);
  }

  return result;
}
