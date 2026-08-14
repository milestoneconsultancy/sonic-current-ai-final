import { DownloadedSong, Song } from '../types';

const DB_NAME = 'SonicCurrentDB';
const DB_VERSION = 1;
const STORE_NAME = 'downloads';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export function verifyAudioBlobPlayback(blob: Blob): Promise<boolean> {
  return new Promise((resolve) => {
    if (!blob || !(blob instanceof Blob) || blob.size < 1000) {
      resolve(false);
      return;
    }
    const blobUrl = URL.createObjectURL(blob);
    const audio = new Audio();

    let isResolved = false;
    const cleanup = () => {
      audio.removeEventListener('loadedmetadata', onLoaded);
      audio.removeEventListener('error', onError);
      URL.revokeObjectURL(blobUrl);
    };

    const onLoaded = () => {
      if (!isResolved) {
        isResolved = true;
        cleanup();
        resolve(true);
      }
    };

    const onError = () => {
      if (!isResolved) {
        isResolved = true;
        cleanup();
        resolve(false);
      }
    };

    audio.addEventListener('loadedmetadata', onLoaded);
    audio.addEventListener('error', onError);

    setTimeout(() => {
      if (!isResolved) {
        isResolved = true;
        cleanup();
        resolve(blob.size > 1000);
      }
    }, 2500);

    audio.src = blobUrl;
    audio.load();
  });
}

export async function saveDownloadedSong(song: Song, audioBlob: Blob): Promise<DownloadedSong> {
  console.log(`[OFFLINE] IndexedDB transaction started for song: "${song.title}" (ID: ${song.id})`);

  if (!audioBlob || !(audioBlob instanceof Blob) || audioBlob.size < 1000) {
    console.error('[OFFLINE] Save aborted: Invalid audio Blob provided', audioBlob);
    throw new Error('Cannot save offline: Audio data is missing or corrupted.');
  }

  const db = await openDB();
  const downloadedItem: DownloadedSong = {
    id: song.id,
    title: song.title,
    artist: song.artist,
    album: song.album,
    artwork: song.artwork,
    duration: song.duration,
    fileSize: audioBlob.size,
    timestamp: Date.now(),
    audioBlob: audioBlob,
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const putRequest = store.put(downloadedItem);

    tx.oncomplete = async () => {
      console.log(`[OFFLINE] IndexedDB transaction completed for song ID: ${song.id}`);

      // Mandatory read-back verification
      try {
        console.log(`[OFFLINE] read-back verification starting for song ID: ${song.id}`);
        const verifiedRecord = await getDownloadedSong(song.id);
        if (
          verifiedRecord &&
          verifiedRecord.audioBlob &&
          verifiedRecord.audioBlob instanceof Blob &&
          verifiedRecord.audioBlob.size > 0
        ) {
          console.log(`[OFFLINE] Read-back verification SUCCEEDED (${verifiedRecord.audioBlob.size} bytes stored). Testing playback metadata...`);

          const isPlayable = await verifyAudioBlobPlayback(verifiedRecord.audioBlob);
          if (isPlayable) {
            console.log(`[OFFLINE] Playback metadata verification SUCCEEDED for song ID: ${song.id}`);
            resolve(verifiedRecord);
          } else {
            console.warn(`[OFFLINE] Playback metadata test yielded non-fatal warning, resolving stored record (${verifiedRecord.audioBlob.size} bytes)`);
            resolve(verifiedRecord);
          }
        } else {
          console.error(`[OFFLINE] Read-back verification FAILED: Record in IndexedDB missing or empty blob`);
          reject(new Error('IndexedDB storage verification failed: Stored record is incomplete.'));
        }
      } catch (verifyErr) {
        console.error('[OFFLINE] Read-back error:', verifyErr);
        reject(new Error('IndexedDB verification failed post-write.'));
      }
    };

    tx.onerror = () => {
      console.error('[OFFLINE] IndexedDB transaction error:', tx.error || putRequest.error);
      reject(tx.error || putRequest.error || new Error('IndexedDB transaction failed.'));
    };

    tx.onabort = () => {
      console.error('[OFFLINE] IndexedDB transaction aborted');
      reject(new Error('IndexedDB write transaction was aborted.'));
    };
  });
}

export async function getDownloadedSong(id: string): Promise<DownloadedSong | null> {
  if (!id) return null;
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Smart lookup to find downloaded song by ID or matching title + artist
 * This ensures offline playback works even if song metadata is slightly different.
 */
export async function findDownloadedSong(song: Song | { id?: string; title?: string; artist?: string }): Promise<DownloadedSong | null> {
  if (!song) return null;

  // 1. Try direct ID lookup
  if (song.id) {
    const direct = await getDownloadedSong(song.id);
    if (direct && direct.audioBlob && direct.audioBlob.size > 0) {
      return direct;
    }
  }

  // 2. Try canonical title + artist match across all downloaded tracks
  if (song.title) {
    const all = await getAllDownloadedSongs();
    const targetTitle = (song.title || '').trim().toLowerCase();
    const targetArtist = (song.artist || '').trim().toLowerCase();

    const matched = all.find((d) => {
      if (song.id && d.id === song.id) return true;
      const dTitle = (d.title || '').trim().toLowerCase();
      const dArtist = (d.artist || '').trim().toLowerCase();
      if (targetTitle.length > 2 && dTitle === targetTitle && (!targetArtist || !dArtist || dArtist === targetArtist)) {
        return true;
      }
      return false;
    });

    if (matched && matched.audioBlob && matched.audioBlob.size > 0) {
      return matched;
    }
  }

  return null;
}

export async function getAllDownloadedSongs(): Promise<DownloadedSong[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      const list = (request.result || []) as DownloadedSong[];
      const validList = list.filter((item) => item && item.audioBlob && item.audioBlob.size > 0);
      validList.sort((a, b) => b.timestamp - a.timestamp);
      resolve(validList);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function deleteDownloadedSong(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function clearAllDownloads(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.clear();

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getStorageStats(): Promise<{ count: number; totalBytes: number; formattedSize: string }> {
  try {
    const songs = await getAllDownloadedSongs();
    const totalBytes = songs.reduce((acc, song) => acc + (song.fileSize || song.audioBlob?.size || 0), 0);
    
    let formattedSize = '0 B';
    if (totalBytes > 1024 * 1024 * 1024) {
      formattedSize = `${(totalBytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
    } else if (totalBytes > 1024 * 1024) {
      formattedSize = `${(totalBytes / (1024 * 1024)).toFixed(1)} MB`;
    } else if (totalBytes > 1024) {
      formattedSize = `${(totalBytes / 1024).toFixed(0)} KB`;
    } else {
      formattedSize = `${totalBytes} B`;
    }

    return {
      count: songs.length,
      totalBytes,
      formattedSize,
    };
  } catch (err) {
    console.error('Failed to get storage stats:', err);
    return { count: 0, totalBytes: 0, formattedSize: '0 MB' };
  }
}
