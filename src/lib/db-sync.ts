import {
  collection,
  doc,
  onSnapshot,
  query,
  orderBy,
  limit,
  setDoc,
  deleteDoc,
  getDocs,
  getDoc,
  increment,
} from 'firebase/firestore';
import { db, auth, isFirestoreDisabled, markFirestoreDisabled } from './firebase';
import {
  Song,
  Playlist,
  SearchHistoryItem,
  RecentlyPlayedItem,
  DownloadedSong,
} from '../types';

// ==========================================
// DETAILED DEVICE & ENVIRONMENT DETECTION
// ==========================================
export interface DeviceInfo {
  type: 'Mobile' | 'Desktop' | 'Tablet';
  os: string;
  browser: string;
  label: string;
  screen: string;
}

export function detectDeviceInfo(): DeviceInfo {
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  let type: 'Mobile' | 'Desktop' | 'Tablet' = 'Desktop';
  let os = 'Unknown OS';
  let browser = 'Browser';

  // 1. Device Type & OS Detection
  if (/iPad|Tablet|(Android(?!.*Mobile))/i.test(ua)) {
    type = 'Tablet';
    os = /iPad/i.test(ua) ? 'iPadOS' : 'Android Tablet';
  } else if (/Mobi|Android|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)) {
    type = 'Mobile';
    if (/iPhone|iPod/i.test(ua)) os = 'iOS';
    else if (/Android/i.test(ua)) os = 'Android';
    else os = 'Mobile';
  } else {
    type = 'Desktop';
    if (/Windows/i.test(ua)) os = 'Windows';
    else if (/Macintosh|Mac OS X/i.test(ua)) os = 'macOS';
    else if (/Linux/i.test(ua)) os = 'Linux';
    else if (/CrOS/i.test(ua)) os = 'ChromeOS';
  }

  // 2. Browser Detection
  if (/SamsungBrowser/i.test(ua)) browser = 'Samsung Internet';
  else if (/Edg/i.test(ua)) browser = 'Microsoft Edge';
  else if (/Chrome/i.test(ua) && !/Chromium|OPR|Edg/i.test(ua)) browser = 'Google Chrome';
  else if (/Safari/i.test(ua) && !/Chrome|Chromium|OPR|Edg/i.test(ua)) browser = 'Safari';
  else if (/Firefox/i.test(ua)) browser = 'Firefox';
  else if (/OPR|Opera/i.test(ua)) browser = 'Opera';

  const screen = typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : 'unknown';
  const label = `${type} • ${os} (${browser})`;

  return { type, os, browser, label, screen };
}

// Persistent or session-based device instance identifier
export function getPersistentDeviceSessionId(): string {
  let id = sessionStorage.getItem('sonic_device_session_id');
  if (!id) {
    id = localStorage.getItem('sonic_permanent_device_id');
    if (!id) {
      id = 'dev_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36);
      try {
        localStorage.setItem('sonic_permanent_device_id', id);
      } catch (_) {}
    }
    try {
      sessionStorage.setItem('sonic_device_session_id', id);
    } catch (_) {}
  }
  return id;
}

// ==========================================
// 1. USER-SPECIFIC REALTIME LISTENERS (FIRESTORE)
// ==========================================

/**
 * Real-time listener for User Favorites
 */
export function subscribeUserFavorites(
  uid: string,
  onUpdate: (songs: Song[]) => void,
  onError?: (err: any) => void
): () => void {
  if (!uid || isFirestoreDisabled()) return () => {};

  try {
    const favRef = collection(db, 'users', uid, 'favorites');
    const q = query(favRef, orderBy('createdAt', 'desc'));

    return onSnapshot(
      q,
      (snapshot) => {
        const songs: Song[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: data.songId || docSnap.id,
            title: data.title || 'Unknown Title',
            artist: data.artist || 'Unknown Artist',
            album: data.album || '',
            duration: data.duration || '0',
            artwork: data.artwork || '',
            url: data.url || '',
            permaUrl: data.permaUrl || '',
          };
        });
        onUpdate(songs);
      },
      (err) => {
        if (onError) onError(err);
      }
    );
  } catch (err) {
    if (onError) onError(err);
    return () => {};
  }
}

/**
 * Real-time listener for User Playlists
 */
export function subscribeUserPlaylists(
  uid: string,
  onUpdate: (playlists: Playlist[]) => void,
  onError?: (err: any) => void
): () => void {
  if (!uid || isFirestoreDisabled()) return () => {};

  try {
    const plRef = collection(db, 'users', uid, 'playlists');
    const q = query(plRef, orderBy('updatedAt', 'desc'));

    return onSnapshot(
      q,
      (snapshot) => {
        const playlists: Playlist[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            userId: data.userId || uid,
            name: data.name || 'Untitled Playlist',
            description: data.description || '',
            trackCount: data.trackCount ?? data.tracksCount ?? 0,
            createdAt: data.createdAt || new Date().toISOString(),
            updatedAt: data.updatedAt || new Date().toISOString(),
          };
        });
        onUpdate(playlists);
      },
      (err) => {
        if (onError) onError(err);
      }
    );
  } catch (err) {
    if (onError) onError(err);
    return () => {};
  }
}

