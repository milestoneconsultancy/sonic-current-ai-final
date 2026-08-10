import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Song,
  DownloadedSong,
  SearchHistoryItem,
  RecentlyPlayedItem,
  TabType,
  RepeatMode,
} from './types';
import {
  getFavorites,
  toggleFavorite,
  getSearchHistory,
  addSearchHistory,
  removeSearchHistoryItem,
  clearSearchHistory,
  getRecentlyPlayed,
  addRecentlyPlayed,
  removeRecentlyPlayedItem,
  clearRecentlyPlayed,
  getPlayerSettings,
  savePlayerSettings,
  getActivePlayerState,
  saveActivePlayerState,
} from './lib/storage';
import {
  saveDownloadedSong,
  getDownloadedSong,
  getAllDownloadedSongs,
  deleteDownloadedSong,
  clearAllDownloads,
  getStorageStats,
} from './lib/db';

import { Sidebar } from './components/Sidebar';
import { BottomNav } from './components/BottomNav';
import { HeaderBar } from './components/HeaderBar';
import { NowPlayingBar } from './components/NowPlayingBar';
import { FullPlayerModal } from './components/FullPlayerModal';
import { QueueDrawer } from './components/QueueDrawer';

import { HomeView } from './views/HomeView';
import { SearchView } from './views/SearchView';
import { HistoryView } from './views/HistoryView';
import { FavoritesView } from './views/FavoritesView';
import { DownloadsView } from './views/DownloadsView';

