import { hexToRgb, rgbToHex } from './utils.js';

function paintBackdrop(ctx, canvas){
    const g = ctx.createLinearGradient(0,0,0,canvas.height);
    g.addColorStop(0, '#0d1016');
    g.addColorStop(1, '#0a0c10');
    ctx.fillStyle = g;
    ctx.fillRect(0,0,canvas.width,canvas.height);
}

function paintStripes(ctx, canvas, colors, rand){
    paintBackdrop(ctx, canvas);
    const W = canvas.width, H = canvas.height;
    const bands = 46;
    for (let i=0; i<bands; i++){
      const c = colors[Math.floor(rand()*colors.length)];
      ctx.fillStyle = c;
      ctx.globalAlpha = 0.15 + rand()*0.55;
      const thick = 10 + rand()*120;
      const x = rand()*W, y = rand()*H;
      const len = Math.max(W,H) * (0.7 + rand()*0.8);
      const angle = rand()*Math.PI*2;

      ctx.save();
      ctx.translate(x,y);
      ctx.rotate(angle);
      ctx.fillRect(-len/2, -thick/2, len, thick);
      ctx.restore();
    }
    ctx.globalAlpha = 1;
}

function paintBlobs(ctx, canvas, colors, rand){
    paintBackdrop(ctx, canvas);
    const W = canvas.width, H = canvas.height;
    const count = 220;
    for (let i=0; i<count; i++){
      const c = colors[Math.floor(rand()*colors.length)];
      const [r,g,b] = hexToRgb(c);
      const x = rand()*W, y = rand()*H;
      const radius = 60 + rand()*260;
      const grad = ctx.createRadialGradient(x, y, 0, x, y, radius);
      const a = 0.08 + rand()*0.22;
      grad.addColorStop(0, `rgba(${r},${g},${b},${a*1.2})`);
      grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
      ctx.globalCompositeOperation = (rand() < 0.5) ? 'lighter' : 'source-over';
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI*2); ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';
}

function paintShards(ctx, canvas, colors, rand){
    paintBackdrop(ctx, canvas);
    const W = canvas.width, H = canvas.height;
    const layers = 90;
    for (let i=0; i<layers; i++){
      const c = colors[Math.floor(rand()*colors.length)];
      ctx.fillStyle = c;
      ctx.globalAlpha = 0.18 + rand()*0.5;
      const cx = (rand()*W);
      const cy = (rand()*H);
      const n = 3 + Math.floor(rand()*4); // triangles to hex-ish
      const size = 80 + rand()*420;
      ctx.beginPath();
      for (let j=0; j<n; j++){
        const a = rand()*Math.PI*2;
        const r = size * (.4 + rand());
        const x = cx + Math.cos(a)*r;
        const y = cy + Math.sin(a)*r;
        (j===0) ? ctx.moveTo(x,y) : ctx.lineTo(x,y);
      }
      ctx.closePath();
      ctx.filter = (rand()<0.35) ? 'blur(1px)' : 'none';
      ctx.fill();
    }
    ctx.filter = 'none';
    ctx.globalAlpha = 1;
}

function paintBauhausGrid(ctx, canvas, colors, rand) {
    const W = canvas.width, H = canvas.height;
    const BG_COLOR = '#FFFFFF'; 

    ctx.fillStyle = BG_COLOR;
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 1.0; 

    const GRID_SIZE = 4;
    const CELL_W = W / GRID_SIZE;
    const CELL_H = H / GRID_SIZE;
    
    const filledCells = new Set();
    const MAX_FILL = Math.floor(GRID_SIZE * GRID_SIZE * 0.55); 
    let cellIndex = 0;

    for (let row = 0; row < GRID_SIZE; row++) {
        for (let col = 0; col < GRID_SIZE; col++) {
            
            if (rand() < 0.55 && filledCells.size < MAX_FILL) {
                filledCells.add(cellIndex);
                
                const centerX = col * CELL_W + CELL_W / 2;
                const centerY = row * CELL_H + CELL_H / 2;
                
                const colorIndex = Math.floor(rand() * 2); 
                const accentColorIndex = Math.floor(rand() * (colors.length - 2)) + 2; 

                // --- 1. Draw the Main Block (Large Shape) ---
                const largeColor = rgbToHex(...hexToRgb(colors[colorIndex]));
                ctx.fillStyle = largeColor;
                
                const blockW = CELL_W * (rand() * 0.15 + 0.80); 
                const blockH = CELL_H * (rand() * 0.15 + 0.80);
                
                ctx.fillRect(centerX - blockW / 2, centerY - blockH / 2, blockW, blockH);

                // --- 2. Optional Overlap/Accent Layer ---
                if (rand() < 0.4) { 
                    const accentColor = rgbToHex(...hexToRgb(colors[accentColorIndex]));
                    
                    ctx.fillStyle = accentColor;
                    ctx.globalAlpha = 0.9;
                    
                    if (rand() > 0.5) { 
                        const lineH = CELL_H * 0.05;
                        const lineW = blockW * 0.8;
                        ctx.fillRect(centerX - lineW / 2, centerY - lineH / 2, lineW, lineH);
                    } else {
                        const lineW = CELL_W * 0.05;
                        const lineH = blockH * 0.8;
                        ctx.fillRect(centerX - lineW / 2, centerY - lineH / 2, lineW, lineH);
                    }
                }
                ctx.globalAlpha = 1.0; 
            }
            cellIndex++;
        }
    }
}

