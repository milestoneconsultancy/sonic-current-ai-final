import React, { useState } from 'react';
import { Sparkles, Play, Plus, Music2, RefreshCw, Radio, Send, Flame, Heart, Headphones } from 'lucide-react';
import { Song } from '../types';

interface VibeDJSectionProps {
  selectedLanguages: string[];
  onPlaySong: (song: Song) => void;
  onPlayAll: (songs: Song[]) => void;
  onAddToQueue: (song: Song) => void;
}

const PRESET_VIBES = [
  { label: '💔 Sad & Heartbreak', prompt: 'sad heart touching emotional songs' },
  { label: '⚡ High Energy Gym', prompt: 'intense gym workout motivation hits' },
  { label: '🌧️ Rainy Chill Vibe', prompt: 'soothing monsoon rain acoustic chill songs' },
  { label: '🚗 Late Night Drive', prompt: 'lofi melodic late night drive songs' },
  { label: '🎉 Party & Dance Beats', prompt: 'upbeat high energy party dance bangers' },
  { label: '🙏 Spiritual & Devotional', prompt: 'peaceful bhajan devotional spiritual chanting' },
  { label: '💖 Pure 90s Romance', prompt: '90s romantic classic melody hits' },
];

export const VibeDJSection: React.FC<VibeDJSectionProps> = ({
  selectedLanguages,
  onPlaySong,
  onPlayAll,
  onAddToQueue,
}) => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [playlist, setPlaylist] = useState<{
    title: string;
    description: string;
    prompt: string;
    songs: Song[];
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleGenerate = async (customPrompt?: string) => {
    const targetPrompt = (customPrompt || prompt).trim();
    if (!targetPrompt) return;

    setIsGenerating(true);
    setErrorMsg(null);

    try {
      const response = await fetch('/api/vibe-dj', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: targetPrompt,
          languages: selectedLanguages,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      if (data && Array.isArray(data.songs)) {
        const mappedSongs: Song[] = data.songs.map((item: any) => ({
          id: String(item.id || ''),
          title: String(item.title || item.song || 'Unknown Track'),
          artist: String(item.artist || item.singers || 'Unknown Artist'),
          album: String(item.album || ''),
          duration: String(item.duration || '0'),
          artwork: String(item.artwork || item.image || ''),
          url: String(item.url || item.media_url || ''),
          permaUrl: String(item.perma_url || ''),
          whyPicked: item.whyPicked,
        }));

        setPlaylist({
          title: data.title || `Vibe DJ • ${targetPrompt}`,
          description: data.description || `AI Mood playlist for "${targetPrompt}"`,
          prompt: targetPrompt,
          songs: mappedSongs,
        });
      } else {
        setErrorMsg('Could not find matching tracks for this vibe. Try another description.');
      }
    } catch (err) {
      console.error('Vibe DJ generation error:', err);
      setErrorMsg('Vibe DJ is temporarily busy. Retrying...');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-purple-900/10 via-slate-900/90 to-amber-900/10 dark:from-purple-950/40 dark:via-slate-900 dark:to-amber-950/30 border border-purple-500/20 dark:border-purple-500/30 rounded-3xl p-5 sm:p-6 shadow-lg space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-500 to-amber-500 text-white flex items-center justify-center font-black shadow-md shadow-purple-500/20">
            <Sparkles className="w-5 h-5 fill-current animate-pulse" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <span>AI Vibe DJ</span>
              <span className="px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 text-[10px] font-bold uppercase tracking-wider">
                Multi-Lang AI
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Describe your vibe in English, Hindi, Marathi, or Hinglish — AI crafts a custom playlist!
            </p>
          </div>
        </div>
      </div>

      {/* Preset Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {PRESET_VIBES.map((preset) => (
          <button
            key={preset.label}
            onClick={() => {
              setPrompt(preset.prompt);
              handleGenerate(preset.prompt);
            }}
            disabled={isGenerating}
            className="px-3 py-1.5 rounded-xl bg-white/80 dark:bg-slate-800/80 hover:bg-purple-500/10 dark:hover:bg-purple-500/20 text-slate-700 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-300 border border-slate-200 dark:border-slate-700 text-xs font-bold transition shrink-0 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <span>{preset.label}</span>
          </button>
        ))}
      </div>

      {/* Input Box */}
      <div className="relative flex items-center">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
          placeholder="e.g. 'gym sathi energetic marathi hits', 'dil todne wale sad hindi gaane', 'rain chill'"
          className="w-full py-3.5 pl-4 pr-28 rounded-2xl bg-white dark:bg-slate-950/80 border border-slate-200/90 dark:border-slate-800 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 text-sm font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 outline-none transition"
        />
        <button
          onClick={() => handleGenerate()}
          disabled={isGenerating || !prompt.trim()}
          className="absolute right-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-amber-500 hover:from-purple-500 hover:to-amber-400 text-white font-black text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
        >
          {isGenerating ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Mixing...</span>
            </>
          ) : (
            <>
              <Send className="w-3.5 h-3.5" />
              <span>Mix Vibe</span>
            </>
          )}
        </button>
      </div>

      {errorMsg && (
        <p className="text-xs font-semibold text-amber-500 dark:text-amber-400">{errorMsg}</p>
      )}

      {/* Generated Playlist Output */}
      {playlist && (
        <div className="space-y-4 pt-2 border-t border-purple-500/20 animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span>{playlist.title}</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{playlist.description}</p>
            </div>

            {playlist.songs.length > 0 && (
              <button
                onClick={() => onPlayAll(playlist.songs)}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
              >
                <Play className="w-3.5 h-3.5 fill-current text-slate-950" />
                <span>Play Vibe Playlist ({playlist.songs.length})</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {playlist.songs.map((song, idx) => (
              <div
                key={`${song.id}-${idx}`}
                className="group flex items-center justify-between p-2.5 rounded-2xl bg-white/70 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 hover:border-purple-500/40 transition"
              >
                <div className="flex items-center gap-3 min-w-0 pr-2">
                  <div className="relative w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0">
                    <img
                      src={song.artwork || '/placeholder.png'}
                      alt={song.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                    <button
                      onClick={() => onPlaySong(song)}
                      className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white cursor-pointer"
                    >
                      <Play className="w-4 h-4 fill-current" />
                    </button>
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {song.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{song.artist}</p>
                    {song.whyPicked && (
                      <p className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold truncate mt-0.5">
                        ✨ {song.whyPicked}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => onPlaySong(song)}
                    className="p-2 rounded-xl hover:bg-amber-500/10 text-amber-600 dark:text-amber-400 transition cursor-pointer"
                    title="Play Track"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                  </button>
                  <button
                    onClick={() => onAddToQueue(song)}
                    className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition cursor-pointer"
                    title="Add to Queue"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
