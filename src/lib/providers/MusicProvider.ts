export interface SongItem {
  id: string;
  title: string;
  song?: string;
  artist: string;
  singers?: string;
  album: string;
  duration: string;
  image: string;
  artwork?: string;
  perma_url?: string;
  url: string;
  media_url?: string;
  language: string;
  has320?: boolean;
  provider?: string;
  whyPicked?: string;
}

/**
 * Clean internal abstraction interface for Music Data and Audio Streams.
 * Allows adding or swapping music providers (e.g. JioSaavn, Backup Mirrored Services, etc.)
 */
export interface MusicProvider {
  name: string;
  isHealthy(): Promise<boolean>;
  search(query: string, page?: number): Promise<SongItem[]>;
  getTrending(languages?: string[]): Promise<SongItem[]>;
}

// TODO: Add a second independent music provider implementation here in src/lib/providers/
// (e.g., YouTube Music / Invidious / Spotify Preview / Soundcloud Provider) as an alternative backup source.

export class MultiProviderMusicManager {
  private providers: MusicProvider[];

  constructor(providers: MusicProvider[]) {
    this.providers = providers;
  }

  async search(
    query: string,
    page: number = 1
  ): Promise<{ songs: SongItem[]; providerUsed: string; error?: string }> {
    for (const provider of this.providers) {
      try {
        const results = await provider.search(query, page);
        if (results && results.length > 0) {
          return { songs: results.map(s => ({ ...s, provider: provider.name })), providerUsed: provider.name };
        }
      } catch (err: any) {
        console.warn(`[MusicProvider Failover] ${provider.name} search failed for query "${query}":`, err?.message || err);
      }
    }
    return {
      songs: [],
      providerUsed: 'none',
      error: 'Music service temporarily unavailable, retrying...',
    };
  }

  async getTrending(
    languages: string[] = []
  ): Promise<{ songs: SongItem[]; providerUsed: string; error?: string }> {
    for (const provider of this.providers) {
      try {
        const results = await provider.getTrending(languages);
        if (results && results.length > 0) {
          return { songs: results.map(s => ({ ...s, provider: provider.name })), providerUsed: provider.name };
        }
      } catch (err: any) {
        console.warn(`[MusicProvider Failover] ${provider.name} getTrending failed:`, err?.message || err);
      }
    }
    return {
      songs: [],
      providerUsed: 'none',
      error: 'Music service temporarily unavailable, retrying...',
    };
  }
}