function paintDiagonalLines(ctx, canvas, colors, rand) {
    const W = canvas.width, H = canvas.height;
    ctx.fillStyle = '#FFFFFF'; 
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 1.0; 

    const space = 40; 
    let x = -H; 
    
    while (x < W + H) {
        const color = rgbToHex(...hexToRgb(colors[Math.floor(rand() * colors.length)]));
        ctx.fillStyle = color;
        ctx.globalAlpha = rand() * 0.4 + 0.5; 

        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x + space * 1.5, 0); 
        ctx.lineTo(W, H - (x + space * 1.5 - W));
        ctx.lineTo(W, H - (x - W));
        ctx.closePath();
        ctx.fill();

        x += space;
    }
    ctx.globalAlpha = 1.0; 
}

function paintPixelWeave(ctx, canvas, colors, rand) {
    const W = canvas.width, H = canvas.height;
    const RESOLUTION = 48; 
    const CELL_W = W / RESOLUTION;
    const CELL_H = H / RESOLUTION;
    const STRIP_THICKNESS = 4;

    // 1. Fully randomized background (was colors[0])
    const bgColor = colors[Math.floor(rand() * colors.length)];
    ctx.fillStyle = bgColor; 
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 1.0;

    for (let x = 0; x < RESOLUTION; x++) {
        for (let y = 0; y < RESOLUTION; y++) {
            
            const px = x * CELL_W;
            const py = y * CELL_H;
            
            // 2. Draw base square pixel (for underlying color/texture)
            const baseColor = colors[Math.floor(rand() * colors.length)];
            ctx.fillStyle = baseColor;
            ctx.globalAlpha = 0.15 + rand() * 0.15; // Increased randomization here
            ctx.fillRect(px, py, CELL_W, CELL_H);
            
            // 3. Draw a horizontal strip (fully random color)
            const colorH = colors[Math.floor(rand() * colors.length)];
            ctx.fillStyle = colorH;
            ctx.globalAlpha = 0.5 + rand() * 0.4;
            const hOffset = CELL_H * (0.3 + rand() * 0.4) - STRIP_THICKNESS/2;
            ctx.fillRect(px, py + hOffset, CELL_W, STRIP_THICKNESS);
            
            // 4. Draw a vertical strip (fully random color)
            const colorV = colors[Math.floor(rand() * colors.length)];
            ctx.fillStyle = colorV;
            ctx.globalAlpha = 0.5 + rand() * 0.4;
            const vOffset = CELL_W * (0.3 + rand() * 0.4) - STRIP_THICKNESS/2;
            ctx.fillRect(px + vOffset, py, STRIP_THICKNESS, CELL_H);
        }
    }
    ctx.globalAlpha = 1.0;
}