export default function App() {
  // Navigation
  const [currentTab, setCurrentTab] = useState<TabType>('home');

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Song[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [activeContextQuery, setActiveContextQuery] = useState<string>('');
  const [searchPage, setSearchPage] = useState<number>(1);
  const [hasMoreResults, setHasMoreResults] = useState<boolean>(true);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);

  // Player State
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  // Audio & Settings
  const initialSettings = getPlayerSettings();
  const [volume, setVolume] = useState(initialSettings.volume);
  const [isMuted, setIsMuted] = useState(initialSettings.isMuted);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>(initialSettings.repeatMode);
  const [shuffleMode, setShuffleMode] = useState<boolean>(initialSettings.shuffleMode);

  // Queue
  const [queue, setQueue] = useState<Song[]>([]);
  const [queueIndex, setQueueIndex] = useState<number>(0);
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [isFullPlayerOpen, setIsFullPlayerOpen] = useState(false);

  // Storage & Lists
  const [favorites, setFavorites] = useState<Song[]>(getFavorites());
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>(getSearchHistory());
  const [recentlyPlayed, setRecentlyPlayed] = useState<RecentlyPlayedItem[]>(getRecentlyPlayed());

  // Downloads (IndexedDB)
  const [downloadedSongs, setDownloadedSongs] = useState<DownloadedSong[]>([]);
  const [downloadingSet, setDownloadingSet] = useState<Set<string>>(new Set());
  const [storageStats, setStorageStats] = useState({ count: 0, totalBytes: 0, formattedSize: '0 B' });

  // Network Offline State
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Ref - Persistent HTML5 Audio instance across re-renders/visibility changes
  const audioRef = useRef<HTMLAudioElement | null>(null);
  if (!audioRef.current) {
    audioRef.current = new Audio();
  }

  // Restore saved player state on app launch
  useEffect(() => {
    const saved = getActivePlayerState();
    if (saved && saved.currentSong) {
      setCurrentSong(saved.currentSong);
      if (saved.queue && saved.queue.length > 0) {
        setQueue(saved.queue);
        setQueueIndex(saved.queueIndex || 0);
      }
      if (saved.currentTime > 0) {
        setCurrentTime(saved.currentTime);
      }
    }
  }, []);

  // Save player state periodically on updates
  useEffect(() => {
    saveActivePlayerState({
      currentSong,
      currentTime,
      queue,
      queueIndex,
      repeatMode,
      shuffleMode,
    });
  }, [currentSong, currentTime, queue, queueIndex, repeatMode, shuffleMode]);

  // Derived sets for O(1) checks
  const favoritesSet = new Set(favorites.map((f) => f.id));
  const downloadedSet = new Set(downloadedSongs.map((d) => d.id));

  // Initialize IndexedDB downloads list & stats
  const refreshDownloads = useCallback(async () => {
    try {
      const songs = await getAllDownloadedSongs();
      setDownloadedSongs(songs);
      const stats = await getStorageStats();
      setStorageStats(stats);
    } catch (err) {
      console.error('Failed to load downloads from IndexedDB:', err);
    }
  }, []);

  useEffect(() => {
    refreshDownloads();
  }, [refreshDownloads]);

  // Handle Search API Call (Debounced)
  const executeSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setSearchError(null);
      setIsSearching(false);
      setSearchPage(1);
      setHasMoreResults(true);
      return;
    }

    if (!navigator.onLine) {
      setIsSearching(false);
      const q = query.trim().toLowerCase();
      const matched: Song[] = downloadedSongs
        .filter(
          (d) =>
            d.title.toLowerCase().includes(q) ||
            d.artist.toLowerCase().includes(q) ||
            d.album.toLowerCase().includes(q)
        )
        .map((d) => ({
          id: d.id,
          title: d.title,
          artist: d.artist,
          album: d.album,
          duration: d.duration,
          artwork: d.artwork,
          url: '',
          permaUrl: '',
        }));

      setSearchResults(matched);
      setSearchPage(1);
      setHasMoreResults(false);
      if (matched.length === 0) {
        setSearchError(`You are offline. No downloaded songs match "${query.trim()}".`);
      } else {
        setSearchError(null);
      }
      return;
    }

    setIsSearching(true);
    setSearchError(null);
    setSearchPage(1);
    setHasMoreResults(true);

    try {
      const response = await fetch(`/api/result?query=${encodeURIComponent(query.trim())}&page=1`);
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      if (!Array.isArray(data) || data.length === 0) {
        setSearchResults([]);
        setSearchError(`No songs found for "${query.trim()}".`);
        setHasMoreResults(false);
      } else {
        const songs: Song[] = data.map((item: any) => ({
          id: String(item.id || ''),
          title: String(item.title || item.song || 'Unknown Title'),
          artist: String(item.artist || item.singers || 'Unknown Artist'),
          album: String(item.album || ''),
          duration: String(item.duration || '0'),
          artwork: String(item.artwork || item.image || ''),
          url: String(item.url || item.media_url || ''),
          permaUrl: String(item.perma_url || ''),
          contextLabel: item.contextLabel ? String(item.contextLabel) : undefined,
        }));

        setSearchResults(songs);
        setSearchPage(1);
        setHasMoreResults(songs.length >= 5);

        let detectedContext = '';
        const headerContext = response.headers.get('X-Context-Label');
        if (headerContext) {
          try {
            detectedContext = decodeURIComponent(headerContext);
          } catch (e) {
            detectedContext = headerContext;
          }
        }
        if (!detectedContext && songs.length > 0 && songs[0].contextLabel) {
          detectedContext = songs[0].contextLabel;
        }

        if (detectedContext) {
          setActiveContextQuery(detectedContext);
        } else {
          setActiveContextQuery(query.trim());
        }

        // Update search history in localStorage
        const updatedHistory = addSearchHistory(query.trim());
        setSearchHistory(updatedHistory);
      }
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : 'Search failed.');
      setHasMoreResults(false);
    } finally {
      setIsSearching(false);
    }
  };

  const handleLoadMoreResults = async () => {
    if (isLoadingMore || !hasMoreResults || !searchQuery.trim() || !navigator.onLine) return;
    setIsLoadingMore(true);
    const nextPage = searchPage + 1;

    try {
      const response = await fetch(
        `/api/result?query=${encodeURIComponent(searchQuery.trim())}&page=${nextPage}`
      );
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          const newSongs: Song[] = data.map((item: any) => ({
            id: String(item.id || ''),
            title: String(item.title || item.song || 'Unknown Title'),
            artist: String(item.artist || item.singers || 'Unknown Artist'),
            album: String(item.album || ''),
            duration: String(item.duration || '0'),
            artwork: String(item.artwork || item.image || ''),
            url: String(item.url || item.media_url || ''),
            permaUrl: String(item.perma_url || ''),
            contextLabel: item.contextLabel ? String(item.contextLabel) : undefined,
          }));

          setSearchResults((prev) => {
            const existingIds = new Set(prev.map((s) => s.id));
            const fresh = newSongs.filter((s) => !existingIds.has(s.id));
            if (fresh.length === 0) {
              setHasMoreResults(false);
              return prev;
            }
            return [...prev, ...fresh];
          });
          setSearchPage(nextPage);
          setHasMoreResults(newSongs.length >= 5);
        } else {
          setHasMoreResults(false);
        }
      } else {
        setHasMoreResults(false);
      }
    } catch (err) {
      console.error('Failed to load more results:', err);
    } finally {
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim()) {
        executeSearch(searchQuery);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Audio Element Setup & Event Listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, []);

  // Handle Play Song
  const handlePlaySong = async (
    song: Song,
    indexInContext?: number,
    isExistingQueue: boolean = false
  ) => {
    if (!audioRef.current) return;

    try {
      // Check if song is downloaded in IndexedDB for offline play
      const downloaded = await getDownloadedSong(song.id);
      let playableUrl = song.url;

      if (downloaded) {
        playableUrl = URL.createObjectURL(downloaded.audioBlob);
      } else if (!navigator.onLine) {
        setSearchError('You are currently offline. Connect to the internet or play downloaded songs.');
        setIsPlaying(false);
        return;
      } else if (song.url.startsWith('http://') || song.url.startsWith('https://')) {
        playableUrl = song.url;
      } else if (!song.url.startsWith('blob:') && song.url) {
        playableUrl = `/api/audio?url=${encodeURIComponent(song.url)}`;
      }

      setCurrentSong(song);
      setIsPlaying(true);

      // Add to recently played
      const updatedRP = addRecentlyPlayed(song);
      setRecentlyPlayed(updatedRP);

      // Update queue
      if (isExistingQueue && typeof indexInContext === 'number') {
        setQueueIndex(indexInContext);
      } else if (typeof indexInContext === 'number' && searchResults.length > 0) {
        setQueue(searchResults);
        setQueueIndex(indexInContext);
      } else {
        // If single song clicked, keep/append to queue
        const existingIdx = queue.findIndex((q) => q.id === song.id);
        if (existingIdx !== -1) {
          setQueueIndex(existingIdx);
        } else {
          setQueue((prev) => [...prev, song]);
          setQueueIndex(queue.length);
        }
      }

      const audio = audioRef.current;
      if (audio.src !== playableUrl && !audio.src.endsWith(playableUrl)) {
        audio.src = playableUrl;
        audio.volume = isMuted ? 0 : volume;
        audio.load();
      }

      await audio.play();
    } catch (err) {
      console.error('Audio playback error:', err);
      setIsPlaying(false);
    }
  };

  // Helper next/previous handlers
  const handleNextTrack = useCallback(() => {
    if (queue.length === 0) return;
    const nextIndex = (queueIndex + 1) % queue.length;
    setQueueIndex(nextIndex);
    handlePlaySong(queue[nextIndex], nextIndex, true);
  }, [queue, queueIndex]);

  const handlePreviousTrack = useCallback(() => {
    if (queue.length === 0) return;
    const prevIndex = (queueIndex - 1 + queue.length) % queue.length;
    setQueueIndex(prevIndex);
    handlePlaySong(queue[prevIndex], prevIndex, true);
  }, [queue, queueIndex]);

  // Media Session API Integration for Background & Lock Screen Playback
  useEffect(() => {
    if (!('mediaSession' in navigator) || !currentSong) return;

    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentSong.title,
      artist: currentSong.artist,
      album: currentSong.album || 'SONIC CURRENT',
      artwork: [
        {
          src: currentSong.artwork || '/icon.png',
          sizes: '512x512',
          type: 'image/png',
        },
      ],
    });

    const setHandler = (action: MediaSessionAction, handler: ((details?: any) => void) | null) => {
      try {
        navigator.mediaSession.setActionHandler(action, handler);
      } catch (e) {
        // action not supported
      }
    };

    setHandler('play', () => {
      if (audioRef.current) {
        audioRef.current.play().then(() => setIsPlaying(true)).catch(console.error);
      }
    });

    setHandler('pause', () => {
      if (audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
      }
    });

    setHandler('previoustrack', () => {
      handlePreviousTrack();
    });

    setHandler('nexttrack', () => {
      handleNextTrack();
    });

    setHandler('seekbackward', (details) => {
      if (audioRef.current) {
        const offset = details.seekOffset || 10;
        audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - offset);
      }
    });

    setHandler('seekforward', (details) => {
      if (audioRef.current) {
        const offset = details.seekOffset || 10;
        audioRef.current.currentTime = Math.min(
          audioRef.current.duration || 0,
          audioRef.current.currentTime + offset
        );
      }
    });

    setHandler('seekto', (details) => {
      if (details.seekTime !== undefined && audioRef.current) {
        audioRef.current.currentTime = details.seekTime;
      }
    });
  }, [currentSong, isPlaying, handleNextTrack, handlePreviousTrack]);

  // Global Keyboard Navigation (Space bar play/pause when input is not focused)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = (document.activeElement?.tagName || '').toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea') return;

      if (e.code === 'Space') {
        e.preventDefault();
        if (audioRef.current) {
          if (isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
          } else if (currentSong) {
            audioRef.current.play().then(() => setIsPlaying(true)).catch(console.error);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, currentSong]);

  // Smart Context Auto-Next Logic
  const handleAudioEnded = useCallback(async () => {
    if (!audioRef.current || !currentSong) return;

    // 1. Repeat ONE
    if (repeatMode === 'one') {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(console.error);
      return;
    }

    // 2. Queue navigation
    let nextIndex = queueIndex + 1;

    if (shuffleMode && queue.length > 1) {
      let randIdx = Math.floor(Math.random() * queue.length);
      while (randIdx === queueIndex) {
        randIdx = Math.floor(Math.random() * queue.length);
      }
      nextIndex = randIdx;
    }

    if (nextIndex < queue.length) {
      const nextSong = queue[nextIndex];
      setQueueIndex(nextIndex);
      handlePlaySong(nextSong, nextIndex, true);
      return;
    }

    // 3. Repeat ALL
    if (repeatMode === 'all' && queue.length > 0) {
      setQueueIndex(0);
      handlePlaySong(queue[0], 0, true);
      return;
    }

    // 4. SMART CONTEXT AUTO-EXTEND QUEUE: Fetch related tracks using song context!
    if (!navigator.onLine) {
      setIsPlaying(false);
      return;
    }

    try {
      const contextTerm = activeContextQuery || currentSong.artist || currentSong.title;
      if (contextTerm) {
        const nextPage = Math.floor(queue.length / 40) + 1;
        const response = await fetch(
          `/api/result?query=${encodeURIComponent(contextTerm.trim())}&page=${nextPage}`
        );
        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data) && data.length > 0) {
            const relatedSongs: Song[] = data.map((item: any) => ({
              id: String(item.id || ''),
              title: String(item.title || item.song || 'Unknown Title'),
              artist: String(item.artist || item.singers || 'Unknown Artist'),
              album: String(item.album || ''),
              duration: String(item.duration || '0'),
              artwork: String(item.artwork || item.image || ''),
              url: String(item.url || item.media_url || ''),
              permaUrl: String(item.perma_url || ''),
            }));

            // Filter out tracks already in current queue (by id or title+artist)
            const freshSongs = relatedSongs.filter(
              (s) =>
                !queue.some(
                  (q) =>
                    q.id === s.id ||
                    (q.title.toLowerCase().trim() === s.title.toLowerCase().trim() &&
                      q.artist.toLowerCase().trim() === s.artist.toLowerCase().trim())
                )
            );

            if (freshSongs.length > 0) {
              const newNext = freshSongs[0];
              const updatedQueue = [...queue, ...freshSongs];
              setQueue(updatedQueue);
              setQueueIndex(queue.length);
              handlePlaySong(newNext, queue.length, true);
              return;
            }
          }
        }
      }
    } catch (err) {
      console.error('Smart auto-next fetch failed:', err);
    }

    // Fallback: stop playback
    setIsPlaying(false);
  }, [repeatMode, queue, queueIndex, shuffleMode, currentSong, activeContextQuery]);

  // Bind audio ended listener
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.onended = handleAudioEnded;
    return () => {
      audio.onended = null;
    };
  }, [handleAudioEnded]);

  // Play / Pause Toggle
  const handlePlayPause = () => {
    if (!audioRef.current) return;
    if (!currentSong) {
      if (searchResults.length > 0) {
        handlePlaySong(searchResults[0], 0);
      }
      return;
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(console.error);
    }
  };

  // Seek / Scrubbing
  const handleSeek = (seconds: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = seconds;
      setCurrentTime(seconds);
    }
  };

  // Volume & Mute Controls
  const handleVolumeChange = (val: number) => {
    setVolume(val);
    if (isMuted && val > 0) setIsMuted(false);
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : val;
    }
    savePlayerSettings({ volume: val, isMuted: isMuted && val > 0 ? false : isMuted });
  };

  const handleToggleMute = () => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    if (audioRef.current) {
      audioRef.current.volume = nextMute ? 0 : volume;
    }
    savePlayerSettings({ isMuted: nextMute });
  };

  // Repeat & Shuffle Modes
  const handleToggleRepeat = () => {
    const modes: RepeatMode[] = ['off', 'one', 'all'];
    const nextMode = modes[(modes.indexOf(repeatMode) + 1) % modes.length];
    setRepeatMode(nextMode);
    savePlayerSettings({ repeatMode: nextMode });
  };

  const handleToggleShuffle = () => {
    const nextShuffle = !shuffleMode;
    setShuffleMode(nextShuffle);
    savePlayerSettings({ shuffleMode: nextShuffle });
  };

  // Favorites Management
  const handleToggleFavoriteSong = (song: Song) => {
    toggleFavorite(song);
    setFavorites(getFavorites());
  };

  // Download Management (IndexedDB)
  const handleDownloadSong = async (song: Song) => {
    if (downloadedSet.has(song.id) || downloadingSet.has(song.id)) return;

    setDownloadingSet((prev) => new Set(prev).add(song.id));

    try {
      const audioUrl = `/api/audio?url=${encodeURIComponent(song.url)}`;
      const response = await fetch(audioUrl);
      if (!response.ok) {
        throw new Error('Download request failed.');
      }

      const audioBlob = await response.blob();

      // Convert artwork to data URL for offline display if remote
      let offlineArtwork = song.artwork;
      if (song.artwork && (song.artwork.startsWith('http://') || song.artwork.startsWith('https://'))) {
        try {
          const artRes = await fetch(song.artwork);
          if (artRes.ok) {
            const artBlob = await artRes.blob();
            offlineArtwork = await new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.onerror = () => resolve(song.artwork);
              reader.readAsDataURL(artBlob);
            });
          }
        } catch (e) {
          console.warn('Artwork offline caching fallback:', e);
        }
      }

      const songToSave = { ...song, artwork: offlineArtwork };
      await saveDownloadedSong(songToSave, audioBlob);
      await refreshDownloads();
    } catch (err) {
      console.error('Download error:', err);
    } finally {
      setDownloadingSet((prev) => {
        const next = new Set(prev);
        next.delete(song.id);
        return next;
      });
    }
  };

  const handleDeleteDownload = async (songId: string) => {
    try {
      await deleteDownloadedSong(songId);
      await refreshDownloads();
    } catch (err) {
      console.error('Failed to delete download:', err);
    }
  };

  const handleClearAllDownloads = async () => {
    try {
      await clearAllDownloads();
      await refreshDownloads();
    } catch (err) {
      console.error('Failed to clear downloads:', err);
    }
  };

  // Queue Operations
  const handleAddToQueue = (song: Song) => {
    setQueue((prev) => [...prev, song]);
  };

  const handleAddAllToQueue = (songs: Song[]) => {
    setQueue((prev) => [...prev, ...songs]);
  };

  const handlePlayAll = (songs: Song[]) => {
    if (songs.length === 0) return;
    setQueue(songs);
    setQueueIndex(0);
    handlePlaySong(songs[0], 0);
  };

  const handleRemoveFromQueue = (index: number) => {
    setQueue((prev) => prev.filter((_, idx) => idx !== index));
    if (index < queueIndex) {
      setQueueIndex((prev) => Math.max(0, prev - 1));
    }
  };

  const handleClearQueue = () => {
    setQueue([]);
    setQueueIndex(0);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col md:flex-row antialiased font-sans selection:bg-amber-400 selection:text-slate-950">
      {/* Desktop Navigation Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        favoritesCount={favorites.length}
        downloadsCount={downloadedSongs.length}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-32">
        {isOffline && (
          <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 text-center text-xs font-semibold text-amber-800 flex items-center justify-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span>Offline Mode Active — Downloaded songs & offline queue ready</span>
          </div>
        )}
        <HeaderBar
          currentTab={currentTab}
          onTabChange={setCurrentTab}
        />

        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full">
          {currentTab === 'home' && (
            <HomeView
              onTabChange={setCurrentTab}
              recentlyPlayed={recentlyPlayed}
              currentSong={currentSong}
              isPlaying={isPlaying}
              favoritesSet={favoritesSet}
              downloadedSet={downloadedSet}
              downloadingSet={downloadingSet}
              onPlaySong={handlePlaySong}
              onToggleFavorite={handleToggleFavoriteSong}
              onDownloadSong={handleDownloadSong}
              onAddToQueue={handleAddToQueue}
            />
          )}

          {currentTab === 'search' && (
            <SearchView
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              searchResults={searchResults}
              isSearching={isSearching}
              searchError={searchError}
              currentSong={currentSong}
              isPlaying={isPlaying}
              favoritesSet={favoritesSet}
              downloadedSet={downloadedSet}
              downloadingSet={downloadingSet}
              activeContextQuery={activeContextQuery}
              hasMoreResults={hasMoreResults}
              isLoadingMore={isLoadingMore}
              onLoadMore={handleLoadMoreResults}
              onPlaySong={handlePlaySong}
              onPlayAll={handlePlayAll}
              onToggleFavorite={handleToggleFavoriteSong}
              onDownloadSong={handleDownloadSong}
              onAddToQueue={handleAddToQueue}
              onAddAllToQueue={handleAddAllToQueue}
            />
          )}

          {currentTab === 'history' && (
            <HistoryView
              searchHistory={searchHistory}
              recentlyPlayed={recentlyPlayed}
              currentSong={currentSong}
              isPlaying={isPlaying}
              favoritesSet={favoritesSet}
              downloadedSet={downloadedSet}
              downloadingSet={downloadingSet}
              onSelectSearchQuery={(query) => {
                setSearchQuery(query);
                setCurrentTab('search');
              }}
              onRemoveSearchItem={(id) => setSearchHistory(removeSearchHistoryItem(id))}
              onClearSearchHistory={() => {
                clearSearchHistory();
                setSearchHistory([]);
              }}
              onRemoveRecentlyPlayedItem={(id) => setRecentlyPlayed(removeRecentlyPlayedItem(id))}
              onClearRecentlyPlayed={() => {
                clearRecentlyPlayed();
                setRecentlyPlayed([]);
              }}
              onPlaySong={handlePlaySong}
              onToggleFavorite={handleToggleFavoriteSong}
              onDownloadSong={handleDownloadSong}
              onAddToQueue={handleAddToQueue}
            />
          )}

          {currentTab === 'favorites' && (
            <FavoritesView
              favorites={favorites}
              currentSong={currentSong}
              isPlaying={isPlaying}
              favoritesSet={favoritesSet}
              downloadedSet={downloadedSet}
              downloadingSet={downloadingSet}
              onPlaySong={handlePlaySong}
              onPlayAll={handlePlayAll}
              onToggleFavorite={handleToggleFavoriteSong}
              onDownloadSong={handleDownloadSong}
              onAddToQueue={handleAddToQueue}
              onAddAllToQueue={handleAddAllToQueue}
            />
          )}

          {currentTab === 'downloads' && (
            <DownloadsView
              downloadedSongs={downloadedSongs}
              storageStats={storageStats}
              currentSong={currentSong}
              isPlaying={isPlaying}
              favoritesSet={favoritesSet}
              downloadedSet={downloadedSet}
              downloadingSet={downloadingSet}
              onPlaySong={handlePlaySong}
              onPlayAll={handlePlayAll}
              onToggleFavorite={handleToggleFavoriteSong}
              onDeleteDownload={handleDeleteDownload}
              onClearAllDownloads={handleClearAllDownloads}
              onAddToQueue={handleAddToQueue}
              onAddAllToQueue={handleAddAllToQueue}
            />
          )}
        </main>
      </div>

      {/* Persistent Bottom Player */}
      <NowPlayingBar
        currentSong={currentSong}
        isPlaying={isPlaying}
        duration={duration}
        currentTime={currentTime}
        volume={volume}
        isMuted={isMuted}
        repeatMode={repeatMode}
        shuffleMode={shuffleMode}
        isFavorite={currentSong ? favoritesSet.has(currentSong.id) : false}
        isDownloaded={currentSong ? downloadedSet.has(currentSong.id) : false}
        isDownloading={currentSong ? downloadingSet.has(currentSong.id) : false}
        onPlayPause={handlePlayPause}
        onPrevious={() => {
          if (queue.length > 0) {
            const prevIndex = (queueIndex - 1 + queue.length) % queue.length;
            setQueueIndex(prevIndex);
            handlePlaySong(queue[prevIndex]);
          }
        }}
        onNext={() => {
          if (queue.length > 0) {
            const nextIndex = (queueIndex + 1) % queue.length;
            setQueueIndex(nextIndex);
            handlePlaySong(queue[nextIndex]);
          }
        }}
        onSeek={handleSeek}
        onVolumeChange={handleVolumeChange}
        onToggleMute={handleToggleMute}
        onToggleRepeat={handleToggleRepeat}
        onToggleShuffle={handleToggleShuffle}
        onToggleFavorite={handleToggleFavoriteSong}
        onDownload={handleDownloadSong}
        onToggleQueue={() => setIsQueueOpen(!isQueueOpen)}
        onExpandPlayer={() => setIsFullPlayerOpen(true)}
      />

      {/* Full Screen Player Modal */}
      <FullPlayerModal
        isOpen={isFullPlayerOpen}
        onClose={() => setIsFullPlayerOpen(false)}
        currentSong={currentSong}
        isPlaying={isPlaying}
        duration={duration}
        currentTime={currentTime}
        volume={volume}
        isMuted={isMuted}
        repeatMode={repeatMode}
        shuffleMode={shuffleMode}
        isFavorite={currentSong ? favoritesSet.has(currentSong.id) : false}
        isDownloaded={currentSong ? downloadedSet.has(currentSong.id) : false}
        isDownloading={currentSong ? downloadingSet.has(currentSong.id) : false}
        queue={queue}
        queueIndex={queueIndex}
        onPlayPause={handlePlayPause}
        onPrevious={() => {
          if (queue.length > 0) {
            const prevIndex = (queueIndex - 1 + queue.length) % queue.length;
            setQueueIndex(prevIndex);
            handlePlaySong(queue[prevIndex]);
          }
        }}
        onNext={() => {
          if (queue.length > 0) {
            const nextIndex = (queueIndex + 1) % queue.length;
            setQueueIndex(nextIndex);
            handlePlaySong(queue[nextIndex]);
          }
        }}
        onSeek={handleSeek}
        onVolumeChange={handleVolumeChange}
        onToggleMute={handleToggleMute}
        onToggleRepeat={handleToggleRepeat}
        onToggleShuffle={handleToggleShuffle}
        onToggleFavorite={handleToggleFavoriteSong}
        onDownload={handleDownloadSong}
        onSelectSongFromQueue={(song, idx) => {
          setQueueIndex(idx);
          handlePlaySong(song);
        }}
      />

      {/* Queue Drawer */}
      <QueueDrawer
        isOpen={isQueueOpen}
        onClose={() => setIsQueueOpen(false)}
        queue={queue}
        queueIndex={queueIndex}
        currentSong={currentSong}
        isPlaying={isPlaying}
        onSelectSong={(song, idx) => {
          setQueueIndex(idx);
          handlePlaySong(song);
        }}
        onRemoveFromQueue={handleRemoveFromQueue}
        onClearQueue={handleClearQueue}
      />

      {/* Mobile Bottom Navigation */}
      <BottomNav
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        favoritesCount={favorites.length}
        downloadsCount={downloadedSongs.length}
      />
    </div>
  );
}
