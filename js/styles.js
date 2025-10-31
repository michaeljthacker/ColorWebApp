import { hexToRgb, rgbToHex } from './utils.js';

function paintBackdrop(ctx, canvas){
    const g = ctx.createLinearGradient(0,0,0,canvas.height);
    g.addColorStop(0, '#0d1016');
    g.addColorStop(1, '#0a0c10');
    ctx.fillStyle = g;
    ctx.fillRect(0,0,canvas.width,canvas.height);
}

function paintStripes(ctx, canvas, colors, rand){
    ctx.fillStyle = colors[Math.floor(rand() * colors.length)];
    ctx.fillRect(0, 0, canvas.width, canvas.height);
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
    ctx.fillStyle = colors[Math.floor(rand() * colors.length)];
    ctx.fillRect(0, 0, canvas.width, canvas.height);
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
    ctx.fillStyle = colors[Math.floor(rand() * colors.length)];
    ctx.fillRect(0, 0, canvas.width, canvas.height);
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
    
    // Start with white background (classic Bauhaus)
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, W, H);
    
    // Create a limited palette by randomly selecting 2-3 colors from the full palette
    const numColors = Math.min(2 + Math.floor(rand() * 2), colors.length); // 2-3 colors max
    const limitedColors = [];
    const availableColors = [...colors]; // Copy array to avoid modifying original
    
    for (let i = 0; i < numColors; i++) {
        const randomIndex = Math.floor(rand() * availableColors.length);
        limitedColors.push(availableColors[randomIndex]);
        availableColors.splice(randomIndex, 1); // Remove selected color to avoid duplicates
    }
    
    // Generate asymmetric divisions (Mondrian-style)
    let rectangles = [{x: 0, y: 0, w: W, h: H}];
    
    // Create 4-7 divisions for interesting composition
    const numDivisions = 4 + Math.floor(rand() * 4);
    
    for (let i = 0; i < numDivisions; i++) {
        const newRects = [];
        
        for (let rect of rectangles) {
            // Only split rectangles that are large enough
            const minSize = Math.min(W, H) * 0.15;
            
            if (rect.w > minSize * 2 || rect.h > minSize * 2) {
                const shouldSplit = rand() < 0.6; // 60% chance to split
                
                if (shouldSplit) {
                    if (rect.w > rect.h && rect.w > minSize * 2) {
                        // Split vertically
                        const splitRatio = 0.3 + rand() * 0.4; // Split between 30-70%
                        const splitX = rect.x + rect.w * splitRatio;
                        
                        newRects.push({x: rect.x, y: rect.y, w: rect.w * splitRatio, h: rect.h});
                        newRects.push({x: splitX, y: rect.y, w: rect.w * (1 - splitRatio), h: rect.h});
                    } else if (rect.h > minSize * 2) {
                        // Split horizontally  
                        const splitRatio = 0.3 + rand() * 0.4;
                        const splitY = rect.y + rect.h * splitRatio;
                        
                        newRects.push({x: rect.x, y: rect.y, w: rect.w, h: rect.h * splitRatio});
                        newRects.push({x: rect.x, y: splitY, w: rect.w, h: rect.h * (1 - splitRatio)});
                    } else {
                        newRects.push(rect);
                    }
                } else {
                    newRects.push(rect);
                }
            } else {
                newRects.push(rect);
            }
        }
        
        rectangles = newRects;
    }
    
    // Fill some rectangles with colors (authentic Bauhaus: mostly white with selective color)
    let coloredRectangles = 0;
    const targetColoredRects = Math.max(1, Math.floor(rectangles.length * 0.25)); // At least 1, ideally 25%
    
    rectangles.forEach((rect, index) => {
        const fillChance = rand();
        const shouldColor = fillChance < 0.25 || 
                           (coloredRectangles === 0 && index === rectangles.length - 1); // Ensure at least one
        
        if (shouldColor && coloredRectangles < targetColoredRects + 1) {
            const color = limitedColors[Math.floor(rand() * limitedColors.length)];
            ctx.fillStyle = color;
            ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
            coloredRectangles++;
        }
        // Rest stay white (authentic Bauhaus proportions)
    });
    
    // Draw the characteristic thick black lines
    ctx.strokeStyle = '#000000';
    const lineThickness = Math.max(3, Math.min(W, H) * 0.008); // Responsive thickness
    ctx.lineWidth = lineThickness;
    
    // Draw all the rectangle borders with thick black lines
    rectangles.forEach(rect => {
        ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
    });
    
    // Add some additional structural lines for more authentic Bauhaus look
    const numExtraLines = 1 + Math.floor(rand() * 3); // 1-3 extra lines
    
    for (let i = 0; i < numExtraLines; i++) {
        ctx.beginPath();
        
        if (rand() < 0.5) {
            // Vertical line
            const x = W * (0.2 + rand() * 0.6); // Avoid edges
            ctx.moveTo(x, 0);
            ctx.lineTo(x, H);
        } else {
            // Horizontal line  
            const y = H * (0.2 + rand() * 0.6); // Avoid edges
            ctx.moveTo(0, y);
            ctx.lineTo(W, y);
        }
        
        ctx.stroke();
    }
    
    // Optional: Add a single accent element (very small colored square/rectangle)
    if (rand() < 0.3) { // 30% chance
        const accentSize = Math.min(W, H) * (0.05 + rand() * 0.1);
        const accentX = rand() * (W - accentSize);
        const accentY = rand() * (H - accentSize);
        const accentColor = limitedColors[Math.floor(rand() * limitedColors.length)];
        
        ctx.fillStyle = accentColor;
        ctx.fillRect(accentX, accentY, accentSize, accentSize);
        
        // Border around accent
        ctx.strokeRect(accentX, accentY, accentSize, accentSize);
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
            
            // 3. & 4. Draw interlaced horizontal and vertical strips with proper weave order
            const colorH = colors[Math.floor(rand() * colors.length)];
            const colorV = colors[Math.floor(rand() * colors.length)];
            const hOffset = CELL_H * (0.4 + rand() * 0.2) - STRIP_THICKNESS/2; // More centered
            const vOffset = CELL_W * (0.4 + rand() * 0.2) - STRIP_THICKNESS/2; // More centered
            
            // Determine weave pattern (checkerboard alternation)
            const isOverWeave = (x + y) % 2 === 0;
            
            if (isOverWeave) {
                // Horizontal strip goes under (drawn first)
                ctx.fillStyle = colorH;
                ctx.globalAlpha = 0.5 + rand() * 0.4;
                ctx.fillRect(px, py + hOffset, CELL_W, STRIP_THICKNESS);
                
                // Vertical strip goes over (drawn second)
                ctx.fillStyle = colorV;
                ctx.globalAlpha = 0.5 + rand() * 0.4;
                ctx.fillRect(px + vOffset, py, STRIP_THICKNESS, CELL_H);
            } else {
                // Vertical strip goes under (drawn first)
                ctx.fillStyle = colorV;
                ctx.globalAlpha = 0.5 + rand() * 0.4;
                ctx.fillRect(px + vOffset, py, STRIP_THICKNESS, CELL_H);
                
                // Horizontal strip goes over (drawn second)
                ctx.fillStyle = colorH;
                ctx.globalAlpha = 0.5 + rand() * 0.4;
                ctx.fillRect(px, py + hOffset, CELL_W, STRIP_THICKNESS);
            }
        }
    }
    ctx.globalAlpha = 1.0;
}

