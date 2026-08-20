import CryptoJS from 'crypto-js';
import { MusicProvider, SongItem } from './MusicProvider';

function decryptMediaUrl(encryptedUrl: string): string {
  if (!encryptedUrl) return '';
  try {
    const key = CryptoJS.enc.Utf8.parse('38346591');
    const decrypted = CryptoJS.DES.decrypt(
      CryptoJS.lib.CipherParams.create({ ciphertext: CryptoJS.enc.Base64.parse(encryptedUrl.trim()) }),
      key,
      { mode: CryptoJS.mode.ECB, padding: CryptoJS.pad.Pkcs7 }
    );
    const decStr = decrypted.toString(CryptoJS.enc.Utf8);
    if (!decStr) return '';
    // 160kbps AAC is available for 100% of songs, provides instant sub-second buffering & CD-quality sound
    return decStr.replace('_96.mp4', '_160.mp4');
  } catch (error) {
    console.error('[DES Decryption Error]:', error);
    return '';
  }
}

function cleanString(str: string): string {
  if (!str) return '';
  return str
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&#039;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\\\(From "([^"]+)"\\\)/g, "(From '$1')")
    .trim();
}

/**
 * Primary Music Provider relying on direct JioSaavn Internal API.
 */
export class PrimaryJioSaavnProvider implements MusicProvider {
  name = 'JioSaavn-Primary';

