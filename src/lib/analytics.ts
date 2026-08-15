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
import { rtdb, db, auth, isFirestoreDisabled, markFirestoreDisabled } from './firebase';
import { Song } from '../types';

// ==========================================
// SESSION IDENTIFIER & BROWSER DETAILS
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
// BROADCAST CHANNEL FOR INSTANT CROSS-TAB SYNC
// ==========================================
let broadcastChannel: BroadcastChannel | null = null;
try {
  if (typeof BroadcastChannel !== 'undefined') {
    broadcastChannel = new BroadcastChannel('sonic_realtime_events_bc');
  }
} catch (_) {}

// Local storage keys for resilient analytics persistence
const LOCAL_PRESENCE_KEY = 'sonic_local_presence_sessions';
const LOCAL_EVENTS_KEY = 'sonic_local_analytics_events';
const LOCAL_DAILY_KEY = 'sonic_local_daily_stats';

function getLocalPresenceList(): any[] {
  try {
    const raw = localStorage.getItem(LOCAL_PRESENCE_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw);
    const now = Date.now();
    // Keep sessions active within last 45 seconds
    return list.filter((s: any) => s.lastSeen && now - s.lastSeen < 45000);
  } catch {
    return [];
  }
}

function saveLocalPresenceList(list: any[]) {
  try {
    localStorage.setItem(LOCAL_PRESENCE_KEY, JSON.stringify(list));
  } catch (_) {}
}