function paintContourLines(ctx, canvas, colors, rand) {
    paintBackdrop(ctx, canvas);
    const W = canvas.width, H = canvas.height;
    const lineCount = 120;
    
    ctx.lineWidth = 1 + rand() * 2;
    ctx.globalAlpha = 0.15;
    
    for (let i = 0; i < lineCount; i++) {
        const c = colors[Math.floor(rand() * colors.length)];
        ctx.strokeStyle = c;
        
        // Random starting points
        const startX = rand() * W;
        const startY = rand() * H;
        
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        
        // Use quadratic curves to create organic wobble
        const segments = 4 + Math.floor(rand() * 4);
        let currentX = startX;
        let currentY = startY;
        
        for (let j = 0; j < segments; j++) {
            const cpX = currentX + (rand() * 0.5 + 0.5) * (rand() < 0.5 ? -1 : 1) * 150;
            const cpY = currentY + (rand() * 0.5 + 0.5) * (rand() < 0.5 ? -1 : 1) * 150;
            
            currentX += (rand() * 0.5 + 0.5) * 200 * (rand() < 0.5 ? -1 : 1);
            currentY += (rand() * 0.5 + 0.5) * 200 * (rand() < 0.5 ? -1 : 1);
            
            ctx.quadraticCurveTo(cpX, cpY, currentX, currentY);
        }
        ctx.stroke();
    }
    ctx.globalAlpha = 1.0;
}

