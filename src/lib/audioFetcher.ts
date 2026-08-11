export interface FetchAudioResult {
  blob: Blob;
  size: number;
  mimeType: string;
}

/**
 * Single reliable reusable audio-fetch function with strict validation.
 * Traces complete pipeline: Song URL -> Proxy /api/audio -> Audio Blob -> Verification
 */
export async function fetchAudioBlob(
  songUrl: string,
  filename: string = 'song.mp3'
): Promise<FetchAudioResult> {
  console.log(`[AUDIO] source URL: ${songUrl}`);

  if (!songUrl || typeof songUrl !== 'string' || !songUrl.trim()) {
    console.error('[AUDIO] Validation failed: Empty or missing song URL');
    throw new Error('Song audio source URL is missing.');
  }

  const proxyUrl = `/api/audio?url=${encodeURIComponent(songUrl.trim())}&download=true&filename=${encodeURIComponent(filename)}`;
  console.log(`[AUDIO] fetching proxy: ${proxyUrl}`);

  let response: Response;
  try {
    response = await fetch(proxyUrl);
  } catch (networkErr: any) {
    console.error('[AUDIO] Network error while fetching audio proxy:', networkErr);
    throw new Error('Network error. Unable to connect to audio server.');
  }

  console.log(`[AUDIO] proxy status: ${response.status}`);

  if (!response.ok) {
    let errorDetail = '';
    try {
      const errJson = await response.json();
      errorDetail = errJson.error || errJson.message || '';
    } catch (e) {
      // ignore json parse error
    }
    console.error(`[AUDIO] Proxy returned error status ${response.status}: ${errorDetail}`);
    throw new Error(errorDetail || `Unable to retrieve audio stream (Status ${response.status}).`);
  }

  const contentType = (response.headers.get('content-type') || '').toLowerCase();
  console.log(`[AUDIO] content-type: ${contentType}`);

  // Only reject if content-type is explicitly HTML or JSON
  if (
    contentType.includes('text/html') ||
    contentType.includes('application/json')
  ) {
    console.error('[AUDIO] Received non-audio Content-Type:', contentType);
    throw new Error('Audio proxy returned text or JSON instead of audio stream.');
  }

  let blob: Blob;
  try {
    blob = await response.blob();
  } catch (blobErr: any) {
    console.error('[AUDIO] Failed to read audio response blob:', blobErr);
    throw new Error('Failed to parse audio response data.');
  }

  console.log(`[AUDIO] blob size: ${blob.size} bytes`);

  if (!blob || blob.size < 1000) {
    console.error(`[AUDIO] Blob verification failed: Size is ${blob?.size || 0} bytes`);
    throw new Error(`Audio download incomplete (${blob?.size || 0} bytes received).`);
  }

  if (blob.type && (blob.type.includes('json') || blob.type.includes('html'))) {
    console.error('[AUDIO] Blob type is non-audio:', blob.type);
    throw new Error('Downloaded payload is an error document, not audio data.');
  }

  const finalMimeType =
    blob.type && (blob.type.startsWith('audio/') || blob.type.startsWith('video/'))
      ? blob.type
      : 'audio/mpeg';

  console.log(`[AUDIO] Verification successful. Valid audio Blob ready (${blob.size} bytes, ${finalMimeType})`);

  return {
    blob,
    size: blob.size,
    mimeType: finalMimeType,
  };
}
