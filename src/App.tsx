import React, { useState, useEffect, useRef, useCallback } from 'react';
import { App as CapApp } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
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
  findDownloadedSong,
  getAllDownloadedSongs,
  deleteDownloadedSong,
  clearAllDownloads,
  getStorageStats,
} from './lib/db';
import { fetchAudioBlob } from './lib/audioFetcher';
import { deduplicateSongs, getCanonicalSongKey } from './lib/dedupe';

import { Sidebar } from './components/Sidebar';
import { BottomNav } from './components/BottomNav';
import { HeaderBar } from './components/HeaderBar';
import { NowPlayingBar } from './components/NowPlayingBar';
import { FullPlayerModal } from './components/FullPlayerModal';
import { QueueDrawer } from './components/QueueDrawer';

import { HomeView } from './views/HomeView';
import { SearchView } from './views/SearchView';
import { InstantMixView } from './views/InstantMixView';
import { HistoryView } from './views/HistoryView';
import { FavoritesView } from './views/FavoritesView';
import { DownloadsView } from './views/DownloadsView';
import { DashboardView } from './views/DashboardView';
import { ToastNotification, ToastData } from './components/ToastNotification';
import { WrongLanguageAlertModal } from './components/WrongLanguageAlertModal';
import { initRealtimePresence, trackEvent } from './lib/analytics';
import { auth } from './lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';

