import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Zap,
  Play,
  Radio,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import { Song } from '../types';
import { SongCard } from '../components/SongCard';

interface InstantMixViewProps {
  currentSong: Song | null;
  isPlaying: boolean;
  favoritesSet: Set<string>;
  downloadedSet: Set<string>;
  downloadingSet: Set<string>;
  selectedLanguages: string[];
  onPlaySong: (song: Song) => void;
  onPlayAll: (songs: Song[]) => void;
  onToggleFavorite: (song: Song) => void;
  onDownloadSong: (song: Song) => void;
  onAddToQueue: (song: Song) => void;
}

interface MixStation {
  id: string;
  name: string;
  tagline: string;
  query: string;
  color: string;
  icon: string;
  vibe: string;
}

const PRESET_STATIONS: MixStation[] = [
  {
    id: 'cyber-party',
    name: 'Bollywood Dance Party',
    tagline: 'High-octane remixes, club beats & bass anthems',
    query: 'bollywood party dance club hits',
    color: 'from-[#FF2D55] to-[#801026]',
    icon: '⚡',
    vibe: 'High Energy',
  },
  {
    id: 'neon-romance',
    name: 'Midnight Acoustic Romance',
    tagline: 'Soulful acoustic ballads & nocturnal melodies',
    query: 'romantic hindi arijit singh shreya ghoshal',
    color: 'from-[#FF375F] to-[#7B113A]',
    icon: '💖',
    vibe: 'Warm Melodies',
  },
  {
    id: 'punjabi-surge',
    name: 'Punjabi Drill & Beats',
    tagline: 'Sidhu Moosewala, AP Dhillon, Diljit & Karan Aujla',
    query: 'punjabi drill ap dhillon diljit dosanjh',
    color: 'from-[#FF9500] to-[#8F3900]',
    icon: '🔥',
    vibe: 'Heavy Bass',
  },
  {
    id: 'lofi-astral',
    name: 'Lo-Fi Chill Beats',
    tagline: 'Mellow chillhop for coding, studying and relaxing',
    query: 'hindi lofi chill slow and reverb',
    color: 'from-[#5856D6] to-[#242352]',
    icon: '🌙',
    vibe: 'Deep Focus',
  },
  {
    id: 'sufi-divine',
    name: 'Sufi & Mystic Melodies',
    tagline: 'Transcendent qawwalis, Nusrat, Rahat & poetry',
    query: 'sufi songs rahat fateh ali khan nusrat',
    color: 'from-[#34C759] to-[#0D4F1E]',
    icon: '✨',
    vibe: 'Spiritual',
  },
  {
    id: 'retro-90s',
    name: '90s Golden Bollywood',
    tagline: 'Timeless melodies of Kumar Sanu, Alka Yagnik & Udit',
    query: '90s evergreen bollywood kumar sanu alka yagnik',
    color: 'from-[#007AFF] to-[#003882]',
    icon: '📼',
    vibe: 'Evergreen Hits',
  },
];

