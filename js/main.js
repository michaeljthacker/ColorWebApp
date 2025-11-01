import { mulberry32 } from './utils.js';
import { extractPaletteFromImageBitmap } from './palette.js';
import { styles } from './styles.js';

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { willReadFrequently:true }); // for color sampling perf
const overlay = document.getElementById('overlay');
const toast = document.getElementById('toast');
const paletteEl = document.getElementById('palette');
const fileBtn = document.getElementById('fileBtn');
const shuffleBtn = document.getElementById('shuffleBtn');
const exportBtn = document.getElementById('exportBtn');
const copyBtn   = document.getElementById('copyBtn');
const modeSel   = document.getElementById('mode');
const hamburgerBtn = document.getElementById('hamburgerBtn');
const cameraBtn = document.getElementById('cameraBtn');
const chrome = document.querySelector('.chrome');

let currentPalette = ['#2f2f2f','#6b6b6b','#9a9a9a','#c5c5c5','#efefef'];
let rngSeed = Math.random() * 1e9;

// Mobile scaling and touch gesture variables
let scaleFactor = 1.0;
let lastTouchDistance = 0;
let touchStartY = 0;
let touchStartTime = 0;

// Consistent mobile detection helpers
const isMobile = () => window.innerWidth <= 767;
const isMobileOrTablet = () => window.innerWidth <= 1024;
const isTouchDevice = () => ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

// Performance monitoring state
let slowRenderCount = 0;
let isReducedQualityMode = false;

// Battery-aware optimization state
let isBatterySaverMode = false;
let batteryCheckInterval;

// Performance optimization: debounced resize handler
let resizeTimeout;
function debouncedFit() {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(fit, 100); // 100ms debounce
}

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

// Performance optimization: use ResizeObserver when available, fallback to resize event
if (window.ResizeObserver) {
  const resizeObserver = new ResizeObserver(() => debouncedFit());
  resizeObserver.observe(document.body);
} else {
  window.addEventListener('resize', debouncedFit, { passive: true });
}

// Also listen for orientation changes on mobile
if (isTouchDevice()) {
  window.addEventListener('orientationchange', debouncedFit, { passive: true });
}

fit();

// Battery-aware optimization: monitor battery level on mobile devices
async function initBatteryMonitoring() {
  if (!isTouchDevice()) return; // Only monitor on mobile devices
  
  try {
    if ('getBattery' in navigator) {
      const battery = await navigator.getBattery();
      
      const checkBatteryLevel = () => {
        // Enable battery saver mode when battery is low (< 20%) or charging is false and level < 30%
        const shouldUseBatterySaver = battery.level < 0.2 || (!battery.charging && battery.level < 0.3);
        
        if (shouldUseBatterySaver !== isBatterySaverMode) {
          isBatterySaverMode = shouldUseBatterySaver;
          console.log(`Battery saver mode: ${isBatterySaverMode ? 'ON' : 'OFF'} (Level: ${Math.round(battery.level * 100)}%)`);
        }
      };
      
      // Check immediately and on battery events
      checkBatteryLevel();
      battery.addEventListener('levelchange', checkBatteryLevel);
      battery.addEventListener('chargingchange', checkBatteryLevel);
    }
  } catch (e) {
    console.log('Battery API not available, battery optimization disabled');
  }
}

// Initialize battery monitoring
initBatteryMonitoring();

function showToast(msg, ms=1400){
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), ms);
}