function paintStainedGlass(ctx, canvas, colors, rand) {
    const W = canvas.width, H = canvas.height;
    const GRID_SIZE = 4;
    const DENSITY = 6;
    
    ctx.fillStyle = '#111111'; // Dark background for the lead lines
    ctx.fillRect(0, 0, W, H);
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#222222';
    
    // Generate random points in a slightly organized grid structure
    const points = [];
    const cellW = W / GRID_SIZE;
    const cellH = H / GRID_SIZE;

    for (let r = 0; r <= GRID_SIZE; r++) {
        for (let c = 0; c <= GRID_SIZE; c++) {
            for (let i = 0; i < DENSITY; i++) {
                const x = c * cellW + rand() * cellW;
                const y = r * cellH + rand() * cellH;
                points.push({x, y});
            }
        }
    }

    // Simple, non-Voronoi random tessellation based on points
    const triangles = [];
    while(points.length >= 3) {
        const i1 = Math.floor(rand() * points.length);
        const p1 = points.splice(i1, 1)[0];
        
        const i2 = Math.floor(rand() * points.length);
        const p2 = points.splice(i2, 1)[0];
        
        const i3 = Math.floor(rand() * points.length);
        const p3 = points.splice(i3, 1)[0];

        if(p1 && p2 && p3) triangles.push([p1, p2, p3]);
    }
    
    // Draw the "glass"
    triangles.forEach(poly => {
        const color = colors[Math.floor(rand() * colors.length)];
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.95;
        
        ctx.beginPath();
        ctx.moveTo(poly[0].x, poly[0].y);
        ctx.lineTo(poly[1].x, poly[1].y);
        ctx.lineTo(poly[2].x, poly[2].y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    });
    ctx.globalAlpha = 1.0;
}

function paintWaveCollapse(ctx, canvas, colors, rand) {
    const W = canvas.width, H = canvas.height;
    const bandHeight = 40 + rand() * 100;
    let y = 0;

    while (y < H) {
        const h = bandHeight * (0.8 + rand() * 0.4);
        const color1 = colors[Math.floor(rand() * colors.length)];
        const color2 = colors[Math.floor(rand() * colors.length)];
        
        const grad = ctx.createLinearGradient(0, y, 0, y + h);
        grad.addColorStop(0, color1);
        // Mid-point color bleed/merge
        grad.addColorStop(0.5 + (rand() * 0.2 - 0.1), color1);
        grad.addColorStop(0.5, color2);
        grad.addColorStop(1, color2);
        
        ctx.fillStyle = grad;
        ctx.globalAlpha = 0.8 + rand() * 0.2;
        ctx.fillRect(0, y, W, h);
        
        // Introduce noise/wave effect
        ctx.globalAlpha = 0.05;
        ctx.fillStyle = '#000000';
        for(let i=0; i<W; i+=20) {
            const waveY = Math.sin((i / W * 2 * Math.PI) + (rand() * 10)) * 5 * rand();
            ctx.fillRect(i, y + h/2 + waveY, 5, h);
        }
        
        y += h * (0.5 + rand() * 0.5); // Overlapping
    }
    ctx.globalAlpha = 1.0;
}

function paintHalftoneGrid(ctx, canvas, colors, rand) {
    paintBackdrop(ctx, canvas);
    const W = canvas.width, H = canvas.height;
    const RESOLUTION = 40;
    const step = W / RESOLUTION;

    for (let x = 0; x < W; x += step) {
        for (let y = 0; y < H; y += step) {
            const color = colors[Math.floor(rand() * colors.length)];
            const [r, g, b] = hexToRgb(color);
            
            // Calculate perceived luminance (0-255)
            const L = (0.2126*r + 0.7152*g + 0.0722*b); 
            
            // Map luminance to a radius (Inverse relationship for halftone: bright -> small dot)
            // Radius is between 10% and 90% of the step size.
            const maxR = step * 0.45;
            const radius = maxR * (1 - L / 255); 
            
            ctx.fillStyle = color;
            ctx.globalAlpha = 0.9;
            
            ctx.beginPath();
            ctx.arc(x + step / 2, y + step / 2, radius, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    ctx.globalAlpha = 1.0;
}

function paintRectilinearStack(ctx, canvas, colors, rand) {
    const W = canvas.width, H = canvas.height;
    const count = 100;

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 1.0;

    for (let i = 0; i < count; i++) {
        const color = colors[Math.floor(rand() * colors.length)];
        ctx.fillStyle = color;
        
        // Use less opaque alpha for depth/overlap effect
        ctx.globalAlpha = 0.2 + rand() * 0.6; 

        const x = rand() * W * 1.5 - W * 0.25;
        const y = rand() * H * 1.5 - H * 0.25;
        const w = 50 + rand() * 300;
        const h = 50 + rand() * 300;
        
        ctx.fillRect(x, y, w, h);
        
        // Optional thin black stroke for definition
        if (rand() < 0.2) {
            ctx.strokeStyle = '#000000';
            ctx.globalAlpha = 0.1;
            ctx.strokeRect(x, y, w, h);
        }
    }
    ctx.globalAlpha = 1.0;
}

function paintNeonGlow(ctx, canvas, colors, rand) {
    const W = canvas.width, H = canvas.height;
    
    // Start with a dark/black background
    ctx.fillStyle = '#0a0c10'; 
    ctx.fillRect(0, 0, W, H);
    
    ctx.lineWidth = 4 + rand() * 3;
    ctx.globalCompositeOperation = 'lighter'; // Use 'lighter' for glow/additive effect
    
    const glowCount = 20;

    for (let i = 0; i < glowCount; i++) {
        const c = colors[Math.floor(rand() * (colors.length - 1)) + 1]; // Avoid black/darkest color
        ctx.strokeStyle = c;
        ctx.globalAlpha = 0.8;
        ctx.filter = `blur(${8 + rand() * 12}px)`; // Apply heavy blur for glow
        
        // Simple geometric shapes: lines and circles
        if (rand() < 0.5) { 
            // Line
            ctx.beginPath();
            ctx.moveTo(rand() * W, rand() * H);
            ctx.lineTo(rand() * W, rand() * H);
            ctx.stroke();
        } else { 
            // Circle
            ctx.beginPath();
            ctx.arc(rand() * W, rand() * H, 40 + rand() * 100, 0, Math.PI * 2);
            ctx.stroke();
        }
    }
    
    ctx.filter = 'none'; // Reset filter
    ctx.globalCompositeOperation = 'source-over'; // Reset blend mode
    ctx.globalAlpha = 1.0;
}

function paintFieldTracer(ctx, canvas, colors, rand) {
    paintBackdrop(ctx, canvas);
    const W = canvas.width, H = canvas.height;
    const numLines = 500;
    const step = 20;

    ctx.lineWidth = 0.5;
    ctx.globalAlpha = 0.08;

    for (let i = 0; i < numLines; i++) {
        const color = colors[Math.floor(rand() * colors.length)];
        ctx.strokeStyle = color;

        let x = rand() * W;
        let y = rand() * H;

        ctx.beginPath();
        ctx.moveTo(x, y);

        for (let j = 0; j < 50; j++) {
            // Field direction based on position, creates swirling flow
            const angle = Math.sin(x / 400 * Math.PI) * 2 + Math.cos(y / 300 * Math.PI) * 3 + rand() * 0.5;
            const nextX = x + Math.cos(angle) * step * (0.5 + rand() * 0.5);
            const nextY = y + Math.sin(angle) * step * (0.5 + rand() * 0.5);

            // Stop if particle goes off screen
            if (nextX < 0 || nextX > W || nextY < 0 || nextY > H) break;

            ctx.lineTo(nextX, nextY);
            x = nextX;
            y = nextY;
        }
        ctx.stroke();
    }
    ctx.globalAlpha = 1.0;
}

function paintRecursiveFractalGrowth(ctx, canvas, colors, rand) {
    const W = canvas.width, H = canvas.height;
    ctx.fillStyle = colors[0]; // Darkest color for background
    ctx.fillRect(0, 0, W, H);
    
    const drawBranch = (x, y, length, angle, depth) => {
        // If we run out of colors, just use the last one
        const colorIndex = Math.min(depth, colors.length - 1);
        
        const endX = x + length * Math.cos(angle);
        const endY = y + length * Math.sin(angle);

        const color = colors[colorIndex];
        ctx.strokeStyle = color;
        // Thicker lines for deeper/starting branches
        ctx.lineWidth = (colors.length - colorIndex) * 2; 
        ctx.globalAlpha = 0.5 + colorIndex * 0.1;

        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(endX, endY);
        ctx.stroke();

        if (colorIndex < colors.length - 1) {
            const newLength = length * (0.6 + rand() * 0.2);
            const branchAngle = Math.PI/4 * (0.5 + rand() * 0.5); // Randomize angle spread

            // Draw left branch
            drawBranch(endX, endY, newLength, angle - branchAngle, depth + 1);
            // Draw right branch
            drawBranch(endX, endY, newLength, angle + branchAngle, depth + 1);
        }
    }
    
    // Start the fractal from the bottom center
    const startLength = H * 0.3;
    drawBranch(W/2, H, startLength, -Math.PI/2, 1);
    
    ctx.globalAlpha = 1.0;
}

function paintWovenTessellation(ctx, canvas, colors, rand) {
    const W = canvas.width, H = canvas.height;
    const step = 80 + rand() * 40;
    const stripWidth = 20 + rand() * 15;
    
    ctx.fillStyle = colors[0]; // Background
    ctx.fillRect(0, 0, W, H);

    const colorH = colors[1];
    const colorV = colors[2] || colors[4]; // Use an alternate color if only 2 exist

    // Function to draw a continuous strip
    const drawStrip = (x, y, horizontal, color) => {
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.9;
        if (horizontal) {
            ctx.fillRect(0, y - stripWidth / 2, W, stripWidth);
        } else {
            ctx.fillRect(x - stripWidth / 2, 0, stripWidth, H);
        }
    }

    // 1. Draw all horizontal strips (The "under" layer)
    for (let y = step / 2; y < H + step; y += step) {
        drawStrip(0, y, true, colorH);
    }

    // 2. Draw all vertical strips (The "over" layer initially)
    for (let x = step / 2; x < W + step; x += step) {
        drawStrip(x, 0, false, colorV);
    }

    // 3. Create the 'over-under' illusion at intersections using destination-out
    ctx.globalCompositeOperation = 'destination-out';
    ctx.globalAlpha = 1.0; 

    // Erase a section of the vertical strip where it should pass "under"
    for (let x = step / 2; x < W + step; x += step) {
        for (let y = step / 2; y < H + step; y += step) {
            // Alternate which strip is on top to create the weave pattern
            if ((Math.floor(x / step) + Math.floor(y / step)) % 2 === 0) {
                // Erase the vertical strip section
                ctx.fillRect(x - stripWidth / 2, y - stripWidth / 2, stripWidth, stripWidth);
            }
        }
    }
    
    ctx.globalCompositeOperation = 'source-over';
    
    // 4. Draw the "under" color back into the erased parts to complete the weave
    ctx.globalCompositeOperation = 'destination-over';
    for (let x = step / 2; x < W + step; x += step) {
        for (let y = step / 2; y < H + step; y += step) {
            if ((Math.floor(x / step) + Math.floor(y / step)) % 2 === 0) {
                // Fill the gap with the horizontal strip color (which should be "under")
                ctx.fillStyle = colorH; 
                ctx.fillRect(x - stripWidth / 2, y - stripWidth / 2, stripWidth, stripWidth);
            }
        }
    }

    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1.0;
}

export const styles = {
    stripes: paintStripes,
    blobs: paintBlobs,
    shards: paintShards,
    bauhaus: paintBauhausGrid,
    diagonal: paintDiagonalLines,
    pixel: paintPixelWeave,
    contour: paintContourLines,
    glass: paintStainedGlass,
    wave: paintWaveCollapse,
    halftone: paintHalftoneGrid,
    rectilinear: paintRectilinearStack,
    neon: paintNeonGlow,
    tracer: paintFieldTracer,
    fractal: paintRecursiveFractalGrowth,
    woven: paintWovenTessellation,
    backdrop: paintBackdrop
};