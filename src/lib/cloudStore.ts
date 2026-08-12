import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  getDocs,
  deleteDoc,
  query,
  orderBy,
  limit,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { db, markFirestoreDisabled, isFirestoreDisabled as checkIsDisabled } from './firebase';
import { Song, Playlist, PlaylistTrack, SearchHistoryItem, RecentlyPlayedItem, DownloadedSong } from '../types';

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

// ==========================================
// USER PROFILE
// ==========================================
export async function syncUserProfile(uid: string, email: string, displayName?: string) {
  if (checkIsDisabled()) return;
  try {
    const userRef = doc(db, 'users', uid);
    const snap = await getDoc(userRef);
    const now = new Date().toISOString();

    if (!snap.exists()) {
      await setDoc(userRef, {
        email,
        displayName: displayName || email.split('@')[0],
        createdAt: now,
        lastLoginAt: now,
      });
    } else {
      await updateDoc(userRef, {
        lastLoginAt: now,
        ...(displayName ? { displayName } : {}),
      });
    }
  } catch (err) {
    checkFirestoreErr(err);
  }
}

// ==========================================
// FAVORITES
// ==========================================
export async function getCloudFavorites(uid: string): Promise<Song[]> {
  if (checkIsDisabled()) return [];
  try {
    const favRef = collection(db, 'users', uid, 'favorites');
    const q = query(favRef, orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: data.songId || docSnap.id,
        title: data.title,
        artist: data.artist,
        album: data.album || '',
        duration: data.duration || '0',
        artwork: data.artwork || '',
        url: data.url || '',
        permaUrl: data.permaUrl || '',
      };
    });
  } catch (err) {
    checkFirestoreErr(err);
    return [];
  }
}

export async function addCloudFavorite(uid: string, song: Song): Promise<void> {
  if (checkIsDisabled()) return;
  try {
    const favRef = doc(db, 'users', uid, 'favorites', song.id);
    await setDoc(favRef, {
      songId: song.id,
      title: song.title,
      artist: song.artist,
      album: song.album || '',
      artwork: song.artwork || '',
      duration: song.duration || '0',
      url: song.url || '',
      permaUrl: song.permaUrl || '',
      createdAt: new Date().toISOString(),
    });
  } catch (err) {
    checkFirestoreErr(err);
  }
}

export async function removeCloudFavorite(uid: string, songId: string): Promise<void> {
  if (checkIsDisabled()) return;
  try {
    const favRef = doc(db, 'users', uid, 'favorites', songId);
    await deleteDoc(favRef);
  } catch (err) {
    checkFirestoreErr(err);
  }
}

// ==========================================
// SEARCH HISTORY
// ==========================================
export async function getCloudSearchHistory(uid: string): Promise<SearchHistoryItem[]> {
  if (checkIsDisabled()) return [];
  try {
    const ref = collection(db, 'users', uid, 'search_history');
    const q = query(ref, orderBy('lastSearchedAt', 'desc'), limit(20));
    const snap = await getDocs(q);
    return snap.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        query: data.query,
        timestamp: data.lastSearchedAt ? new Date(data.lastSearchedAt).getTime() : Date.now(),
      };
    });
  } catch (err) {
    checkFirestoreErr(err);
    return [];
  }
}

export async function addCloudSearchHistory(uid: string, searchQuery: string): Promise<void> {
  if (checkIsDisabled() || !searchQuery.trim()) return;
  try {
    const cleanQuery = searchQuery.trim();
    // Document ID based on slugified query to prevent duplicates easily
    const docId = cleanQuery.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 50);
    const ref = doc(db, 'users', uid, 'search_history', docId);
    const snap = await getDoc(ref);

    if (snap.exists()) {
      await updateDoc(ref, {
        searchCount: (snap.data().searchCount || 1) + 1,
        lastSearchedAt: new Date().toISOString(),
      });
    } else {
      await setDoc(ref, {
        query: cleanQuery,
        searchCount: 1,
        lastSearchedAt: new Date().toISOString(),
      });
    }
  } catch (err) {
    checkFirestoreErr(err);
  }
}

export async function removeCloudSearchHistoryItem(uid: string, docId: string): Promise<void> {
  if (checkIsDisabled()) return;
  try {
    await deleteDoc(doc(db, 'users', uid, 'search_history', docId));
  } catch (err) {
    checkFirestoreErr(err);
  }
}