export default function App() {
  // Navigation
  const [currentTab, setCurrentTab] = useState<TabType>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname.toLowerCase();
      if (path === '/dashboard' || window.location.hash === '#dashboard') {
        return 'dashboard';
      }
    }
    return 'home';
  });

  // Auth & Admin State
  const [authUser, setAuthUser] = useState<User | null>(auth.currentUser);
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => setAuthUser(user));
    return () => unsub();
  }, []);
  const adminEmail = (import.meta.env.VITE_ADMIN_EMAIL || '').trim().toLowerCase();
  const [localAdminActive, setLocalAdminActive] = useState<boolean>(() => {
    return typeof window !== 'undefined' && localStorage.getItem('free_music_local_admin') === 'true';
  });

  useEffect(() => {
    const handleStorage = () => {
      setLocalAdminActive(localStorage.getItem('free_music_local_admin') === 'true');
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const isAdmin = Boolean(
    localAdminActive ||
    (typeof window !== 'undefined' && localStorage.getItem('free_music_local_admin') === 'true') ||
    authUser?.uid === 't3Lf9DF9SbOyneEpsiT7q5gS7Ns2' ||
    (authUser?.email && authUser.email.toLowerCase() === 'khandagalesuraj48@gmail.com') ||
    (authUser?.email && authUser.email.toLowerCase() === 'milestoneconsultancy.in@gmail.com') ||
    (adminEmail && authUser?.email?.toLowerCase() === adminEmail)
  );

  // Keep route in sync with currentTab
  useEffect(() => {
    if (currentTab === 'dashboard') {
      if (window.location.pathname !== '/dashboard') {
        window.history.pushState(null, '', '/dashboard');
      }
    } else if (window.location.pathname === '/dashboard') {
      window.history.pushState(null, '', '/');
    }
  }, [currentTab]);

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.toLowerCase();
      if (path === '/dashboard') {
        setCurrentTab('dashboard');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Language Preference State & Alert Modal
  const [wrongLanguageData, setWrongLanguageData] = useState<{
    detectedLanguage: string;
    query: string;
  } | null>(null);

  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('sonic_language_prefs');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn(e);
    }
    return ['Hindi'];
  });

  const handleLanguageChange = (langs: string[]) => {
    setSelectedLanguages(langs);
    try {
      localStorage.setItem('sonic_language_prefs', JSON.stringify(langs));
    } catch (e) {
      console.warn(e);
    }
  };

  // Realtime Presence Listener
  useEffect(() => {
    const cleanup = initRealtimePresence();
    return () => {
      if (cleanup) cleanup();
    };
  }, []);

  // Track Page Views
  useEffect(() => {
    trackEvent('visit', { page: currentTab });
  }, [currentTab]);

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
  const [toast, setToast] = useState<ToastData | null>(null);

  // Network Offline State
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  // Theme State
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const saved = localStorage.getItem('sonic_current_theme');
      if (saved === 'dark' || saved === 'light') return saved;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem('sonic_current_theme', theme);
    } catch (e) {
      console.warn('Error saving theme preference:', e);
    }
    try {
      StatusBar.setStyle({ style: theme === 'dark' ? Style.Dark : Style.Light }).catch(() => {});
      StatusBar.setBackgroundColor({ color: theme === 'dark' ? '#0f172a' : '#ffffff' }).catch(() => {});
    } catch {
      // ignore on non-Capacitor web
    }
  }, [theme]);

  // Android Native Back Button listener
  useEffect(() => {
    let listener: any;
    const setupBackButton = async () => {
      try {
        listener = await CapApp.addListener('backButton', ({ canGoBack }) => {
          if (isFullPlayerOpen) {
            setIsFullPlayerOpen(false);
          } else if (isQueueOpen) {
            setIsQueueOpen(false);
          } else if (currentTab !== 'home') {
            setCurrentTab('home');
          } else if (canGoBack) {
            window.history.back();
          } else {
            CapApp.minimizeApp();
          }
        });
      } catch {
        // ignore on web
      }
    };
    setupBackButton();
    return () => {
      if (listener && listener.remove) {
        listener.remove();
      }
    };
  }, [isFullPlayerOpen, isQueueOpen, currentTab]);

  const handleToggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

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

  // Ref to hold restored playback position across reloads
  const restoredTimeRef = useRef<number>(0);

  // Persistent refs to avoid stale closures in event listeners
  const queueRef = useRef(queue);
  queueRef.current = queue;

  const queueIndexRef = useRef(queueIndex);
  queueIndexRef.current = queueIndex;

  const repeatModeRef = useRef(repeatMode);
  repeatModeRef.current = repeatMode;

  const shuffleModeRef = useRef(shuffleMode);
  shuffleModeRef.current = shuffleMode;

  const currentSongRef = useRef(currentSong);
  currentSongRef.current = currentSong;

  const currentTimeRef = useRef(currentTime);
  currentTimeRef.current = currentTime;

  const isPlayingRef = useRef(isPlaying);
  isPlayingRef.current = isPlaying;

  const activeContextQueryRef = useRef(activeContextQuery);
  activeContextQueryRef.current = activeContextQuery;

  // Helper to resolve playable URL for a song
  const getPlayableUrl = useCallback(async (song: Song): Promise<string> => {
    try {
      const downloaded = await findDownloadedSong(song);
      if (downloaded && downloaded.audioBlob) {
        return URL.createObjectURL(downloaded.audioBlob);
      }
    } catch (e) {
      console.warn('Error checking downloaded song:', e);
    }

    if (song.url && song.url.startsWith('blob:')) {
      return song.url;
    }

    if (!navigator.onLine) {
      return '';
    }
    if (song.url && (song.url.startsWith('http://') || song.url.startsWith('https://'))) {
      return song.url;
    }
    if (song.url) {
      return `/api/audio?url=${encodeURIComponent(song.url)}`;
    }
    return '';
  }, []);

  // Restore saved player state on app launch
  useEffect(() => {
    const saved = getActivePlayerState();
    if (saved && saved.currentSong) {
      setCurrentSong(saved.currentSong);
      if (saved.queue && saved.queue.length > 0) {
        setQueue(saved.queue);
        setQueueIndex(saved.queueIndex || 0);
      }
      if (saved.repeatMode) setRepeatMode(saved.repeatMode);
      if (typeof saved.shuffleMode === 'boolean') setShuffleMode(saved.shuffleMode);

      const restoredPos = saved.currentTime || 0;
      setCurrentTime(restoredPos);
      restoredTimeRef.current = restoredPos;

      // Pre-assign audio.src without auto-playing so position can be restored
      getPlayableUrl(saved.currentSong).then((url) => {
        if (url && audioRef.current) {
          audioRef.current.src = url;
          audioRef.current.load();
        }
      }).catch(console.error);
    }
  }, [getPlayableUrl]);

  // Helper to save current active player state
  const saveStateNow = useCallback(() => {
    if (currentSongRef.current) {
      const pos = audioRef.current ? audioRef.current.currentTime : currentTimeRef.current;
      saveActivePlayerState({
        currentSong: currentSongRef.current,
        currentTime: pos,
        queue: queueRef.current,
        queueIndex: queueIndexRef.current,
        repeatMode: repeatModeRef.current,
        shuffleMode: shuffleModeRef.current,
      });
    }
  }, []);

  // Save player state periodically (every 1.5s while playing) & on page lifecycle events
  useEffect(() => {
    const interval = setInterval(() => {
      if (isPlayingRef.current) {
        saveStateNow();
      }
    }, 1500);

    const handleSaveEvent = () => {
      saveStateNow();
    };

    window.addEventListener('pause', handleSaveEvent);
    window.addEventListener('visibilitychange', handleSaveEvent);
    window.addEventListener('pagehide', handleSaveEvent);
    window.addEventListener('beforeunload', handleSaveEvent);

    return () => {
      clearInterval(interval);
      window.removeEventListener('pause', handleSaveEvent);
      window.removeEventListener('visibilitychange', handleSaveEvent);
      window.removeEventListener('pagehide', handleSaveEvent);
      window.removeEventListener('beforeunload', handleSaveEvent);
    };
  }, [saveStateNow]);

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

    trackEvent('search', { query: query.trim() });

    try {
      const langs = selectedLanguages.join(',');
      const response = await fetch(
        `/api/result?query=${encodeURIComponent(query.trim())}&languages=${encodeURIComponent(langs)}&page=1`
      );
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

      // Check header for filtered language
      const detectedLangHeader = response.headers.get('X-Detected-Language');
      if (detectedLangHeader) {
        try {
          const detected = decodeURIComponent(detectedLangHeader);
          if (detected) {
            setWrongLanguageData({ detectedLanguage: detected, query: query.trim() });
          }
        } catch (e) {
          console.warn('Error decoding language header:', e);
        }
      }

      if (!Array.isArray(data) || data.length === 0) {
        setSearchResults([]);
        setSearchError(`No songs found for "${query.trim()}".`);
        setHasMoreResults(false);
      } else {
        const rawSongs: Song[] = data.map((item: any) => ({
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

        const { uniqueSongs } = deduplicateSongs(rawSongs);

        setSearchResults(uniqueSongs);
        setSearchPage(1);
        setHasMoreResults(uniqueSongs.length >= 5);

        let detectedContext = '';
        const headerContext = response.headers.get('X-Context-Label');
        if (headerContext) {
          try {
            detectedContext = decodeURIComponent(headerContext);
          } catch (e) {
            detectedContext = headerContext;
          }
        }
        if (!detectedContext && uniqueSongs.length > 0 && uniqueSongs[0].contextLabel) {
          detectedContext = uniqueSongs[0].contextLabel;
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
      const langs = selectedLanguages.join(',');
      const response = await fetch(
        `/api/result?query=${encodeURIComponent(searchQuery.trim())}&languages=${encodeURIComponent(langs)}&page=${nextPage}`
      );
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          const rawSongs: Song[] = data.map((item: any) => ({
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

          let addedCount = 0;
          setSearchResults((prev) => {
            const existingSeen = {
              ids: new Set<string>(prev.map((s) => s.id).filter(Boolean)),
              pairs: new Set<string>(
                prev.map((s) => getCanonicalSongKey(s).pairKey).filter((p) => p.length > 4)
              ),
            };
            const { uniqueSongs } = deduplicateSongs(rawSongs, existingSeen);
            addedCount = uniqueSongs.length;
            if (uniqueSongs.length === 0) {
              setHasMoreResults(false);
              return prev;
            }
            return [...prev, ...uniqueSongs];
          });
          setSearchPage(nextPage);
          setHasMoreResults(addedCount >= 5);
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
      if (restoredTimeRef.current > 0) {
        if (restoredTimeRef.current < (audio.duration || Infinity)) {
          audio.currentTime = restoredTimeRef.current;
        }
        restoredTimeRef.current = 0;
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
    if (!audioRef.current || !song) return;

    try {
      // 1. Check if song is downloaded in IndexedDB for offline play (search by ID or Title+Artist)
      const downloaded = await findDownloadedSong(song);
      let playableUrl = '';

      if (downloaded && downloaded.audioBlob) {
        playableUrl = URL.createObjectURL(downloaded.audioBlob);
      } else if (song.url && song.url.startsWith('blob:')) {
        playableUrl = song.url;
      } else if (!navigator.onLine) {
        setSearchError('This track is not saved offline. Open the Offline Library tab to listen to your downloaded music without internet.');
        setIsPlaying(false);
        return;
      } else if (song.url && (song.url.startsWith('http://') || song.url.startsWith('https://'))) {
        playableUrl = song.url;
      } else if (song.url) {
        playableUrl = `/api/audio?url=${encodeURIComponent(song.url)}`;
      }

      if (!playableUrl) {
        if (!navigator.onLine) {
          setSearchError('This track is not available offline. Please connect to the internet or play a downloaded song.');
          setIsPlaying(false);
          return;
        }
      }

      const songWithArtwork = downloaded && downloaded.artwork ? { ...song, artwork: downloaded.artwork } : song;
      setCurrentSong(songWithArtwork);
      setIsPlaying(true);

      // Track playback in analytics (non-blocking)
      trackEvent('song_play', { song: songWithArtwork, language: selectedLanguages.join(',') });

      // Add to recently played
      const updatedRP = addRecentlyPlayed(songWithArtwork);
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
          setQueue((prev) => [...prev, songWithArtwork]);
          setQueueIndex(queue.length);
        }
      }

      const audio = audioRef.current;
      if (playableUrl && (audio.src !== playableUrl && !audio.src.endsWith(playableUrl))) {
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
    const audio = audioRef.current;
    const current = currentSongRef.current;
    const curQueue = queueRef.current;
    const curIndex = queueIndexRef.current;
    const mode = repeatModeRef.current;
    const isShuffle = shuffleModeRef.current;
    const contextQuery = activeContextQueryRef.current;

    if (!audio || !current) return;

    // 1. Repeat ONE
    if (mode === 'one') {
      audio.currentTime = 0;
      audio.play().catch(console.error);
      return;
    }

    // 2. Shuffle mode
    if (isShuffle && curQueue.length > 1) {
      let randIdx = Math.floor(Math.random() * curQueue.length);
      while (randIdx === curIndex) {
        randIdx = Math.floor(Math.random() * curQueue.length);
      }
      setQueueIndex(randIdx);
      handlePlaySong(curQueue[randIdx], randIdx, true);
      return;
    }

    // 3. Queue navigation (next item in existing queue)
    const nextIndex = curIndex + 1;
    if (nextIndex < curQueue.length) {
      setQueueIndex(nextIndex);
      handlePlaySong(curQueue[nextIndex], nextIndex, true);
      return;
    }

    // 4. Repeat ALL
    if (mode === 'all' && curQueue.length > 0) {
      setQueueIndex(0);
      handlePlaySong(curQueue[0], 0, true);
      return;
    }

    // 5. SMART CONTEXT AUTO-EXTEND QUEUE: Use AI Smart Queue endpoint first, fallback to context search
    if (!navigator.onLine) {
      setIsPlaying(false);
      return;
    }

    try {
      // 5a. Call AI Smart Queue Endpoint
      const playedIds = curQueue.map((s) => s.id).filter(Boolean);
      const recentList = curQueue.slice(-5).map((s) => ({ title: s.title, artist: s.artist }));

      const sqRes = await fetch('/api/smart-queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentSong: current,
          recentSongs: recentList,
          playedIds,
          languages: selectedLanguages,
        }),
      });

      if (sqRes.ok) {
        const sqData = await sqRes.json();
        if (Array.isArray(sqData) && sqData.length > 0) {
          const aiSongs: Song[] = sqData.map((item: any) => ({
            id: String(item.id || ''),
            title: String(item.title || item.song || 'Unknown Title'),
            artist: String(item.artist || item.singers || 'Unknown Artist'),
            album: String(item.album || ''),
            duration: String(item.duration || '0'),
            artwork: String(item.artwork || item.image || ''),
            url: String(item.url || item.media_url || ''),
            permaUrl: String(item.perma_url || ''),
            whyPicked: item.whyPicked,
          }));

          const existingSeen = {
            ids: new Set<string>(curQueue.map((s) => s.id).filter(Boolean)),
            pairs: new Set<string>(
              curQueue.map((s) => getCanonicalSongKey(s).pairKey).filter((p) => p.length > 4)
            ),
          };

          const { uniqueSongs } = deduplicateSongs(aiSongs, existingSeen);
          if (uniqueSongs.length > 0) {
            const nextSong = uniqueSongs[0];
            const newQueue = [...curQueue, ...uniqueSongs];
            setQueue(newQueue);
            const newIndex = curQueue.length;
            setQueueIndex(newIndex);
            handlePlaySong(nextSong, newIndex, true);
            return;
          }
        }
      }

      // 5b. Fallback to Context Search
      const contextTerm = contextQuery || current.artist || current.title;
      if (contextTerm) {
        let page = Math.floor(curQueue.length / 10) + 1;
        let freshFound: Song[] = [];
        let attempts = 0;

        while (freshFound.length === 0 && attempts < 5) {
          attempts++;
          page++;
          const response = await fetch(
            `/api/result?query=${encodeURIComponent(contextTerm.trim())}&page=${page}`
          );
          if (!response.ok) break;

          const data = await response.json();
          if (!Array.isArray(data) || data.length === 0) break;

          const fetchedSongs: Song[] = data.map((item: any) => ({
            id: String(item.id || ''),
            title: String(item.title || item.song || 'Unknown Title'),
            artist: String(item.artist || item.singers || 'Unknown Artist'),
            album: String(item.album || ''),
            duration: String(item.duration || '0'),
            artwork: String(item.artwork || item.image || ''),
            url: String(item.url || item.media_url || ''),
            permaUrl: String(item.perma_url || ''),
          }));

          const existingSeen = {
            ids: new Set<string>(curQueue.map((s) => s.id).filter(Boolean)),
            pairs: new Set<string>(
              curQueue.map((s) => getCanonicalSongKey(s).pairKey).filter((p) => p.length > 4)
            ),
          };

          const { uniqueSongs } = deduplicateSongs(fetchedSongs, existingSeen);
          if (uniqueSongs.length > 0) {
            freshFound = uniqueSongs;
          }
        }

        if (freshFound.length > 0) {
          const nextSong = freshFound[0];
          const newQueue = [...curQueue, ...freshFound];
          setQueue(newQueue);
          const newIndex = curQueue.length;
          setQueueIndex(newIndex);
          handlePlaySong(nextSong, newIndex, true);
          return;
        }
      }
    } catch (err) {
      console.error('Smart auto-next fetch failed:', err);
    }

    // Fallback: stop playback
    setIsPlaying(false);
  }, []);

  // Bind audio ended and error listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.onended = () => {
      handleAudioEnded();
    };

    audio.onerror = () => {
      console.warn('Audio playback error on current track, auto-advancing...');
      setTimeout(() => {
        handleNextTrack();
      }, 500);
    };

    return () => {
      audio.onended = null;
      audio.onerror = null;
    };
  }, [handleAudioEnded, handleNextTrack]);

  // Play / Pause Toggle
  const handlePlayPause = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (!currentSong) {
      if (searchResults.length > 0) {
        handlePlaySong(searchResults[0], 0);
      }
      return;
    }

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      saveStateNow();
    } else {
      if (!audio.src || audio.src === '' || audio.src === window.location.href) {
        const url = await getPlayableUrl(currentSong);
        if (url) {
          audio.src = url;
          audio.load();
        }
      }
      if (currentTime > 0 && Math.abs(audio.currentTime - currentTime) > 0.5) {
        audio.currentTime = currentTime;
      }
      audio.play().then(() => setIsPlaying(true)).catch(console.error);
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
    trackEvent('like', { song });
  };

  // In-App Offline Download Management (IndexedDB Superfast Audio Storage)
  const handleDownloadSong = async (song: Song) => {
    trackEvent('download', { song });

    const isAlreadyDownloaded = downloadedSongs.some((d) => {
      if (d.id === song.id) return true;
      const t1 = d.title.trim().toLowerCase();
      const t2 = song.title.trim().toLowerCase();
      const a1 = d.artist.trim().toLowerCase();
      const a2 = song.artist.trim().toLowerCase();
      return t1 === t2 && a1 === a2 && t1.length > 2;
    });

    if (isAlreadyDownloaded) {
      setToast({
        id: `toast-${Date.now()}`,
        type: 'done',
        title: 'Already Saved Offline',
        message: `"${song.title}" is in your In-App Offline Deck`,
        song,
        actionText: 'View Deck',
        onAction: () => setCurrentTab('downloads'),
      });
      return;
    }

    if (downloadingSet.has(song.id)) {
      setToast({
        id: `toast-${Date.now()}`,
        type: 'saving',
        title: 'Saving Offline...',
        message: `Downloading "${song.title}" into app memory`,
        song,
      });
      return;
    }

    setDownloadingSet((prev) => new Set(prev).add(song.id));
    setToast({
      id: `toast-${Date.now()}`,
      type: 'saving',
      title: 'Saving Offline ⚡',
      message: `Fetching audio stream for "${song.title}"...`,
      song,
    });

    try {
      const cleanTitle = song.title.replace(/[^a-zA-Z0-9\s-_]/g, '');
      const cleanArtist = song.artist.replace(/[^a-zA-Z0-9\s-_]/g, '');
      const fileName = `${cleanArtist || 'Artist'} - ${cleanTitle || 'Song'}.mp3`;

      console.log(`[OFFLINE] Starting Superfast In-App download for "${song.title}"`);
      const { blob: audioBlob } = await fetchAudioBlob(song.url, fileName);

      // Save directly to IndexedDB immediately without any delay
      await saveDownloadedSong(song, audioBlob);
      console.log(`[OFFLINE] Successfully stored in IndexedDB: "${song.title}"`);
      await refreshDownloads();

      // Show DONE feedback
      setToast({
        id: `toast-${Date.now()}`,
        type: 'done',
        title: 'Saved Offline • Done! ✓',
        message: `"${song.title}" is ready for flight & offline mode`,
        song,
        actionText: 'Offline Deck',
        onAction: () => setCurrentTab('downloads'),
      });
    } catch (err: any) {
      console.error('[OFFLINE] In-app save failed:', err?.message || err);
      setToast({
        id: `toast-${Date.now()}`,
        type: 'error',
        title: 'Save Offline Failed',
        message: err?.message || 'Unable to cache audio stream. Please check connection and retry.',
        song,
      });
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
    setQueue((prev) => {
      const { id: targetId, pairKey: targetPair } = getCanonicalSongKey(song);
      const exists = prev.some((q) => {
        const { id, pairKey } = getCanonicalSongKey(q);
        return (id && id === targetId) || (pairKey && pairKey === targetPair);
      });
      if (exists) return prev;
      return [...prev, song];
    });
  };

  const handleAddAllToQueue = (songs: Song[]) => {
    setQueue((prev) => {
      const existingSeen = {
        ids: new Set<string>(prev.map((s) => s.id).filter(Boolean)),
        pairs: new Set<string>(
          prev.map((s) => getCanonicalSongKey(s).pairKey).filter((p) => p.length > 4)
        ),
      };
      const { uniqueSongs } = deduplicateSongs(songs, existingSeen);
      return [...prev, ...uniqueSongs];
    });
  };

  const handlePlayAll = (songs: Song[]) => {
    if (songs.length === 0) return;
    const { uniqueSongs } = deduplicateSongs(songs);
    if (uniqueSongs.length === 0) return;
    setQueue(uniqueSongs);
    setQueueIndex(0);
    handlePlaySong(uniqueSongs[0], 0, true);
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
    <div className="min-h-screen bg-[#F2F2F7] dark:bg-[#000000] text-black dark:text-white flex flex-col md:flex-row antialiased font-sans selection:bg-[#FA2D48] selection:text-white transition-colors duration-200">
      {/* Desktop Navigation Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        favoritesCount={favorites.length}
        downloadsCount={downloadedSongs.length}
        isAdmin={isAdmin}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-32">
        {isOffline && (
          <div className="bg-[#FF9500]/15 border-b border-[#FF9500]/25 px-4 py-2 text-center text-xs font-semibold text-black dark:text-white flex items-center justify-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#FF9500] animate-pulse" />
            <span>Offline Mode Active — Downloaded songs & offline queue ready</span>
          </div>
        )}
        <HeaderBar
          currentTab={currentTab}
          onTabChange={setCurrentTab}
          theme={theme}
          onToggleTheme={handleToggleTheme}
          isAdmin={isAdmin}
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
              selectedLanguages={selectedLanguages}
              onLanguageChange={handleLanguageChange}
              onPlaySong={handlePlaySong}
              onPlayAll={handlePlayAll}
              onToggleFavorite={handleToggleFavoriteSong}
              onDownloadSong={handleDownloadSong}
              onAddToQueue={handleAddToQueue}
            />
          )}

          {currentTab === 'dashboard' && (
            <DashboardView onTabChange={setCurrentTab} />
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

          {currentTab === 'instantmix' && (
            <InstantMixView
              currentSong={currentSong}
              isPlaying={isPlaying}
              favoritesSet={favoritesSet}
              downloadedSet={downloadedSet}
              downloadingSet={downloadingSet}
              selectedLanguages={selectedLanguages}
              onPlaySong={handlePlaySong}
              onPlayAll={handlePlayAll}
              onToggleFavorite={handleToggleFavoriteSong}
              onDownloadSong={handleDownloadSong}
              onAddToQueue={handleAddToQueue}
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

      {/* Global In-App Toast Feedback */}
      <ToastNotification toast={toast} onClose={() => setToast(null)} />

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

      {/* Wrong Language Alert Modal */}
      {wrongLanguageData && (
        <WrongLanguageAlertModal
          detectedLanguage={wrongLanguageData.detectedLanguage}
          selectedLanguages={selectedLanguages}
          onClose={() => setWrongLanguageData(null)}
          onChangeLanguage={() => {
            setWrongLanguageData(null);
            setCurrentTab('home');
          }}
          onAddLanguage={(lang) => {
            const updated = Array.from(new Set([...selectedLanguages, lang]));
            handleLanguageChange(updated);
            setWrongLanguageData(null);
            if (wrongLanguageData.query) {
              executeSearch(wrongLanguageData.query);
            }
          }}
        />
      )}

      {/* Mobile Bottom Navigation */}
      <BottomNav
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        downloadsCount={downloadedSongs.length}
        isAdmin={isAdmin}
      />
    </div>
  );
}
