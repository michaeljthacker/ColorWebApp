import { mulberry32 } from './utils.js';
import { extractPaletteFromImageBitmap } from './palette.js';
import { styles } from './styles.js';

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { willReadFrequently:true }); // for color sampling perf
const overlay = document.getElementById('overlay');
const toast = document.getElementById('toast');
const paletteEl = document.getElementById('palette');
const fileInput = document.getElementById('fileInput');
const shuffleBtn = document.getElementById('shuffleBtn');
const exportBtn = document.getElementById('exportBtn');
const copyBtn   = document.getElementById('copyBtn');
const modeSel   = document.getElementById('mode');
const hamburgerBtn = document.getElementById('hamburgerBtn');
const cameraBtn = document.getElementById('cameraBtn');
const chrome = document.querySelector('.chrome');
const fileLabel = document.querySelector('label.file'); // Reference to the file label instead



let currentImageBitmap = null;
let currentPalette = ['#2f2f2f','#6b6b6b','#9a9a9a','#c5c5c5','#efefef'];
let rngSeed = Math.random() * 1e9;

// Mobile scaling and touch gesture variables
let scaleFactor = 1.0;
let lastTouchDistance = 0;
let touchStartY = 0;
let touchStartTime = 0;
const isMobile = () => window.innerWidth < 768;

// Resize canvas to full window
function fit() {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width  = Math.floor(innerWidth  * dpr);
  canvas.height = Math.floor(innerHeight * dpr);
  canvas.style.width  = innerWidth + 'px';
  canvas.style.height = innerHeight + 'px';
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  repaint();
  
  // Reset collapsed state when switching to desktop view
  if (innerWidth >= 768 && chrome.classList.contains('collapsed')) {
    chrome.classList.remove('collapsed');
  }
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

  // Create virtual canvas with scaled dimensions
  let virtualWidth = canvas.width;
  let virtualHeight = canvas.height;
  
  if (isMobile()) {
    // Make the virtual canvas bigger so elements appear smaller when scaled down
    const baseScale = Math.max(innerWidth, innerHeight) / 400; // Make virtual canvas larger
    virtualWidth = canvas.width * baseScale * (1 / scaleFactor);
    virtualHeight = canvas.height * baseScale * (1 / scaleFactor);
  } else {
    // Desktop can still use zoom scaling
    virtualWidth = canvas.width * (1 / scaleFactor);
    virtualHeight = canvas.height * (1 / scaleFactor);
  }

  // Create virtual canvas object for paint functions
  const virtualCanvas = { width: virtualWidth, height: virtualHeight };
  
  // Save current context state
  ctx.save();
  
  // Scale the actual drawing to fit the real canvas
  const scaleX = canvas.width / virtualWidth;
  const scaleY = canvas.height / virtualHeight;
  ctx.scale(scaleX, scaleY);

  const paintFn = styles[mode] || styles.stripes;
  paintFn(ctx, virtualCanvas, currentPalette, seeded);

  // Restore context
  ctx.restore();

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
  fileLabel.classList.add('glow');
  fileLabel.textContent = 'Processing...';
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
    fileLabel.classList.remove('glow');
    fileLabel.textContent = 'Choose File';
  }
}

async function loadImageFromUrl(url){
  fileLabel.classList.add('glow');
  fileLabel.textContent = 'Downloading...';
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Download failed');
    const blob = await res.blob();
    await handleImageFile(blob);
  } catch(e){
    console.error(e);
    showToast('Could not load image from URL.');
    fileLabel.classList.remove('glow');
    fileLabel.textContent = 'Choose File';
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
  
  // Restore scroll capability after download on mobile (portrait or landscape)
  if (window.innerWidth <= 767 || (window.innerHeight <= 500 && window.innerWidth <= 1024)) {
    setTimeout(restoreScrollCapability, 500);
  }
}

// Restore scroll capability after downloads on mobile
function restoreScrollCapability() {
  const tempDiv = document.createElement('div');
  tempDiv.style.height = '1px';
  tempDiv.style.position = 'absolute';
  tempDiv.style.bottom = '-10px';
  tempDiv.style.left = '0';
  tempDiv.style.opacity = '0';
  tempDiv.style.pointerEvents = 'none';
  
  document.body.appendChild(tempDiv);
  
  // Force a small scroll to re-enable scrolling
  setTimeout(() => {
    window.scrollTo(0, 1);
    setTimeout(() => {
      window.scrollTo(0, 0);
      document.body.removeChild(tempDiv);
    }, 100);
  }, 100);
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
fileInput.addEventListener('change', (e) => handleImageFile(e.target.files[0]));
// Add both click and touch events for shuffle
if (shuffleBtn) {
  shuffleBtn.addEventListener('click', shuffle);
  shuffleBtn.addEventListener('touchend', (e) => {
    e.preventDefault();
    e.stopPropagation();
    shuffle();
  });
}
// Add touch events for all buttons
exportBtn.addEventListener('click', exportPNG);
exportBtn.addEventListener('touchend', (e) => { 
  e.preventDefault(); 
  e.stopPropagation(); 
  exportPNG(); 
});

copyBtn.addEventListener('click', copyPalette);
copyBtn.addEventListener('touchend', (e) => { 
  e.preventDefault(); 
  e.stopPropagation(); 
  copyPalette(); 
});

modeSel.addEventListener('change', repaint);

// Mobile hamburger toggle - add both click and touch events
function toggleHamburger() {
  chrome.classList.toggle('collapsed');
  const isCollapsed = chrome.classList.contains('collapsed');
  hamburgerBtn.setAttribute('aria-label', isCollapsed ? 'Show more controls' : 'Hide controls');
  hamburgerBtn.title = isCollapsed ? 'Show more controls' : 'Hide controls';
}

if (hamburgerBtn) {
  hamburgerBtn.addEventListener('click', toggleHamburger);
  hamburgerBtn.addEventListener('touchend', (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleHamburger();
  });
}

// Camera functionality for mobile - simplified approach
function openCamera() {
  // Create a hidden file input specifically for camera capture
  const cameraInput = document.createElement('input');
  cameraInput.type = 'file';
  cameraInput.accept = 'image/*';
  cameraInput.capture = 'environment'; // Use rear camera
  cameraInput.style.display = 'none';
  
  // Handle the captured image
  cameraInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
      handleImageFile(e.target.files[0]);
    }
    // Clean up the temporary input
    if (document.body.contains(cameraInput)) {
      document.body.removeChild(cameraInput);
    }
  });
  
  // Handle cancel (no file selected)
  cameraInput.addEventListener('cancel', () => {
    if (document.body.contains(cameraInput)) {
      document.body.removeChild(cameraInput);
    }
  });
  
  // Add to DOM and trigger
  document.body.appendChild(cameraInput);
  cameraInput.click();
}