// ==========================================
// PLAY HISTORY
// ==========================================
export async function getCloudPlayHistory(uid: string): Promise<RecentlyPlayedItem[]> {
  if (checkIsDisabled()) return [];
  try {
    const ref = collection(db, 'users', uid, 'play_history');
    const q = query(ref, orderBy('playedAt', 'desc'), limit(30));
    const snap = await getDocs(q);
    return snap.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        song: {
          id: data.songId,
          title: data.title,
          artist: data.artist,
          album: data.album || '',
          duration: data.duration || '0',
          artwork: data.artwork || '',
          url: data.url || '',
          permaUrl: data.permaUrl || '',
        },
        timestamp: data.playedAt ? new Date(data.playedAt).getTime() : Date.now(),
      };
    });
  } catch (err) {
    checkFirestoreErr(err);
    return [];
  }
}

export async function addCloudPlayHistory(uid: string, song: Song): Promise<void> {
  if (checkIsDisabled()) return;
  try {
    const ref = doc(db, 'users', uid, 'play_history', song.id);
    await setDoc(ref, {
      songId: song.id,
      title: song.title,
      artist: song.artist,
      album: song.album || '',
      artwork: song.artwork || '',
      duration: song.duration || '0',
      url: song.url || '',
      permaUrl: song.permaUrl || '',
      playedAt: new Date().toISOString(),
    });
  } catch (err) {
    checkFirestoreErr(err);
  }
}

// ==========================================
// PLAYLISTS
// ==========================================
export async function getCloudPlaylists(uid: string): Promise<Playlist[]> {
  if (checkIsDisabled()) return [];
  try {
    const ref = collection(db, 'users', uid, 'playlists');
    const q = query(ref, orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        userId: uid,
        name: data.name,
        description: data.description || '',
        trackCount: data.trackCount || 0,
        createdAt: data.createdAt || new Date().toISOString(),
        updatedAt: data.updatedAt || new Date().toISOString(),
      };
    });
  } catch (err) {
    checkFirestoreErr(err);
    return [];
  }
}

export async function createCloudPlaylist(uid: string, name: string, description?: string): Promise<Playlist | null> {
  if (checkIsDisabled()) return null;
  try {
    const newRef = doc(collection(db, 'users', uid, 'playlists'));
    const now = new Date().toISOString();
    const playlistData: Playlist = {
      id: newRef.id,
      userId: uid,
      name: name.trim(),
      description: description?.trim() || '',
      trackCount: 0,
      createdAt: now,
      updatedAt: now,
    };
    await setDoc(newRef, {
      name: playlistData.name,
      description: playlistData.description,
      trackCount: 0,
      createdAt: now,
      updatedAt: now,
    });
    return playlistData;
  } catch (err) {
    checkFirestoreErr(err);
    return null;
  }
}

export async function deleteCloudPlaylist(uid: string, playlistId: string): Promise<void> {
  if (checkIsDisabled()) return;
  try {
    await deleteDoc(doc(db, 'users', uid, 'playlists', playlistId));
  } catch (err) {
    checkFirestoreErr(err);
  }
}

export async function getCloudPlaylistTracks(uid: string, playlistId: string): Promise<PlaylistTrack[]> {
  if (checkIsDisabled()) return [];
  try {
    const ref = collection(db, 'users', uid, 'playlists', playlistId, 'tracks');
    const q = query(ref, orderBy('position', 'asc'));
    const snap = await getDocs(q);
    return snap.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        songId: data.songId,
        title: data.title,
        artist: data.artist,
        album: data.album || '',
        artwork: data.artwork || '',
        duration: data.duration || '0',
        url: data.url || '',
        position: data.position || 0,
        addedAt: data.addedAt || new Date().toISOString(),
      };
    });
  } catch (err) {
    checkFirestoreErr(err);
    return [];
  }
}