function paintContourLines(ctx, canvas, colors, rand) {
    const W = canvas.width, H = canvas.height;
    
    // Random background from palette
    ctx.fillStyle = colors[Math.floor(rand() * colors.length)];
    ctx.fillRect(0, 0, W, H);
    
    // Always create at least 2 sunburst centers, ensure they're well-positioned
    const numCenters = 2 + Math.floor(rand() * 2); // 2-3 centers
    
    for (let center = 0; center < numCenters; center++) {
        // Ensure centers are positioned to create visible effects
        const margin = 100; // Keep centers away from edges
        const centerX = margin + rand() * (W - 2 * margin);
        const centerY = margin + rand() * (H - 2 * margin);
        const maxRadius = 150 + rand() * 200; // Larger radius for better visibility
        const numRings = 6 + Math.floor(rand() * 6); // 6-11 concentric rings
        
        // Draw concentric rings around this center
        for (let ring = 1; ring <= numRings; ring++) {
            const radius = (ring / numRings) * maxRadius;
            const c = colors[Math.floor(rand() * colors.length)];
            
            ctx.strokeStyle = c;
            ctx.lineWidth = 1.2 + rand() * 1.3; // Slightly thicker
            ctx.globalAlpha = 0.7 + rand() * 0.3; // Higher minimum alpha for visibility
            
            // Create organic, irregular ring shape
            ctx.beginPath();
            const points = 12 + Math.floor(rand() * 8); // 12-20 points for smooth curves
            
            for (let p = 0; p <= points; p++) {
                const angle = (p / points) * Math.PI * 2;
                
                // Add natural irregularity to radius
                const radiusVariation = 0.6 + rand() * 0.8; // 60-140% of base radius
                const actualRadius = radius * radiusVariation;
                
                // Add small-scale organic noise
                const noise = (rand() - 0.5) * 15;
                
                const x = centerX + Math.cos(angle) * actualRadius + noise;
                const y = centerY + Math.sin(angle) * actualRadius + noise;
                
                if (p === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            
            ctx.stroke();
        }
        
        // Add radiating lines from center (sunburst effect) - always create rays
        const numRays = 12 + Math.floor(rand() * 16); // 12-27 rays for better visibility
        
        for (let ray = 0; ray < numRays; ray++) {
            const angle = (ray / numRays) * Math.PI * 2 + rand() * 0.2; // Slight angle variation
            const rayLength = maxRadius * (0.8 + rand() * 0.4); // 80-120% of max radius
            const c = colors[Math.floor(rand() * colors.length)];
            
            ctx.strokeStyle = c;
            ctx.lineWidth = 1 + rand() * 1.5; // Slightly thicker lines
            ctx.globalAlpha = 0.5 + rand() * 0.4; // Higher minimum alpha
            
            // Draw ray with slight curve for organic feel
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            
            const midX = centerX + Math.cos(angle) * rayLength * 0.5;
            const midY = centerY + Math.sin(angle) * rayLength * 0.5;
            const endX = centerX + Math.cos(angle) * rayLength;
            const endY = centerY + Math.sin(angle) * rayLength;
            
            // Add slight curve to rays
            const curveX = midX + (rand() - 0.5) * 25;
            const curveY = midY + (rand() - 0.5) * 25;
            
            ctx.quadraticCurveTo(curveX, curveY, endX, endY);
            ctx.stroke();
        }
    }
    
    ctx.globalAlpha = 1.0;
}

function paintStainedGlass(ctx, canvas, colors, rand) {
    const W = canvas.width, H = canvas.height;
    
    // Light background (light shining through glass)
    ctx.fillStyle = '#f8f8f0';
    ctx.fillRect(0, 0, W, H);
    
    // Create organic glass pieces using irregular shapes - make them larger and more overlapping
    const numPieces = 20 + Math.floor(rand() * 25); // 20-45 glass pieces
    const pieces = [];
    
    // Generate organic glass piece shapes
    for (let i = 0; i < numPieces; i++) {
        const centerX = -50 + rand() * (W + 100); // Allow pieces to extend beyond edges
        const centerY = -50 + rand() * (H + 100);
        const baseSize = 90 + rand() * 160; // Larger pieces to reduce gaps
        const numPoints = 5 + Math.floor(rand() * 6); // 5-10 points per piece
        
        const points = [];
        for (let p = 0; p < numPoints; p++) {
            const angle = (p / numPoints) * Math.PI * 2 + rand() * 0.3; // Less angle variation for smoother shapes
            const radius = baseSize * (0.6 + rand() * 0.5); // More consistent radius
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;
            points.push({x, y});
        }
        
        pieces.push({
            points: points,
            color: colors[Math.floor(rand() * colors.length)],
            centerX: centerX,
            centerY: centerY
        });
    }
    
    // Draw each glass piece with luminous effect
    pieces.forEach(piece => {
        const [r, g, b] = hexToRgb(piece.color);
        
        // Main glass piece - solid color
        ctx.fillStyle = piece.color;
        ctx.globalAlpha = 0.9 + rand() * 0.1; // More opaque for better coverage
        
        ctx.beginPath();
        ctx.moveTo(piece.points[0].x, piece.points[0].y);
        for (let i = 1; i < piece.points.length; i++) {
            ctx.lineTo(piece.points[i].x, piece.points[i].y);
        }
        ctx.closePath();
        ctx.fill();
        
        // Add luminous highlight (lighter version of color)
        const highlightAlpha = 0.4 + rand() * 0.4;
        ctx.fillStyle = `rgba(${Math.min(255, r + 50)}, ${Math.min(255, g + 50)}, ${Math.min(255, b + 50)}, ${highlightAlpha})`;
        
        // Create smaller highlight shape within the piece
        ctx.beginPath();
        const highlightSize = 0.5 + rand() * 0.3; // 50-80% of original size
        const offsetX = (rand() - 0.5) * 15;
        const offsetY = (rand() - 0.5) * 15;
        
        for (let i = 0; i < piece.points.length; i++) {
            const dx = piece.points[i].x - piece.centerX;
            const dy = piece.points[i].y - piece.centerY;
            const highlightX = piece.centerX + dx * highlightSize + offsetX;
            const highlightY = piece.centerY + dy * highlightSize + offsetY;
            
            if (i === 0) {
                ctx.moveTo(highlightX, highlightY);
            } else {
                ctx.lineTo(highlightX, highlightY);
            }
        }
        ctx.closePath();
        ctx.fill();
    });
    
    // Draw thick lead came (lead lines) on top
    ctx.globalAlpha = 1.0;
    ctx.lineWidth = 5 + rand() * 3; // Thicker lead lines (5-8px)
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    pieces.forEach(piece => {
        // Use darkest color from palette for lead lines
        const leadColor = colors.reduce((darkest, color) => {
            const [r1, g1, b1] = hexToRgb(darkest);
            const [r2, g2, b2] = hexToRgb(color);
            const brightness1 = r1 + g1 + b1;
            const brightness2 = r2 + g2 + b2;
            return brightness2 < brightness1 ? color : darkest;
        });
        
        // Create very dark version of the darkest palette color
        const [r, g, b] = hexToRgb(leadColor);
        ctx.strokeStyle = `rgb(${Math.floor(r * 0.15)}, ${Math.floor(g * 0.15)}, ${Math.floor(b * 0.15)})`;
        
        ctx.beginPath();
        ctx.moveTo(piece.points[0].x, piece.points[0].y);
        for (let i = 1; i < piece.points.length; i++) {
            ctx.lineTo(piece.points[i].x, piece.points[i].y);
        }
        ctx.closePath();
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
        
        // Create organic flowing band edges instead of straight rectangles
        ctx.beginPath();
        ctx.moveTo(0, y);
        
        // Top edge with gentle waves
        for (let x = 0; x <= W; x += 20) {
            const waveOffset = Math.sin((x / W) * Math.PI * 2 + rand() * 3) * (5 + rand() * 10);
            ctx.lineTo(x, y + waveOffset);
        }
        
        // Right edge
        ctx.lineTo(W, y + h);
        
        // Bottom edge with gentle waves
        for (let x = W; x >= 0; x -= 20) {
            const waveOffset = Math.sin((x / W) * Math.PI * 2 + rand() * 3) * (5 + rand() * 10);
            ctx.lineTo(x, y + h + waveOffset);
        }
        
        // Left edge
        ctx.lineTo(0, y);
        ctx.closePath();
        ctx.fill();
        
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
    ctx.fillStyle = colors[Math.floor(rand() * colors.length)];
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const W = canvas.width, H = canvas.height;
    const RESOLUTION = 40;
    const step = W / RESOLUTION;

    // Create spatial dot size patterns using multiple overlapping waves
    const getDotSize = (x, y) => {
        let density = 0;
        
        // Multiple wave patterns create organic dot size variation
        density += Math.sin((x / W) * Math.PI * 3 + rand() * 6.28) * 0.3;
        density += Math.sin((y / H) * Math.PI * 2.5 + rand() * 6.28) * 0.3;
        density += Math.sin(((x + y) / (W + H)) * Math.PI * 4 + rand() * 6.28) * 0.2;
        density += Math.sin(((x - y) / W) * Math.PI * 2 + rand() * 6.28) * 0.15;
        
        // Add some random noise for organic variation
        density += (rand() - 0.5) * 0.3;
        
        // Normalize to 0-1 range, then map to dot size
        density = (density + 1) / 2; // Convert from -1,1 to 0,1
        density = Math.max(0.1, Math.min(0.9, density)); // Clamp to reasonable range
        
        return density;
    };

    for (let x = 0; x < W; x += step) {
        for (let y = 0; y < H; y += step) {
            const color = colors[Math.floor(rand() * colors.length)];
            
            // Get spatial dot size (0.1 to 0.9)
            const dotDensity = getDotSize(x, y);
            const maxR = step * 0.45;
            const radius = maxR * dotDensity;
            
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

    ctx.fillStyle = '#f8f8f6'; // Light architectural background
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 1.0;

    // Create 5-8 "building" clusters for better coverage
    const numClusters = 5 + Math.floor(rand() * 4);
    
    for (let cluster = 0; cluster < numClusters; cluster++) {
        // Each cluster has a base position and grows upward/outward
        const baseX = rand() * W * 1.2 - W * 0.1; // Allow clusters to extend beyond edges
        const baseY = rand() * H * 1.2 - H * 0.1;
        const clusterColor = colors[Math.floor(rand() * colors.length)];
        
        // Create 12-20 rectangles per cluster for denser architecture
        const rectsInCluster = 12 + Math.floor(rand() * 9);
        
        for (let i = 0; i < rectsInCluster; i++) {
            const color = (rand() < 0.7) ? clusterColor : colors[Math.floor(rand() * colors.length)];
            ctx.fillStyle = color;
            ctx.globalAlpha = 0.6 + rand() * 0.4; // More opaque for architectural solidity
            
            // Position rectangles to create building-like stacks with larger spread
            const spreadX = (rand() - 0.5) * 300; // Larger horizontal spread
            const spreadY = (rand() - 0.5) * 300; // Larger vertical spread
            const x = baseX + spreadX;
            const y = baseY + spreadY;
            
            // Rectangle sizes favor architectural proportions - make them bigger
            const w = 60 + rand() * 200; // 60-260px width (larger)
            const h = 45 + rand() * 150; // 45-195px height (larger)
            
            ctx.fillRect(x, y, w, h);
            
            // Add architectural details - more frequent outlines
            if (rand() < 0.4) { // 40% chance of outline
                ctx.strokeStyle = '#333333';
                ctx.lineWidth = 1 + rand() * 2;
                ctx.globalAlpha = 0.3 + rand() * 0.4;
                ctx.strokeRect(x, y, w, h);
            }
            
            // Occasionally add "window" details
            if (rand() < 0.15 && w > 60 && h > 50) {
                const windowColor = colors[Math.floor(rand() * colors.length)];
                ctx.fillStyle = windowColor;
                ctx.globalAlpha = 0.8;
                
                // Small window rectangle inside
                const windowW = w * 0.3 + rand() * w * 0.3;
                const windowH = h * 0.2 + rand() * h * 0.3;
                const windowX = x + (w - windowW) * rand();
                const windowY = y + (h - windowH) * rand();
                
                ctx.fillRect(windowX, windowY, windowW, windowH);
            }
        }
    }
    
    // Add more connecting "bridge" elements and background structures
    for (let bridge = 0; bridge < 3 + Math.floor(rand() * 6); bridge++) {
        const color = colors[Math.floor(rand() * colors.length)];
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.4 + rand() * 0.3;
        
        const x = rand() * W * 1.1 - W * 0.05;
        const y = rand() * H * 1.1 - H * 0.05;
        const w = 100 + rand() * 250; // Longer bridge elements
        const h = 25 + rand() * 60;   // Thicker bridge elements
        
        ctx.fillRect(x, y, w, h);
        
        // Bridge outlines
        ctx.strokeStyle = '#444444';
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.5;
        ctx.strokeRect(x, y, w, h);
    }
    
    // Add background architectural elements to fill empty space
    const backgroundElements = 15 + Math.floor(rand() * 20);
    for (let bg = 0; bg < backgroundElements; bg++) {
        const color = colors[Math.floor(rand() * colors.length)];
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.2 + rand() * 0.3; // More subtle background elements
        
        const x = rand() * W * 1.3 - W * 0.15;
        const y = rand() * H * 1.3 - H * 0.15;
        const w = 30 + rand() * 120;
        const h = 30 + rand() * 120;
        
        ctx.fillRect(x, y, w, h);
        
        // Subtle background outlines
        if (rand() < 0.3) {
            ctx.strokeStyle = '#666666';
            ctx.lineWidth = 0.5;
            ctx.globalAlpha = 0.2;
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