  async isHealthy(): Promise<boolean> {
    try {
      const res = await fetch('https://www.jiosaavn.com/api.php?__call=autocomplete.get&_format=json&query=test', {
        headers: { 'User-Agent': 'Mozilla/5.0' },
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  async search(query: string, page: number = 1): Promise<SongItem[]> {
    if (!query || !query.trim()) return [];
    const pageNum = Math.max(1, page || 1);
    const searchUrl = `https://www.jiosaavn.com/api.php?__call=search.getResults&_format=json&_marker=0&cc=in&includeMetaTags=1&q=${encodeURIComponent(
      query.trim()
    )}&p=${pageNum}&n=50`;

    const res = await fetch(searchUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    if (!res.ok) throw new Error(`Primary JioSaavn HTTP ${res.status}`);
    const rawText = await res.text();
    let json: any = {};
    try {
      json = JSON.parse(rawText);
    } catch {
      json = {};
    }

    const rawList = Array.isArray(json?.results) ? json.results : [];
    const formatted: SongItem[] = [];

    for (const song of rawList) {
      let mediaUrl = decryptMediaUrl(song.encrypted_media_url);
      if (!mediaUrl && song.media_preview_url) {
        mediaUrl = song.media_preview_url.replace('preview', 'aac').replace('_96_p.mp4', '_160.mp4');
      }

      const title = cleanString(song.song || song.title || 'Unknown Title');
      const artist = cleanString(song.primary_artists || song.singers || song.music || 'Unknown Artist');
      const album = cleanString(song.album || '');
      const duration = song.duration || '0';
      const image = (song.image || '').replace('150x150', '500x500').replace('50x50', '500x500');
      const songLang = cleanString(song.language || 'Hindi');

      formatted.push({
        id: String(song.id),
        title,
        song: title,
        artist,
        singers: artist,
        album,
        duration,
        image,
        artwork: image,
        perma_url: song.perma_url || '',
        url: mediaUrl,
        media_url: mediaUrl,
        language: songLang,
        has320: song['320kbps'] === 'true' || mediaUrl.includes('_320'),
      });
    }

    return formatted;
  }

  async getTrending(languages: string[] = []): Promise<SongItem[]> {
    let trendQuery = 'latest trending indian hits';
    if (languages.length > 0 && !languages.map(l => l.toLowerCase()).includes('all indian languages')) {
      trendQuery = `latest ${languages.join(' ')} hits`;
    }
    return this.search(trendQuery, 1);
  }
}

/**
 * Secondary Backup Provider using Autocomplete + Song Details API & Mirrored APIs.
 */
export class SecondaryJioSaavnProvider implements MusicProvider {
  name = 'JioSaavn-Secondary-Backup';

  async isHealthy(): Promise<boolean> {
    return true;
  }

  async search(query: string, page: number = 1): Promise<SongItem[]> {
    if (!query || !query.trim()) return [];

    // Attempt Autocomplete -> Details pipeline
    try {
      const autoUrl = `https://www.jiosaavn.com/api.php?__call=autocomplete.get&_format=json&_marker=0&cc=in&includeMetaTags=1&query=${encodeURIComponent(
        query.trim()
      )}`;
      const autoRes = await fetch(autoUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
      });

      if (autoRes.ok) {
        const rawText = await autoRes.text();
        const cleanAutoText = rawText.replace(/\\\(From "([^"]+)"\\\)/g, "(From '$1')");
        let autoJson: any = {};
        try {
          autoJson = JSON.parse(cleanAutoText);
        } catch {
          autoJson = {};
        }

        const songList = autoJson?.songs?.data || [];
        const pids = songList.map((s: any) => s.id).filter(Boolean);

        if (pids.length > 0) {
          const detailsUrl = `https://www.jiosaavn.com/api.php?__call=song.getDetails&cc=in&_marker=0&_format=json&pids=${pids.join(
            ','
          )}`;
          const detailsRes = await fetch(detailsUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });

          if (detailsRes.ok) {
            const detailsJson = await detailsRes.json();
            const formattedSongs: SongItem[] = [];

            for (const pid of pids) {
              const song = detailsJson[pid];
              if (!song) continue;

              let mediaUrl = decryptMediaUrl(song.encrypted_media_url);
              if (!mediaUrl && song.media_preview_url) {
                mediaUrl = song.media_preview_url.replace('preview', 'aac').replace('_96_p.mp4', '_160.mp4');
              }

              const title = cleanString(song.song || song.title || 'Unknown Title');
              const artist = cleanString(song.singers || song.primary_artists || song.music || 'Unknown Artist');
              const album = cleanString(song.album || '');
              const duration = song.duration || '0';
              const image = (song.image || '').replace('150x150', '500x500').replace('50x50', '500x500');
              const songLang = cleanString(song.language || 'Hindi');

              formattedSongs.push({
                id: String(song.id),
                title,
                song: title,
                artist,
                singers: artist,
                album,
                duration,
                image,
                artwork: image,
                perma_url: song.perma_url || '',
                url: mediaUrl,
                media_url: mediaUrl,
                language: songLang,
                has320: song['320kbps'] === 'true' || mediaUrl.includes('_320'),
              });
            }

            if (formattedSongs.length > 0) return formattedSongs;
          }
        }
      }
    } catch (err) {
      console.warn('[Secondary Backup Provider Autocomplete failed]:', err);
    }

    // Secondary fallback to public saavn.dev API mirror
    try {
      const mirrorUrl = `https://saavn.dev/api/search/songs?query=${encodeURIComponent(query.trim())}&page=${page}&limit=40`;
      const mirrorRes = await fetch(mirrorUrl);
      if (mirrorRes.ok) {
        const mirrorData = await mirrorRes.json();
        const results = mirrorData?.data?.results || [];
        const formattedSongs: SongItem[] = [];

        for (const song of results) {
          const downloadUrl = song.downloadUrl?.[song.downloadUrl.length - 1]?.url || song.downloadUrl?.[0]?.url || '';
          const imageUrl = song.image?.[song.image.length - 1]?.url || song.image?.[0]?.url || '';
          const title = cleanString(song.name || song.title || 'Unknown');
          const artist = cleanString(song.artists?.primary?.[0]?.name || song.artist || 'Unknown Artist');

          formattedSongs.push({
            id: String(song.id),
            title,
            song: title,
            artist,
            singers: artist,
            album: cleanString(song.album?.name || ''),
            duration: String(song.duration || '0'),
            image: imageUrl,
            artwork: imageUrl,
            perma_url: song.url || '',
            url: downloadUrl,
            media_url: downloadUrl,
            language: song.language || 'Hindi',
            has320: true,
          });
        }
        return formattedSongs;
      }
    } catch (err) {
      console.warn('[Saavn Mirror API Fallback failed]:', err);
    }

    return [];
  }

  async getTrending(languages: string[] = []): Promise<SongItem[]> {
    let trendQuery = 'latest trending indian hits';
    if (languages.length > 0) {
      trendQuery = `latest ${languages.join(' ')} hits`;
    }
    return this.search(trendQuery, 1);
  }
}
