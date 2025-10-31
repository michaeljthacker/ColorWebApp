import { mulberry32, rgbToHex, hexToRgb, jitterHex } from './utils.js';

// Palette extraction using mini k-means clustering (fully client-side)
export async function extractPaletteFromImageBitmap(bmp, k=5, down=80, iters=10){
  // Draw to a small temp canvas for sampling
  const t = document.createElement('canvas');
  const tw = down, th = Math.max(1, Math.round(down * (bmp.height / bmp.width)));
  t.width = tw; t.height = th;
  const tctx = t.getContext('2d', { willReadFrequently:true });
  tctx.drawImage(bmp, 0, 0, tw, th);
  const { data } = tctx.getImageData(0, 0, tw, th);

  // Collect RGB samples (skip fully transparent)
  const samples = [];
  for (let i = 0; i < data.length; i += 4) {
    const a = data[i+3];
    if (a < 8) continue;
    const r = data[i], g = data[i+1], b = data[i+2];
    // Slight gamma-ish shaping to favor midtones
    samples.push([r, g, b]);
  }
  if (samples.length === 0) return ['#666','#888','#aaa','#ccc','#eee'];

  // Init centroids by random samples
  const rand = mulberry32(Math.floor(Math.random()*1e9));
  const centroids = [];
  for (let i = 0; i < k; i++){
    const s = samples[Math.floor(rand() * samples.length)];
    centroids.push(s.slice());
  }

  // K-means iterations
  for (let it = 0; it < iters; it++){
    const buckets = Array.from({length:k}, () => ({sum:[0,0,0], n:0}));
    for (let s of samples){
      let bi=0, bd=Infinity;
      for (let ci=0; ci<k; ci++){
        const c = centroids[ci];
        // Euclidean distance in RGB
        const dr=s[0]-c[0], dg=s[1]-c[1], db=s[2]-c[2];
        const d = dr*dr + dg*dg + db*db;
        if (d < bd){ bd=d; bi=ci; }
      }
      const b = buckets[bi];
      b.sum[0]+=s[0]; b.sum[1]+=s[1]; b.sum[2]+=s[2]; b.n++;
    }
    // Recompute centroids
    for (let ci=0; ci<k; ci++){
      const b = buckets[ci];
      if (b.n){
        centroids[ci][0] = b.sum[0]/b.n;
        centroids[ci][1] = b.sum[1]/b.n;
        centroids[ci][2] = b.sum[2]/b.n;
      } else {
        // re-seed empty cluster
        const s = samples[Math.floor(rand()*samples.length)];
        centroids[ci] = s.slice();
      }
    }
  }

  // Sort by “perceptual brightness” to get a nice order
  const hex = centroids
    .map(c => ({
      c,
      l: 0.2126*c[0] + 0.7152*c[1] + 0.0722*c[2]
    }))
    .sort((a,b) => a.l - b.l)
    .map(o => rgbToHex(o.c[0], o.c[1], o.c[2]));

  return uniqueish(hex);
}

function uniqueish(list){
  // De-duplicate near-duplicates by collapsing similar hexes
  const out = [];
  for (const h of list){
    const [r,g,b] = hexToRgb(h);
    let keep = true;
    for (const oh of out){
      const [or,og,ob] = hexToRgb(oh);
      const d = (r-or)**2 + (g-og)**2 + (b-ob)**2;
      if (d < 400) { keep=false; break; } // ~20 delta
    }
    if (keep) out.push(h);
  }
  // Ensure at least 5 by adding jittered variants if needed
  while (out.length < 5){
    const base = out[out.length-1] || '#888888';
    out.push(jitterHex(base, 10));
  }
  return out.slice(0,5);
}