export async function addSongToCloudPlaylist(uid: string, playlistId: string, song: Song): Promise<void> {
  if (checkIsDisabled()) return;
  try {
    const tracksRef = collection(db, 'users', uid, 'playlists', playlistId, 'tracks');
    const tracksSnap = await getDocs(tracksRef);
    const trackCount = tracksSnap.size;

    const trackDocRef = doc(tracksRef, song.id);
    await setDoc(trackDocRef, {
      songId: song.id,
      title: song.title,
      artist: song.artist,
      album: song.album || '',
      artwork: song.artwork || '',
      duration: song.duration || '0',
      url: song.url || '',
      position: trackCount + 1,
      addedAt: new Date().toISOString(),
    });

    // Update trackCount on playlist document
    await updateDoc(doc(db, 'users', uid, 'playlists', playlistId), {
      trackCount: trackCount + 1,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    checkFirestoreErr(err);
  }
}

export async function removeSongFromCloudPlaylist(uid: string, playlistId: string, songId: string): Promise<void> {
  if (checkIsDisabled()) return;
  try {
    await deleteDoc(doc(db, 'users', uid, 'playlists', playlistId, 'tracks', songId));
    const tracksSnap = await getDocs(collection(db, 'users', uid, 'playlists', playlistId, 'tracks'));
    await updateDoc(doc(db, 'users', uid, 'playlists', playlistId), {
      trackCount: tracksSnap.size,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    checkFirestoreErr(err);
  }
}

// ==========================================
// DOWNLOAD METADATA (Sync metadata to cloud)
// ==========================================
export async function syncCloudDownloadMetadata(uid: string, songs: DownloadedSong[]): Promise<void> {
  if (checkIsDisabled()) return;
  try {
    const batch = writeBatch(db);
    songs.forEach((song) => {
      const ref = doc(db, 'users', uid, 'download_metadata', song.id);
      batch.set(ref, {
        songId: song.id,
        title: song.title,
        artist: song.artist,
        album: song.album || '',
        artwork: song.artwork || '',
        duration: song.duration || '0',
        downloadedAt: new Date(song.timestamp).toISOString(),
      });
    });
    await batch.commit();
  } catch (err) {
    checkFirestoreErr(err);
  }
}

// ==========================================
// LOCAL TO CLOUD MIGRATION
// ==========================================
export async function migrateLocalDataToCloud(
  uid: string,
  localFavorites: Song[],
  localHistory: SearchHistoryItem[],
  localPlayed: RecentlyPlayedItem[],
  localDownloads: DownloadedSong[]
): Promise<void> {
  if (checkIsDisabled()) return;
  try {
    const batch = writeBatch(db);

    // 1. Local Favorites
    localFavorites.forEach((song) => {
      const ref = doc(db, 'users', uid, 'favorites', song.id);
      batch.set(
        ref,
        {
          songId: song.id,
          title: song.title,
          artist: song.artist,
          album: song.album || '',
          artwork: song.artwork || '',
          duration: song.duration || '0',
          url: song.url || '',
          permaUrl: song.permaUrl || '',
          createdAt: new Date().toISOString(),
        },
        { merge: true }
      );
    });

    // 2. Local Search History
    localHistory.forEach((item) => {
      const docId = item.query.trim().toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 50);
      const ref = doc(db, 'users', uid, 'search_history', docId);
      batch.set(
        ref,
        {
          query: item.query,
          searchCount: 1,
          lastSearchedAt: new Date(item.timestamp).toISOString(),
        },
        { merge: true }
      );
    });

    // 3. Local Recently Played
    localPlayed.forEach((item) => {
      const ref = doc(db, 'users', uid, 'play_history', item.song.id);
      batch.set(
        ref,
        {
          songId: item.song.id,
          title: item.song.title,
          artist: item.song.artist,
          album: item.song.album || '',
          artwork: item.song.artwork || '',
          duration: item.song.duration || '0',
          url: item.song.url || '',
          permaUrl: item.song.permaUrl || '',
          playedAt: new Date(item.timestamp).toISOString(),
        },
        { merge: true }
      );
    });

    // 4. Download Metadata
    localDownloads.forEach((song) => {
      const ref = doc(db, 'users', uid, 'download_metadata', song.id);
      batch.set(
        ref,
        {
          songId: song.id,
          title: song.title,
          artist: song.artist,
          album: song.album || '',
          artwork: song.artwork || '',
          duration: song.duration || '0',
          downloadedAt: new Date(song.timestamp).toISOString(),
        },
        { merge: true }
      );
    });

    await batch.commit();
  } catch (err) {
    checkFirestoreErr(err);
  }
}
