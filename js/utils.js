// Lightweight seeded RNG for consistent shuffles
export function mulberry32(a){
  return function(){
    let t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
}

export function rgbToHex(r,g,b){
  r=Math.round(r); g=Math.round(g); b=Math.round(b);
  return '#' + [r,g,b].map(v => v.toString(16).padStart(2,'0')).join('');
}

export function hexToRgb(h){
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(h);
  if(!m) return [128,128,128];
  return [parseInt(m[1],16), parseInt(m[2],16), parseInt(m[3],16)];
}

export function jitterHex(h, amt=12){
  const [r,g,b] = hexToRgb(h);
  const j = (v)=>Math.max(0, Math.min(255, v + (Math.random()*2-1)*amt|0));
  return rgbToHex(j(r), j(g), j(b));
}