// Setup camera button if supported
if (cameraBtn) {
  // Show camera button on mobile and tablet devices (touch devices)
  const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
  const isMobileOrTablet = window.innerWidth <= 1024; // Include tablets
  
  if (isTouchDevice && isMobileOrTablet) {
    cameraBtn.style.display = 'inline-flex';
  }
  cameraBtn.addEventListener('click', openCamera);
}

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
  if (e.code === 'KeyO') fileInput.click();
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

// --- Canvas Touch Gestures ---
if (isMobile()) {
  let isPinching = false;
  let hasMoved = false;

  canvas.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
      touchStartY = e.touches[0].clientY;
      touchStartTime = Date.now();
      isPinching = false;
      hasMoved = false;
    } else if (e.touches.length === 2) {
      // Start pinch gesture
      isPinching = true;
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      lastTouchDistance = Math.hypot(
        touch1.clientX - touch2.clientX,
        touch1.clientY - touch2.clientY
      );
    }
    e.preventDefault();
  });

  canvas.addEventListener('touchmove', (e) => {
    if (e.touches.length === 2 && isPinching) {
      // Pinch to zoom
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const currentDistance = Math.hypot(
        touch1.clientX - touch2.clientX,
        touch1.clientY - touch2.clientY
      );
      
      if (lastTouchDistance > 0) {
        const scale = currentDistance / lastTouchDistance;
        scaleFactor *= scale;
        scaleFactor = Math.max(0.3, Math.min(3.0, scaleFactor)); // Limit range
        repaint();
      }
      lastTouchDistance = currentDistance;
      e.preventDefault();
    } else if (e.touches.length === 1 && !isPinching) {
      // Track single finger movement for swipe detection
      const currentY = e.touches[0].clientY;
      const yDiff = Math.abs(currentY - touchStartY);
      if (yDiff > 10) { // Minimum movement to register as swipe
        hasMoved = true;
      }
    }
  });

  canvas.addEventListener('touchend', (e) => {
    if (e.touches.length === 0) { // All fingers lifted
      if (isPinching) {
        // End of pinch gesture - reset
        isPinching = false;
        lastTouchDistance = 0;
      } else if (e.changedTouches.length === 1) {
        // Single finger gesture ended
        const touchEndTime = Date.now();
        const touchEndY = e.changedTouches[0].clientY;
        const timeDiff = touchEndTime - touchStartTime;
        const yDiff = Math.abs(touchEndY - touchStartY);
        
        if (!hasMoved && timeDiff < 300 && yDiff < 30) {
          // Quick tap - shuffle
          shuffle();
        } else if (hasMoved && yDiff > 50) {
          // Swipe up/down - change style
          const modes = Object.keys(styles);
          const currentIndex = modes.indexOf(modeSel.value);
          const newIndex = touchEndY < touchStartY ? 
            (currentIndex + 1) % modes.length : 
            (currentIndex - 1 + modes.length) % modes.length;
          modeSel.value = modes[newIndex];
          repaint();
          showToast(`Style: ${modeSel.selectedOptions[0].text}`, 1000);
        }
      }
    }
    e.preventDefault();
  });
}

// --- Init ---
drawPaletteBar(currentPalette);
repaint();
showToast('Drop an image or click "Open Image"', 2000);

// Handle camera button visibility on resize/orientation change
function updateCameraButtonVisibility() {
  if (cameraBtn) {
    const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    const isMobileOrTablet = window.innerWidth <= 1024; // Include tablets
    
    if (isTouchDevice && isMobileOrTablet) {
      cameraBtn.style.display = 'inline-flex';
    } else {
      cameraBtn.style.display = 'none';
    }
  }
}

// Handle layout changes for orientation
function handleOrientationChange() {
  updateCameraButtonVisibility();
  
  // Auto-expand controls in landscape mode on mobile
  if (window.innerWidth <= 767 && window.innerWidth > window.innerHeight) {
    // We're in mobile landscape - expand controls for better usability
    chrome.classList.remove('collapsed');
  }
}

// Update camera button visibility and layout on resize
window.addEventListener('resize', updateCameraButtonVisibility);
window.addEventListener('orientationchange', () => {
  setTimeout(handleOrientationChange, 100); // Small delay for orientation change
});

// Check for URL param
const urlParams = new URLSearchParams(window.location.search);
const imageUrl = urlParams.get('img');
if (imageUrl) {
  loadImageFromUrl(imageUrl);
}