function repaint(){
  // Performance monitoring: track render times
  const startTime = performance.now();
  
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

  // Battery optimization: reduce or skip grain overlay in battery saver mode
  if (isBatterySaverMode) {
    addGrainOverlay(0.03, seeded); // lighter grain in battery saver mode
  } else {
    addGrainOverlay(0.07, seeded); // normal film grain to unify
  }
  drawSignature();
  drawPaletteBar(currentPalette);
  
  // Performance monitoring: track and adapt to slow renders
  const renderTime = performance.now() - startTime;
  if (renderTime > 500) {
    slowRenderCount++;
    console.log(`Slow render detected: ${renderTime.toFixed(1)}ms (${mode} style) - Count: ${slowRenderCount}`);
    
    // Suggest reduced quality after 3 consecutive slow renders or if battery saver is on
    if ((slowRenderCount >= 3 || isBatterySaverMode) && !isReducedQualityMode) {
      const reason = isBatterySaverMode ? 'battery saver mode' : 'slow performance';
      console.warn(`Performance: Reduced quality mode enabled (${reason})`);
      isReducedQualityMode = true;
    }
  } else {
    slowRenderCount = 0; // Reset count on good performance
  }
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
  if (!file || !file.type.startsWith('image/')) {
    showToast('Please select a valid image file');
    return;
  }
  
  // Check file size (limit to 10MB for mobile)
  if (file.size > 10 * 1024 * 1024) {
    showToast('Image too large. Please select a smaller image');
    return;
  }
  
  fileBtn.classList.add('glow');
  fileBtn.textContent = 'Processing...';
  
  // Store current state in case we need to restore it
  const previousPalette = currentPalette ? [...currentPalette] : null;
  
  let tempBitmap = null;
  
  try {
    // Create bitmap with size limits for mobile
    const maxSize = isMobile() ? 1024 : 2048;
    tempBitmap = await createImageBitmap(file, {
      resizeWidth: Math.min(maxSize, file.width || maxSize),
      resizeHeight: Math.min(maxSize, file.height || maxSize),
      resizeQuality: 'medium'
    });
    
    // Extract palette immediately
    const palette = await extractPaletteFromImageBitmap(tempBitmap);
    
    // Free the bitmap memory immediately after palette extraction
    tempBitmap.close();
    tempBitmap = null;
    
    if (!palette || palette.length === 0) {
      throw new Error('Could not extract colors from image');
    }
    
    // Update palette and render
    currentPalette = palette;
    drawPaletteBar(currentPalette);
    repaint();
    showToast('Image processed successfully!');
    
  } catch(error) {
    console.error('Image processing failed:', error);
    
    // Clean up temp bitmap if it exists
    if (tempBitmap) {
      tempBitmap.close();
      tempBitmap = null;
    }
    
    // Restore previous state if we had one
    if (previousPalette) {
      currentPalette = previousPalette;
      drawPaletteBar(currentPalette);
      repaint();
      showToast('Processing failed. Previous palette restored');
    } else {
      showToast('Could not process image');
    }
    
  } finally {
    fileBtn.classList.remove('glow');
    fileBtn.textContent = 'Choose File';
    
    // Force garbage collection hint for mobile browsers
    if (window.gc) {
      setTimeout(() => window.gc(), 100);
    }
  }
}

async function loadImageFromUrl(url){
  fileBtn.classList.add('glow');
  fileBtn.textContent = 'Downloading...';
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Download failed');
    const blob = await res.blob();
    await handleImageFile(blob);
  } catch(e){
    console.error(e);
    showToast('Could not load image from URL.');
    fileBtn.classList.remove('glow');
    fileBtn.textContent = 'Choose File';
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
  if (isMobile() || (window.innerHeight <= 500 && isMobileOrTablet())) {
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
  
  // Try modern Clipboard API first
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => {
      showToast('Palette copied to clipboard.');
    }, (err) => {
      console.error('Clipboard API failed:', err);
      fallbackCopy(text);
    });
  } else {
    // Fallback for older browsers or unsecure contexts
    fallbackCopy(text);
  }
}

function fallbackCopy(text) {
  try {
    // Create temporary textarea element
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    textarea.style.opacity = '0';
    
    document.body.appendChild(textarea);
    textarea.select();
    textarea.setSelectionRange(0, 99999); // For mobile devices
    
    const successful = document.execCommand('copy');
    document.body.removeChild(textarea);
    
    if (successful) {
      showToast('Palette copied to clipboard.');
    } else {
      showToast('Copy failed. Palette: ' + text);
    }
  } catch (err) {
    console.error('Fallback copy failed:', err);
    // Last resort: show the text in the toast so user can manually copy
    showToast('Copy not supported. Palette: ' + text, 4000);
  }
}

// File input functionality - fresh input approach like camera
function openFileInput() {
  // Create a hidden file input specifically for file selection
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = 'image/*';
  fileInput.style.position = 'absolute';
  fileInput.style.left = '-9999px';
  fileInput.style.opacity = '0';
  
  // Cleanup function
  const cleanup = () => {
    if (fileInput.parentNode) {
      fileInput.parentNode.removeChild(fileInput);
    }
    // Force garbage collection hint
    if (window.gc) {
      setTimeout(() => window.gc(), 100);
    }
  };
  
  // Handle the selected file
  fileInput.addEventListener('change', async (e) => {
    try {
      if (e.target.files && e.target.files[0]) {
        await handleImageFile(e.target.files[0]);
      }
    } catch (error) {
      console.error('File processing error:', error);
      showToast('File processing failed');
    } finally {
      cleanup();
    }
  }, { once: true });
  
  // Add cleanup on blur
  fileInput.addEventListener('blur', cleanup, { once: true });
  
  // Safety timeout
  const timeoutId = setTimeout(() => {
    cleanup();
  }, 30000); // 30 second timeout
  
  // Clear timeout if file is selected
  fileInput.addEventListener('change', () => clearTimeout(timeoutId), { once: true });
  
  // Add to DOM and trigger
  document.body.appendChild(fileInput);
  
  // Trigger with a small delay for better reliability
  setTimeout(() => {
    if (fileInput.parentNode) {
      fileInput.click();
    }
  }, 10);
}