function getLocalEvents(): any[] {
  try {
    const raw = localStorage.getItem(LOCAL_EVENTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalEvent(event: any) {
  try {
    const events = getLocalEvents();
    events.unshift(event);
    if (events.length > 500) events.length = 500;
    localStorage.setItem(LOCAL_EVENTS_KEY, JSON.stringify(events));

    // Update Daily Aggregate
    const today = getTodayDateStr();
    const rawDaily = localStorage.getItem(LOCAL_DAILY_KEY);
    const dailyMap = rawDaily ? JSON.parse(rawDaily) : {};
    if (!dailyMap[today]) {
      dailyMap[today] = { visits: 0, plays: 0, searches: 0, downloads: 0, likes: 0 };
    }
    if (event.eventType === 'visit') dailyMap[today].visits = (dailyMap[today].visits || 0) + 1;
    if (event.eventType === 'song_play') dailyMap[today].plays = (dailyMap[today].plays || 0) + 1;
    if (event.eventType === 'search') dailyMap[today].searches = (dailyMap[today].searches || 0) + 1;
    if (event.eventType === 'download') dailyMap[today].downloads = (dailyMap[today].downloads || 0) + 1;
    if (event.eventType === 'like') dailyMap[today].likes = (dailyMap[today].likes || 0) + 1;
    localStorage.setItem(LOCAL_DAILY_KEY, JSON.stringify(dailyMap));
  } catch (_) {}
}

// ==========================================
// REALTIME PRESENCE (FIRESTORE + RTDB + BROADCAST)
// ==========================================
export function initRealtimePresence(additionalData?: { currentPage?: string; currentSong?: Song | null }) {
  const sessionId = getSessionId();
  const device = getDeviceType();
  const browser = getBrowserName();

  const currentSessionObj = {
    id: sessionId,
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
  };

  const updateLocalPresence = () => {
    const list = getLocalPresenceList().filter((s) => s.sessionId !== sessionId);
    currentSessionObj.lastSeen = Date.now();
    currentSessionObj.page = additionalData?.currentPage || currentSessionObj.page;
    currentSessionObj.activeSong = additionalData?.currentSong?.title || null;
    list.push(currentSessionObj);
    saveLocalPresenceList(list);

    if (broadcastChannel) {
      broadcastChannel.postMessage({ type: 'PRESENCE_PING', session: currentSessionObj });
    }
  };

  const updatePresenceDoc = async () => {
    updateLocalPresence();

    if (isFirestoreDisabled()) return;

    try {
      const presenceRef = doc(db, 'presence', sessionId);
      await setDoc(presenceRef, currentSessionObj, { merge: true });
    } catch (e: any) {
      const msg = String(e?.message || e || '');
      if (msg.includes('PERMISSION_DENIED') || msg.includes('permission-denied')) {
        markFirestoreDisabled();
      }
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
      const list = getLocalPresenceList().filter((s) => s.sessionId !== sessionId);
      saveLocalPresenceList(list);
      if (broadcastChannel) {
        broadcastChannel.postMessage({ type: 'PRESENCE_REMOVE', sessionId });
      }
      if (!isFirestoreDisabled()) {
        const presenceRef = doc(db, 'presence', sessionId);
        deleteDoc(presenceRef).catch(() => {});
      }
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
  const refreshFromLocal = () => {
    const list = getLocalPresenceList();
    if (list.length === 0) {
      list.push({
        id: getSessionId(),
        sessionId: getSessionId(),
        uid: auth.currentUser?.uid || 'current_user',
        email: auth.currentUser?.email || 'Current Visitor',
        device: getDeviceType(),
        browser: getBrowserName(),
        page: 'home',
        lastSeen: Date.now(),
      });
    }
    callback(list.length, list);
  };

  // Immediate local emit
  refreshFromLocal();

  // Listen to BroadcastChannel
  const handleMessage = (e: MessageEvent) => {
    if (e.data?.type === 'PRESENCE_PING' || e.data?.type === 'PRESENCE_REMOVE') {
      refreshFromLocal();
    }
  };

  if (broadcastChannel) {
    broadcastChannel.addEventListener('message', handleMessage);
  }

  // Storage listener for cross-tab
  const handleStorage = (e: StorageEvent) => {
    if (e.key === LOCAL_PRESENCE_KEY) {
      refreshFromLocal();
    }
  };
  window.addEventListener('storage', handleStorage);

  // Periodic local checker every 3 seconds
  const localTimer = setInterval(refreshFromLocal, 3000);

  // Firestore Realtime Listener
  let unsubFirestore = () => {};
  if (!isFirestoreDisabled()) {
    try {
      const presenceCol = collection(db, 'presence');
      unsubFirestore = onSnapshot(
        presenceCol,
        (snapshot) => {
          const now = Date.now();
          const activeList: any[] = [];

          snapshot.docs.forEach((d) => {
            const data = d.data();
            if (data.lastSeen && now - data.lastSeen < 45000) {
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

          if (activeList.length > 0) {
            callback(activeList.length, activeList);
          } else {
            refreshFromLocal();
          }
        },
        (err) => {
          markFirestoreDisabled();
          refreshFromLocal();
        }
      );
    } catch (_) {
      markFirestoreDisabled();
    }
  }

  return () => {
    clearInterval(localTimer);
    if (broadcastChannel) {
      broadcastChannel.removeEventListener('message', handleMessage);
    }
    window.removeEventListener('storage', handleStorage);
    unsubFirestore();
  };
}

// ==========================================
// VISIT & EVENT ANALYTICS (FIRESTORE + LOCAL + BC)
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
  const today = getTodayDateStr();
  const sessionId = getSessionId();
  const uid = auth.currentUser?.uid || 'guest_' + sessionId.slice(-6);
  const email = auth.currentUser?.email || 'Guest';
  const timestamp = new Date().toISOString();
  const timestampMs = Date.now();

  const eventPayload = {
    id: 'evt_' + Math.random().toString(36).substring(2, 9) + '_' + timestampMs,
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
  };

  // 1. Instant local persistence & Broadcast
  saveLocalEvent(eventPayload);
  if (broadcastChannel) {
    broadcastChannel.postMessage({ type: 'REALTIME_ACTION', event: eventPayload });
  }

  // 2. Dual-sync to Firestore if available
  if (!isFirestoreDisabled()) {
    try {
      const dailyRef = doc(db, 'analytics_daily', today);
      const updateFields: any = {
        date: today,
        lastUpdated: timestamp,
      };

      if (eventType === 'visit') updateFields.visitsCount = increment(1);
      else if (eventType === 'search' && data.query) updateFields.searchesCount = increment(1);
      else if (eventType === 'song_play' && data.song) updateFields.songPlaysCount = increment(1);
      else if (eventType === 'download' && data.song) updateFields.downloadsCount = increment(1);
      else if (eventType === 'like' && data.song) updateFields.likesCount = increment(1);

      setDoc(dailyRef, updateFields, { merge: true }).catch(() => {});

      const eventRef = doc(collection(db, 'analytics_events'));
      await setDoc(eventRef, eventPayload);
    } catch (err: any) {
      const msg = String(err?.message || err || '');
      if (msg.includes('PERMISSION_DENIED') || msg.includes('permission-denied')) {
        markFirestoreDisabled();
      }
    }
  }
}

// ==========================================
// REALTIME LIVE EVENT LISTENER
// ==========================================
export function subscribeToLiveEvents(callback: (events: any[]) => void) {
  const getFormattedLocalEvents = () => {
    const list = getLocalEvents();
    return list.slice(0, 30).map((e: any) => ({
      id: e.id || e.timestampMs || Math.random(),
      type: e.eventType,
      query: e.query,
      title: e.songTitle,
      artist: e.songArtist,
      timestamp: e.timestamp,
      device: e.device,
      email: e.email,
    }));
  };

  // Initial local emit
  callback(getFormattedLocalEvents());

  // Broadcast channel listener
  const handleBc = (e: MessageEvent) => {
    if (e.data?.type === 'REALTIME_ACTION') {
      callback(getFormattedLocalEvents());
    }
  };
  if (broadcastChannel) {
    broadcastChannel.addEventListener('message', handleBc);
  }

  // Storage listener
  const handleStorage = (e: StorageEvent) => {
    if (e.key === LOCAL_EVENTS_KEY) {
      callback(getFormattedLocalEvents());
    }
  };
  window.addEventListener('storage', handleStorage);

  // Firestore listener
  let unsubFirestore = () => {};
  if (!isFirestoreDisabled()) {
    try {
      const eventsRef = collection(db, 'analytics_events');
      const q = query(eventsRef, orderBy('timestamp', 'desc'), limit(30));
      unsubFirestore = onSnapshot(
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
          if (events.length > 0) {
            callback(events);
          }
        },
        (err) => {
          markFirestoreDisabled();
        }
      );
    } catch (_) {
      markFirestoreDisabled();
    }
  }

  return () => {
    if (broadcastChannel) {
      broadcastChannel.removeEventListener('message', handleBc);
    }
    window.removeEventListener('storage', handleStorage);
    unsubFirestore();
  };
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

  const todayStr = getTodayDateStr();

  // 1. Gather Local Daily Data
  let localDailyMap: Record<string, any> = {};
  try {
    const raw = localStorage.getItem(LOCAL_DAILY_KEY);
    if (raw) localDailyMap = JSON.parse(raw);
  } catch (_) {}

  // 2. Fetch from Firestore if enabled
  let firestoreDailySnaps: any[] = [];
  if (!isFirestoreDisabled()) {
    try {
      firestoreDailySnaps = await Promise.all(
        dates.map((dateStr) => getDoc(doc(db, 'analytics_daily', dateStr)).catch(() => null))
      );
    } catch (_) {
      markFirestoreDisabled();
    }
  }

  let totalVis = 0;
  let todayVis = 0;
  let totalPlays = 0;
  let totalSearches = 0;
  let totalDownloads = 0;
  let totalLikes = 0;

  dates.forEach((dateStr, idx) => {
    const snap = firestoreDailySnaps[idx];
    const localDay = localDailyMap[dateStr] || {};

    let v = localDay.visits || 0;
    let p = localDay.plays || 0;
    let s = localDay.searches || 0;
    let dw = localDay.downloads || 0;
    let l = localDay.likes || 0;

    if (snap && snap.exists()) {
      const d = snap.data();
      v = Math.max(v, d.visitsCount || 0);
      p = Math.max(p, d.songPlaysCount || 0);
      s = Math.max(s, d.searchesCount || 0);
      dw = Math.max(dw, d.downloadsCount || 0);
      l = Math.max(l, d.likesCount || 0);
    }

    totalVis += v;
    totalPlays += p;
    totalSearches += s;
    totalDownloads += dw;
    totalLikes += l;

    if (dateStr === todayStr) {
      todayVis = v;
    }

    result.dailyData.push({ date: dateStr, visits: v, plays: p, searches: s });
  });

  // 3. Process Granular Events (Local + Firestore)
  const localEvents = getLocalEvents();
  let firestoreEvents: any[] = [];

  if (!isFirestoreDisabled()) {
    try {
      const eventsRef = collection(db, 'analytics_events');
      const qEvents = query(eventsRef, orderBy('timestamp', 'desc'), limit(300));
      const eventsSnap = await getDocs(qEvents);
      firestoreEvents = eventsSnap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
    } catch (_) {
      markFirestoreDisabled();
    }
  }

  // Combine and deduplicate events by sessionId + timestamp
  const combinedMap = new Map<string, any>();
  localEvents.forEach((e) => {
    const k = `${e.sessionId}_${e.timestampMs || e.timestamp}_${e.eventType}`;
    combinedMap.set(k, e);
  });
  firestoreEvents.forEach((e) => {
    const k = `${e.sessionId}_${e.timestampMs || e.timestamp}_${e.eventType}`;
    if (!combinedMap.has(k)) {
      combinedMap.set(k, e);
    }
  });

  const allEvents = Array.from(combinedMap.values());

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

  allEvents.forEach((e) => {
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
        id: e.id || Math.random(),
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

  return result;
}
