/**
 * Color extraction utility for Apple Music Now Playing dynamic backgrounds.
 * Extracts dominant and complementary colors from an image URL using HTML Canvas
 * and generates smooth CSS gradient strings.
 */

export interface ExtractedColors {
  primary: string;
  secondary: string;
  darkGradient: string;
  lightGradient: string;
}

// In-memory cache for extracted gradients by image URL
const colorCache = new Map<string, ExtractedColors>();

export async function extractGradientFromArtwork(imageUrl: string): Promise<ExtractedColors> {
  if (!imageUrl) {
    return getDefaultGradients();
  }

  if (colorCache.has(imageUrl)) {
    return colorCache.get(imageUrl)!;
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.referrerPolicy = 'no-referrer';

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) {
          resolve(getDefaultGradients());
          return;
        }

        // Downscale for fast sampling
        const width = 32;
        const height = 32;
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        const imgData = ctx.getImageData(0, 0, width, height).data;
        let rSumTop = 0, gSumTop = 0, bSumTop = 0, countTop = 0;
        let rSumBottom = 0, gSumBottom = 0, bSumBottom = 0, countBottom = 0;

        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            const index = (y * width + x) * 4;
            const r = imgData[index];
            const g = imgData[index + 1];
            const b = imgData[index + 2];
            const a = imgData[index + 3];

            if (a < 128) continue; // skip transparent

            if (y < height / 2) {
              rSumTop += r;
              gSumTop += g;
              bSumTop += b;
              countTop++;
            } else {
              rSumBottom += r;
              gSumBottom += g;
              bSumBottom += b;
              countBottom++;
            }
          }
        }

        const topR = countTop ? Math.round(rSumTop / countTop) : 30;
        const topG = countTop ? Math.round(gSumTop / countTop) : 20;
        const topB = countTop ? Math.round(bSumTop / countTop) : 40;

        const botR = countBottom ? Math.round(rSumBottom / countBottom) : 15;
        const botG = countBottom ? Math.round(gSumBottom / countBottom) : 10;
        const botB = countBottom ? Math.round(bSumBottom / countBottom) : 25;

        // Enhance saturation & tone for rich Apple Music depth
        const topColor = `rgb(${topR}, ${topG}, ${topB})`;
        const botColor = `rgb(${botR}, ${botG}, ${botB})`;

        const darkGradient = `linear-gradient(180deg, rgba(${topR}, ${topG}, ${topB}, 0.85) 0%, rgba(${Math.round(topR * 0.4)}, ${Math.round(topG * 0.4)}, ${Math.round(topB * 0.4)}, 0.95) 45%, #000000 100%)`;
        const lightGradient = `linear-gradient(180deg, rgba(${Math.min(255, topR + 80)}, ${Math.min(255, topG + 80)}, ${Math.min(255, topB + 80)}, 0.4) 0%, rgba(${Math.min(255, botR + 60)}, ${Math.min(255, botG + 60)}, ${Math.min(255, botB + 60)}, 0.25) 50%, #FFFFFF 100%)`;

        const result: ExtractedColors = {
          primary: topColor,
          secondary: botColor,
          darkGradient,
          lightGradient,
        };

        colorCache.set(imageUrl, result);
        resolve(result);
      } catch (err) {
        // Fallback on canvas security/CORS restriction
        resolve(getDefaultGradients());
      }
    };

    img.onerror = () => {
      resolve(getDefaultGradients());
    };

    img.src = imageUrl;
  });
}

function getDefaultGradients(): ExtractedColors {
  return {
    primary: 'rgb(250, 45, 72)',
    secondary: 'rgb(30, 30, 32)',
    darkGradient: 'linear-gradient(180deg, rgba(80, 20, 30, 0.9) 0%, rgba(30, 10, 15, 0.95) 50%, #000000 100%)',
    lightGradient: 'linear-gradient(180deg, rgba(254, 230, 235, 0.6) 0%, rgba(242, 242, 247, 0.8) 50%, #FFFFFF 100%)',
  };
}