export const InstantMixView: React.FC<InstantMixViewProps> = ({
  currentSong,
  isPlaying,
  favoritesSet,
  downloadedSet,
  downloadingSet,
  selectedLanguages,
  onPlaySong,
  onPlayAll,
  onToggleFavorite,
  onDownloadSong,
  onAddToQueue,
}) => {
  const [selectedStation, setSelectedStation] = useState<MixStation>(PRESET_STATIONS[0]);
  const [customPrompt, setCustomPrompt] = useState('');
  const [mixTracks, setMixTracks] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchMix = async (query: string) => {
    setIsLoading(true);
    try {
      const langs = selectedLanguages.join(' ');
      const fullQuery = `${query} ${selectedLanguages.includes('All Indian Languages') ? '' : langs}`;
      const response = await fetch(`/api/search?query=${encodeURIComponent(fullQuery)}`);
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          const mapped: Song[] = data.map((item: any) => ({
            id: String(item.id || ''),
            title: String(item.title || item.song || 'Unknown Title'),
            artist: String(item.artist || item.singers || 'Unknown Artist'),
            album: String(item.album || ''),
            duration: String(item.duration || '0'),
            artwork: String(item.artwork || item.image || ''),
            url: String(item.url || item.media_url || ''),
            permaUrl: String(item.perma_url || ''),
          }));
          setMixTracks(mapped);
        }
      }
    } catch (err) {
      console.error('Error generating instant mix:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMix(selectedStation.query);
  }, [selectedStation, selectedLanguages]);

  const handleCustomMixSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customPrompt.trim()) return;
    fetchMix(customPrompt);
  };

  return (
    <div className="space-y-8 pb-28 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-3 border-b border-[#C6C6C8]/40 dark:border-[#38383A]/60">
        <div>
          <span className="text-xs font-semibold text-[#8E8E93] uppercase tracking-wider block mb-0.5">
            Free Music Radio
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-black dark:text-white">
            Instant Mix & Radio
          </h1>
        </div>
      </div>

      {/* Custom Prompt Seed Bar */}
      <form onSubmit={handleCustomMixSubmit} className="flex flex-col sm:flex-row gap-2 max-w-xl">
        <div className="relative flex-1">
          <input
            type="text"
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder="Tune custom station (e.g. 'Late night Arijit acoustic', 'Gym Punjabi')..."
            className="w-full pl-4 pr-10 py-3 rounded-[12px] bg-[#F2F2F7] dark:bg-[#1C1C1E] border border-transparent focus:border-[#FA2D48] text-black dark:text-white placeholder-[#8E8E93] text-sm focus:outline-none transition"
          />
          <Sparkles className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#FA2D48] pointer-events-none" />
        </div>
        <button
          type="submit"
          disabled={isLoading || !customPrompt.trim()}
          className="px-5 py-3 rounded-[12px] bg-[#FA2D48] hover:bg-[#FC3C44] disabled:opacity-50 text-white font-semibold text-xs shadow-xs flex items-center justify-center gap-1.5 transition cursor-pointer shrink-0"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Tuning...</span>
            </>
          ) : (
            <>
              <Zap className="w-4 h-4 fill-current" />
              <span>Tune Station</span>
            </>
          )}
        </button>
      </form>

      {/* Featured Stations Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between pb-1 border-b border-[#C6C6C8]/30 dark:border-[#38383A]/50">
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-[#FA2D48]" />
            <h2 className="text-xl font-bold text-black dark:text-white tracking-tight">
              Featured Stations
            </h2>
          </div>
          <span className="text-xs text-[#8E8E93] font-medium">
            {PRESET_STATIONS.length} Available
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {PRESET_STATIONS.map((station) => {
            const isSelected = selectedStation.id === station.id;
            return (
              <button
                key={station.id}
                onClick={() => {
                  setSelectedStation(station);
                  setCustomPrompt('');
                }}
                className={`p-3.5 rounded-[12px] text-left transition-all relative flex flex-col justify-between h-30 cursor-pointer ${
                  isSelected
                    ? 'bg-[#FA2D48]/10 dark:bg-[#FA2D48]/20 border-2 border-[#FA2D48]'
                    : 'bg-[#F2F2F7] dark:bg-[#1C1C1E] hover:bg-[#E5E5EA] dark:hover:bg-[#2C2C2E] border border-transparent'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-2xl">{station.icon}</span>
                  {isSelected && (
                    <span className="w-2 h-2 rounded-full bg-[#FA2D48]" />
                  )}
                </div>

                <div className="space-y-0.5">
                  <h3
                    className={`text-xs font-semibold leading-tight truncate ${
                      isSelected ? 'text-[#FA2D48]' : 'text-black dark:text-white'
                    }`}
                  >
                    {station.name}
                  </h3>
                  <p className="text-[10px] text-[#8E8E93] truncate">
                    {station.vibe}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Station Header & Tracks */}
      <div className="p-5 sm:p-6 rounded-[16px] bg-[#F2F2F7] dark:bg-[#1C1C1E] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className={`w-12 h-12 rounded-[10px] bg-gradient-to-tr ${selectedStation.color} flex items-center justify-center text-2xl shadow-xs text-white shrink-0`}>
              {selectedStation.icon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-black dark:text-white tracking-tight">
                  {selectedStation.name}
                </h2>
              </div>
              <p className="text-xs text-[#8E8E93] mt-0.5">
                {selectedStation.tagline} • {mixTracks.length} Tracks Prepared
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => fetchMix(selectedStation.query)}
              disabled={isLoading}
              className="p-2 rounded-[8px] bg-white dark:bg-[#2C2C2E] hover:bg-[#E5E5EA] text-[#8E8E93] hover:text-black dark:hover:text-white transition cursor-pointer shadow-2xs"
              title="Refresh Station"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#FA2D48]' : ''}`} />
            </button>

            {mixTracks.length > 0 && (
              <button
                onClick={() => onPlayAll(mixTracks)}
                className="px-4 py-2 rounded-full bg-[#FA2D48] hover:bg-[#FC3C44] text-white font-semibold text-xs shadow-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current ml-0.5" />
                <span>Play Station</span>
              </button>
            )}
          </div>
        </div>

        {/* Mix Track List */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 pt-2">
            {Array.from({ length: 10 }).map((_, idx) => (
              <div key={idx} className="space-y-2 animate-pulse">
                <div className="aspect-square bg-[#E5E5EA] dark:bg-[#2C2C2E] rounded-[12px]" />
                <div className="h-3.5 bg-[#E5E5EA] dark:bg-[#2C2C2E] rounded w-3/4" />
                <div className="h-3 bg-[#E5E5EA] dark:bg-[#2C2C2E] rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : mixTracks.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 pt-2">
            {mixTracks.map((song) => (
              <SongCard
                key={'mix_' + song.id}
                song={song}
                isPlaying={isPlaying}
                isCurrent={currentSong?.id === song.id}
                isFavorite={favoritesSet.has(song.id)}
                isDownloaded={downloadedSet.has(song.id)}
                isDownloading={downloadingSet.has(song.id)}
                onPlay={onPlaySong}
                onToggleFavorite={onToggleFavorite}
                onDownload={onDownloadSong}
                onAddToQueue={onAddToQueue}
              />
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-[#8E8E93] text-xs">
            No tracks retrieved for this mix. Try re-tuning above!
          </div>
        )}
      </div>
    </div>
  );
};
