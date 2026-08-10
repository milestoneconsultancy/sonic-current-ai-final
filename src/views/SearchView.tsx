import React, { useState } from 'react';
import { Search, Play, Plus, Grid, List, Music2, Sparkles, Filter } from 'lucide-react';
import { Song } from '../types';
import { SongListItem } from '../components/SongListItem';
import { SongCard } from '../components/SongCard';

interface SearchViewProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  searchResults: Song[];
  isSearching: boolean;
  searchError: string | null;
  currentSong: Song | null;
  isPlaying: boolean;
  favoritesSet: Set<string>;
  downloadedSet: Set<string>;
  downloadingSet: Set<string>;
  activeContextQuery?: string;
  onPlaySong: (song: Song, index?: number) => void;
  onPlayAll: (songs: Song[]) => void;
  onToggleFavorite: (song: Song) => void;
  onDownloadSong: (song: Song) => void;
  onAddToQueue: (song: Song) => void;
  onAddAllToQueue: (songs: Song[]) => void;
}

export const SearchView: React.FC<SearchViewProps> = ({
  searchQuery,
  onSearchChange,
  searchResults,
  isSearching,
  searchError,
  currentSong,
  isPlaying,
  favoritesSet,
  downloadedSet,
  downloadingSet,
  activeContextQuery,
  onPlaySong,
  onPlayAll,
  onToggleFavorite,
  onDownloadSong,
  onAddToQueue,
  onAddAllToQueue,
}) => {
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  const popularQueries = [
    'Kesariya',
    'Arijit Singh',
    'Ganpati DJ',
    'Marathi Hits',
    'Bollywood Top 20',
    'Pritam',
    'Shreya Ghoshal',
    'Badshah DJ',
  ];

  return (
    <div className="space-y-6 pb-24">
      {/* Header Bar Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Search className="w-5 h-5 text-amber-600" />
            {searchQuery.trim() ? `Search Results for "${searchQuery.trim()}"` : 'Explore Music'}
          </h2>
          <div className="flex items-center gap-2 flex-wrap mt-0.5">
            <p className="text-xs text-slate-500 font-medium">
              {searchResults.length > 0 ? `${searchResults.length} songs found` : 'Search any song, artist, album or genre'}
            </p>
            {activeContextQuery && searchQuery.trim() && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-700 text-[11px] font-bold">
                <Sparkles className="w-3 h-3 text-amber-600 shrink-0" />
                {activeContextQuery}
              </span>
            )}
          </div>
        </div>

        {/* View Toggle & Action Buttons */}
        <div className="flex items-center gap-2.5 self-end sm:self-auto">
          {searchResults.length > 0 && (
            <>
              <button
                onClick={() => onPlayAll(searchResults)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition"
              >
                <Play className="w-3.5 h-3.5 fill-current text-amber-400" /> Play All
              </button>
              <button
                onClick={() => onAddAllToQueue(searchResults)}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 font-bold text-xs flex items-center gap-1.5 transition"
              >
                <Plus className="w-3.5 h-3.5" /> Queue All
              </button>
            </>
          )}

          {/* View Mode Toggle */}
          <div className="flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200 text-slate-500">
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition ${viewMode === 'list' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'}`}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition ${viewMode === 'grid' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'}`}
            >
              <Grid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {searchError && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center justify-between">
          <span>{searchError}</span>
        </div>
      )}

      {/* Loading State */}
      {isSearching && (
        <div className="py-20 flex flex-col items-center justify-center space-y-3">
          <div className="w-10 h-10 rounded-full border-2 border-amber-600 border-t-transparent animate-spin" />
          <p className="text-xs font-mono font-bold text-slate-500">Searching high quality audio streams...</p>
        </div>
      )}

      {/* Results View */}
      {!isSearching && searchResults.length > 0 && (
        <div>
          {viewMode === 'list' ? (
            <div className="space-y-2">
              {searchResults.map((song, idx) => (
                <SongListItem
                  key={`${song.id}_${idx}`}
                  song={song}
                  isPlaying={isPlaying}
                  isCurrent={currentSong?.id === song.id}
                  isFavorite={favoritesSet.has(song.id)}
                  isDownloaded={downloadedSet.has(song.id)}
                  isDownloading={downloadingSet.has(song.id)}
                  onPlay={() => onPlaySong(song, idx)}
                  onToggleFavorite={onToggleFavorite}
                  onDownload={onDownloadSong}
                  onAddToQueue={onAddToQueue}
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {searchResults.map((song, idx) => (
                <SongCard
                  key={`${song.id}_${idx}`}
                  song={song}
                  isPlaying={isPlaying}
                  isCurrent={currentSong?.id === song.id}
                  isFavorite={favoritesSet.has(song.id)}
                  isDownloaded={downloadedSet.has(song.id)}
                  isDownloading={downloadingSet.has(song.id)}
                  onPlay={() => onPlaySong(song, idx)}
                  onToggleFavorite={onToggleFavorite}
                  onDownload={onDownloadSong}
                  onAddToQueue={onAddToQueue}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Empty / Welcome Search Prompt State */}
      {!isSearching && searchResults.length === 0 && (
        <div className="py-12 px-6 rounded-3xl bg-white border border-slate-200/90 text-center space-y-6 max-w-2xl mx-auto shadow-xs">
          <div className="w-16 h-16 rounded-3xl bg-amber-100 border border-amber-200 flex items-center justify-center mx-auto text-amber-700">
            <Music2 className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h3 className="text-2xl font-black text-slate-900">SONIC CURRENT MUSIC SEARCH</h3>
            <p className="text-xs font-bold text-amber-600 uppercase tracking-widest">
              MADE BY ONE CLICK SOLUTION
            </p>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed font-medium pt-1">
              Type any song name, artist, Marathi DJ track, or Bollywood hits in the search bar to listen immediately.
            </p>
          </div>

          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3 block">
              Popular Searches
            </span>
            <div className="flex flex-wrap justify-center gap-2">
              {popularQueries.map((query) => (
                <button
                  key={query}
                  onClick={() => onSearchChange(query)}
                  className="px-4 py-2 rounded-xl bg-slate-50 hover:bg-slate-900 hover:text-white border border-slate-200 text-xs font-bold text-slate-700 transition shadow-xs"
                >
                  {query}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
