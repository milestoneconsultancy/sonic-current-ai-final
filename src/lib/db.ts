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

export async function saveDownloadedSong(song: Song, audioBlob: Blob): Promise<DownloadedSong> {
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
    const request = store.put(downloadedItem);

    request.onsuccess = () => resolve(downloadedItem);
    request.onerror = () => reject(request.error);
  });
}

export async function getDownloadedSong(id: string): Promise<DownloadedSong | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

export async function getAllDownloadedSongs(): Promise<DownloadedSong[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      const list = (request.result || []) as DownloadedSong[];
      // Sort newest first
      list.sort((a, b) => b.timestamp - a.timestamp);
      resolve(list);
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
    const totalBytes = songs.reduce((acc, song) => acc + (song.fileSize || 0), 0);
    
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