// --- Event Listeners ---
fileBtn.addEventListener('click', openFileInput);
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

// Camera functionality - mobile memory optimized
let lastCameraUse = 0;

function openCamera() {
  const now = Date.now();
  const timeSinceLastUse = now - lastCameraUse;
  
  // On mobile, enforce a minimum delay between camera uses to allow memory cleanup
  const isMobileDevice = isMobileOrTablet();
  const minDelay = isMobileDevice ? 2000 : 100; // 2 seconds on mobile, 100ms on desktop
  
  if (timeSinceLastUse < minDelay) {
    const remaining = Math.ceil((minDelay - timeSinceLastUse) / 1000);
    showToast(`Please wait ${remaining} second${remaining > 1 ? 's' : ''} before using camera again`);
    return;
  }
  
  lastCameraUse = now;
  
  // Create a hidden file input specifically for camera capture
  const cameraInput = document.createElement('input');
  cameraInput.type = 'file';
  cameraInput.accept = 'image/*';
  cameraInput.capture = 'environment'; // Use rear camera
  cameraInput.style.position = 'absolute';
  cameraInput.style.left = '-9999px';
  cameraInput.style.opacity = '0';
  
  // Enhanced cleanup function for mobile
  const cleanup = () => {
    if (cameraInput.parentNode) {
      cameraInput.parentNode.removeChild(cameraInput);
    }
    
    // Aggressive memory cleanup on mobile
    if (isMobileDevice) {
      // Clear any potential references
      cameraInput.onchange = null;
      cameraInput.onblur = null;
      
      // Multiple GC hints with delays
      if (window.gc) {
        setTimeout(() => window.gc(), 100);
        setTimeout(() => window.gc(), 500);
        setTimeout(() => window.gc(), 1000);
      }
      
      // Force layout recalculation to help browser cleanup
      document.body.offsetHeight;
    }
  };
  
  // Handle the captured image
  cameraInput.addEventListener('change', async (e) => {
    try {
      if (e.target.files && e.target.files[0]) {
        // On mobile, show processing message immediately
        if (isMobileDevice) {
          showToast('Processing camera image...');
        }
        await handleImageFile(e.target.files[0]);
      }
    } catch (error) {
      console.error('Camera processing error:', error);
      showToast('Camera processing failed - try again in a few seconds');
    } finally {
      // Delayed cleanup on mobile to ensure camera resources are released
      if (isMobileDevice) {
        setTimeout(cleanup, 500);
      } else {
        cleanup();
      }
    }
  }, { once: true });
  
  // Add cleanup on blur with mobile delay
  cameraInput.addEventListener('blur', () => {
    if (isMobileDevice) {
      setTimeout(cleanup, 200);
    } else {
      cleanup();
    }
  }, { once: true });
  
  // Shorter timeout on mobile to prevent resource hogging
  const timeoutDuration = isMobileDevice ? 20000 : 30000;
  const timeoutId = setTimeout(() => {
    showToast(isMobileDevice ? 'Camera timeout - please try again' : 'Camera timeout');
    cleanup();
  }, timeoutDuration);
  
  // Clear timeout if file is selected
  cameraInput.addEventListener('change', () => clearTimeout(timeoutId), { once: true });
  
  // Add to DOM and trigger
  document.body.appendChild(cameraInput);
  
  // Longer delay on mobile for camera initialization
  const triggerDelay = isMobileDevice ? 50 : 10;
  setTimeout(() => {
    if (cameraInput.parentNode) {
      cameraInput.click();
    }
  }, triggerDelay);
}

// Setup camera button if supported
if (cameraBtn) {
  // Show camera button on mobile and tablet devices (touch devices)
  if (isTouchDevice() && isMobileOrTablet()) {
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
  if (e.code === 'KeyO') openFileInput();
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
    if (isTouchDevice() && isMobileOrTablet()) {
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