/**
 * Real-time listener for Recently Played Songs
 */
export function subscribeUserPlayHistory(
  uid: string,
  onUpdate: (history: RecentlyPlayedItem[]) => void,
  onError?: (err: any) => void
): () => void {
  if (!uid || isFirestoreDisabled()) return () => {};

  try {
    const ref = collection(db, 'users', uid, 'play_history');
    const q = query(ref, orderBy('playedAt', 'desc'), limit(50));

    return onSnapshot(
      q,
      (snapshot) => {
        const list: RecentlyPlayedItem[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          const parsedTimestamp =
            typeof data.timestamp === 'number'
              ? data.timestamp
              : data.playedAt
              ? new Date(data.playedAt).getTime()
              : Date.now();

          return {
            id: docSnap.id,
            song: {
              id: data.songId || docSnap.id,
              title: data.title || '',
              artist: data.artist || '',
              album: data.album || '',
              duration: data.duration || '0',
              artwork: data.artwork || '',
              url: data.url || '',
              permaUrl: data.permaUrl || '',
            },
            timestamp: parsedTimestamp,
          };
        });
        onUpdate(list);
      },
      (err) => {
        if (onError) onError(err);
      }
    );
  } catch (err) {
    if (onError) onError(err);
    return () => {};
  }
}

/**
 * Real-time listener for Search History
 */
export function subscribeUserSearchHistory(
  uid: string,
  onUpdate: (history: SearchHistoryItem[]) => void,
  onError?: (err: any) => void
): () => void {
  if (!uid || isFirestoreDisabled()) return () => {};

  try {
    const ref = collection(db, 'users', uid, 'search_history');
    const q = query(ref, orderBy('timestamp', 'desc'), limit(30));

    return onSnapshot(
      q,
      (snapshot) => {
        const list: SearchHistoryItem[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          const parsedTimestamp =
            typeof data.timestamp === 'number'
              ? data.timestamp
              : data.timestamp
              ? new Date(data.timestamp).getTime()
              : Date.now();

          return {
            id: docSnap.id,
            query: data.query || '',
            timestamp: parsedTimestamp,
          };
        });
        onUpdate(list);
      },
      (err) => {
        if (onError) onError(err);
      }
    );
  } catch (err) {
    if (onError) onError(err);
    return () => {};
  }
}

// ==========================================
// 2. REALTIME MULTI-DEVICE PRESENCE ENGINE
// ==========================================

export interface DevicePresenceRecord {
  id: string;
  sessionId: string;
  uid: string;
  email: string;
  device: 'Mobile' | 'Desktop' | 'Tablet';
  deviceDetail: string;
  browser: string;
  os: string;
  page: string;
  activeSong: string | null;
  activeArtist?: string | null;
  lastSeen: number;
  lastSeenISO: string;
  isOnline: boolean;
}

/**
 * Starts continuous heartbeat for current device session.
 * Dual-syncs to Server `/api/presence/ping` and Firestore `presence/{sessionId}`.
 */
export function startDevicePresence(params?: {
  currentPage?: string;
  currentSong?: Song | null;
}): () => void {
  const sessionId = getPersistentDeviceSessionId();
  const devInfo = detectDeviceInfo();

  const getPayload = (): DevicePresenceRecord => ({
    id: sessionId,
    sessionId,
    uid: auth.currentUser?.uid || 'guest_' + sessionId.slice(-6),
    email: auth.currentUser?.email || 'Guest Visitor',
    device: devInfo.type,
    deviceDetail: `${devInfo.os} • ${devInfo.browser}`,
    browser: devInfo.browser,
    os: devInfo.os,
    page: params?.currentPage || 'home',
    activeSong: params?.currentSong?.title || null,
    activeArtist: params?.currentSong?.artist || null,
    lastSeen: Date.now(),
    lastSeenISO: new Date().toISOString(),
    isOnline: true,
  });

  const sendHeartbeat = async () => {
    const payload = getPayload();

    // 1. Server-side Presence Ping (Always reaches server across all devices)
    try {
      fetch('/api/presence/ping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).catch(() => {});
    } catch (_) {}

    // 2. Firestore Presence Doc (if available)
    if (!isFirestoreDisabled()) {
      try {
        const presenceRef = doc(db, 'presence', sessionId);
        await setDoc(presenceRef, payload, { merge: true });
      } catch (err: any) {
        const msg = String(err?.message || err || '');
        if (msg.includes('PERMISSION_DENIED') || msg.includes('permission-denied')) {
          markFirestoreDisabled();
        }
      }
    }
  };

  // Immediate ping
  sendHeartbeat();

  // Periodic heartbeat every 6 seconds
  const interval = setInterval(sendHeartbeat, 6000);

  // Unload handler to clear presence
  const handleLeave = () => {
    try {
      const data = JSON.stringify({ sessionId });
      if (navigator.sendBeacon) {
        navigator.sendBeacon('/api/presence/leave', data);
      } else {
        fetch('/api/presence/leave', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: data,
          keepalive: true,
        }).catch(() => {});
      }

      if (!isFirestoreDisabled()) {
        const presenceRef = doc(db, 'presence', sessionId);
        deleteDoc(presenceRef).catch(() => {});
      }
    } catch (_) {}
  };

  window.addEventListener('beforeunload', handleLeave);
  window.addEventListener('pagehide', handleLeave);

  return () => {
    clearInterval(interval);
    window.removeEventListener('beforeunload', handleLeave);
    window.removeEventListener('pagehide', handleLeave);
    handleLeave();
  };
}

