import { mulberry32 } from './utils.js';
import { extractPaletteFromImageBitmap } from './palette.js';
import { styles } from './styles.js';

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { willReadFrequently:true }); // for color sampling perf
const overlay = document.getElementById('overlay');
const toast = document.getElementById('toast');
const paletteEl = document.getElementById('palette');
const fileInput = document.getElementById('fileInput');
const openBtn = document.getElementById('openBtn');
const shuffleBtn = document.getElementById('shuffleBtn');
const exportBtn = document.getElementById('exportBtn');
const copyBtn   = document.getElementById('copyBtn');
const modeSel   = document.getElementById('mode');

let currentImageBitmap = null;
let currentPalette = ['#2f2f2f','#6b6b6b','#9a9a9a','#c5c5c5','#efefef'];
let rngSeed = Math.random() * 1e9;

// Resize canvas to full window
function fit() {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width  = Math.floor(innerWidth  * dpr);
  canvas.height = Math.floor(innerHeight * dpr);
  canvas.style.width  = innerWidth + 'px';
  canvas.style.height = innerHeight + 'px';
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  repaint();
}
window.addEventListener('resize', fit, { passive:true });
fit();

function showToast(msg, ms=1400){
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), ms);
}

function repaint(){
  const mode = modeSel.value;
  const seeded = mulberry32(Math.floor(rngSeed));

  const paintFn = styles[mode] || styles.stripes;
  paintFn(ctx, canvas, currentPalette, seeded);

  addGrainOverlay(0.07, seeded); // subtle film grain to unify
  drawSignature();
  drawPaletteBar(currentPalette);
}

function addGrainOverlay(strength = 0.08, rand){
  const W = Math.ceil(canvas.width/2), H = Math.ceil(canvas.height/2);
  const n = document.createElement('canvas');
  n.width = W; n.height = H;
  const nctx = n.getContext('2d');
  const img = nctx.createImageData(W, H);
  for (let i=0; i<img.data.length; i+=4){
    const v = 128 + Math.floor((rand()*2-1) * 255 * strength);
    img.data[i] = img.data[i+1] = img.data[i+2] = v;
    img.data[i+3] = 255;
  }
  nctx.putImageData(img, 0, 0);
  ctx.save();
  ctx.globalAlpha = 0.15;
  ctx.globalCompositeOperation = 'soft-light';
  ctx.drawImage(n, 0, 0, W, H, 0, 0, canvas.width, canvas.height);
  ctx.restore();
}

function drawSignature(){
  ctx.fillStyle = 'rgba(255,255,255,.2)';
  ctx.font = '10px sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('Palette Collage', canvas.width-12, canvas.height-12);
}

function drawPaletteBar(colors){
  paletteEl.innerHTML = '';
  for (const c of colors){
    const swatch = document.createElement('div');
    swatch.className = 'swatch';
    swatch.style.background = c;
    const label = document.createElement('span');
    label.textContent = c;
    swatch.append(label);
    paletteEl.append(swatch);
  }
}

async function handleImageFile(file){
  if (!file || !file.type.startsWith('image/')) return;
  openBtn.classList.add('glow');
  openBtn.textContent = 'Processing...';
  try {
    const bmp = await createImageBitmap(file);
    currentImageBitmap = bmp;
    const palette = await extractPaletteFromImageBitmap(bmp);
    currentPalette = palette;
    shuffle();
  } catch(e){
    console.error(e);
    showToast('Could not process that image.');
  } finally {
    openBtn.classList.remove('glow');
    openBtn.textContent = 'Open Image';
  }
}

async function loadImageFromUrl(url){
  openBtn.classList.add('glow');
  openBtn.textContent = 'Downloading...';
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Download failed');
    const blob = await res.blob();
    await handleImageFile(blob);
  } catch(e){
    console.error(e);
    showToast('Could not load image from URL.');
    openBtn.classList.remove('glow');
    openBtn.textContent = 'Open Image';
  }
}

function shuffle(){
  rngSeed = Math.random() * 1e9;
  repaint();
}

function exportPNG(){
  const link = document.createElement('a');
  link.download = `palette-collage-${modeSel.value}-${Date.now()}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
  showToast('Exported as PNG.');
}

function copyPalette(){
  const text = currentPalette.join(', ');
  navigator.clipboard.writeText(text).then(() => {
    showToast('Palette copied to clipboard.');
  }, () => {
    showToast('Could not copy palette.');
  });
}

// --- Event Listeners ---
openBtn.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', (e) => handleImageFile(e.target.files[0]));
shuffleBtn.addEventListener('click', shuffle);
exportBtn.addEventListener('click', exportPNG);
copyBtn.addEventListener('click', copyPalette);
modeSel.addEventListener('change', repaint);

// Drag & Drop
document.addEventListener('dragover', e => {
  e.preventDefault();
  overlay.classList.add('show');
});
document.addEventListener('dragleave', e => {
  e.preventDefault();
  overlay.classList.remove('show');
});
document.addEventListener('drop', e => {
  e.preventDefault();
  overlay.classList.remove('show');
  if (e.dataTransfer.files.length > 0){
    handleImageFile(e.dataTransfer.files[0]);
  }
});

// Paste
document.addEventListener('paste', e => {
  const items = e.clipboardData.items;
  for (let i=0; i<items.length; i++){
    if (items[i].type.indexOf('image') !== -1){
      const blob = items[i].getAsFile();
      handleImageFile(blob);
      showToast('Pasted image.');
      return;
    }
  }
});

// Keyboard shortcuts
document.addEventListener('keydown', e => {
  if (document.activeElement !== document.body) return; // ignore if in input
  if (e.code === 'Space') shuffle();
  if (e.code === 'KeyO') openBtn.click();
  if (e.code === 'KeyE') exportBtn.click();
  if (e.code === 'KeyC') copyBtn.click();

  const keyMap = ['1','2','3','4','5','6','7','8','9','0','Q','W','R','T','Y'];
  const digit = e.key.toUpperCase();
  const idx = keyMap.indexOf(digit);
  if (idx > -1 && idx < modeSel.options.length){
    modeSel.selectedIndex = idx;
    repaint();
  }
});

// --- Init ---
drawPaletteBar(currentPalette);
repaint();
showToast('Drop an image or click "Open Image"', 2000);
// Check for URL param
const urlParams = new URLSearchParams(window.location.search);
const imageUrl = urlParams.get('img');
if (imageUrl) {
  loadImageFromUrl(imageUrl);
}