/**
 * Real-time subscriber for Admin Dashboard to get ALL connected devices.
 * Combines Firestore realtime listener + Server API polling for 100% accuracy.
 */
export function subscribeRealtimeActiveDevices(
  callback: (count: number, devices: DevicePresenceRecord[]) => void
): () => void {
  const mergedDevicesMap = new Map<string, DevicePresenceRecord>();

  const emitMerged = () => {
    const now = Date.now();
    const activeList: DevicePresenceRecord[] = [];

    // Filter sessions active in last 35 seconds
    mergedDevicesMap.forEach((device) => {
      if (device.lastSeen && now - device.lastSeen < 35000) {
        activeList.push(device);
      }
    });

    // Sort: most recent first
    activeList.sort((a, b) => (b.lastSeen || 0) - (a.lastSeen || 0));

    callback(activeList.length, activeList);
  };

  // 1. Fetch from Server Active Presence API every 3 seconds
  const fetchServerPresence = async () => {
    try {
      const res = await fetch('/api/presence/active');
      if (res.ok) {
        const json = await res.json();
        if (json && Array.isArray(json.users)) {
          json.users.forEach((u: any) => {
            const sid = u.sessionId || u.id;
            if (sid) {
              mergedDevicesMap.set(sid, {
                id: sid,
                sessionId: sid,
                uid: u.uid || 'guest',
                email: u.email || 'Guest Visitor',
                device: u.device || 'Desktop',
                deviceDetail: u.deviceDetail || `${u.os || ''} ${u.browser || ''}`.trim() || 'Device',
                browser: u.browser || 'Browser',
                os: u.os || 'OS',
                page: u.page || 'home',
                activeSong: u.activeSong || null,
                activeArtist: u.activeArtist || null,
                lastSeen: u.lastSeen || Date.now(),
                lastSeenISO: u.lastSeenISO || new Date().toISOString(),
                isOnline: true,
              });
            }
          });
          emitMerged();
        }
      }
    } catch (_) {}
  };

  fetchServerPresence();
  const serverTimer = setInterval(fetchServerPresence, 3000);

  // 2. Firestore Realtime Presence Listener
  let unsubFirestore = () => {};
  if (!isFirestoreDisabled()) {
    try {
      const col = collection(db, 'presence');
      unsubFirestore = onSnapshot(
        col,
        (snapshot) => {
          snapshot.docs.forEach((docSnap) => {
            const data = docSnap.data();
            const sid = docSnap.id;
            mergedDevicesMap.set(sid, {
              id: sid,
              sessionId: data.sessionId || sid,
              uid: data.uid || 'guest',
              email: data.email || 'Guest Visitor',
              device: data.device || 'Desktop',
              deviceDetail: data.deviceDetail || `${data.os || ''} ${data.browser || ''}`.trim() || 'Device',
              browser: data.browser || 'Browser',
              os: data.os || 'OS',
              page: data.page || 'home',
              activeSong: data.activeSong || null,
              activeArtist: data.activeArtist || null,
              lastSeen: data.lastSeen || Date.now(),
              lastSeenISO: data.lastSeenISO || new Date().toISOString(),
              isOnline: true,
            });
          });
          emitMerged();
        },
        (err) => {
          // Fallback to server polling
        }
      );
    } catch (_) {}
  }

  return () => {
    clearInterval(serverTimer);
    unsubFirestore();
  };
}

// ==========================================
// 3. MULTI-DEVICE EVENT TRACKING
// ==========================================

export async function logRealtimeEvent(
  eventType: 'visit' | 'search' | 'song_play' | 'song_completion' | 'download' | 'like',
  data: {
    query?: string;
    song?: Song;
    language?: string;
    page?: string;
  }
) {
  const sessionId = getPersistentDeviceSessionId();
  const devInfo = detectDeviceInfo();
  const today = new Date().toISOString().split('T')[0];
  const timestamp = new Date().toISOString();
  const timestampMs = Date.now();

  const payload = {
    id: 'evt_' + Math.random().toString(36).substring(2, 9) + '_' + timestampMs,
    eventType,
    sessionId,
    uid: auth.currentUser?.uid || 'guest_' + sessionId.slice(-6),
    email: auth.currentUser?.email || 'Guest',
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
    device: devInfo.type,
    deviceDetail: devInfo.label,
    browser: devInfo.browser,
    os: devInfo.os,
  };

  // 1. Post to Server Analytics Endpoint
  try {
    fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).catch(() => {});
  } catch (_) {}

  // 2. Dual-write to Firestore if available
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
      await setDoc(eventRef, payload);
    } catch (_) {}
  }
}
