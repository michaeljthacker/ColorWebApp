# ColorWebApp

A fully responsive generative art web application that creates beautiful color-themed designs using extracted color palettes.

## Features

### 🎨 **15 Art Styles**
- **Stripes, Blobs, Shards** - Organic and geometric patterns
- **Bauhaus, Diagonal, Pixel** - Structured and grid-based designs  
- **Contour, Glass, Wave** - Fluid and natural forms
- **Halftone, Rectilinear, Neon** - Technical and modern aesthetics
- **Tracer, Fractal, Woven** - Complex algorithmic patterns

### 📱 **Mobile-First Design**
- **Fully responsive** across mobile, tablet, and desktop
- **Touch gestures**: pinch-to-zoom, swipe navigation, tap-to-shuffle
- **Mobile camera integration** for instant palette extraction
- **Landscape mode optimization** with horizontal layouts
- **Performance optimizations** including battery-aware rendering

### 🎯 **Core Functionality**
- **Palette extraction** from uploaded images using advanced color analysis
- **One-click shuffle** to generate endless variations with the same palette
- **Export designs** as high-quality PNG images
- **Copy palettes** to clipboard in multiple formats
- **Real-time rendering** with film grain effects and custom signatures

### ⚡ **Performance Features**
- **Smart resize handling** with ResizeObserver and debouncing
- **Memory optimization** for mobile devices
- **Battery-aware mode** that reduces visual effects when battery is low
- **Render time monitoring** with automatic quality adaptation

## Getting Started

### Quick Start
1. Clone this repository
2. Serve the files using any HTTP server (required for camera features):
   ```bash
   npx http-server -a 0.0.0.0 -p 8080
   ```
3. Open `http://localhost:8080` in your browser

### Usage
1. **Upload an image** or **use your camera** to extract a color palette
2. **Select an art style** from the dropdown menu
3. **Tap/click Shuffle** to generate variations
4. **Use touch gestures** to zoom and explore (mobile)
5. **Export or copy** your favorite designs

## Technical Architecture

- **Frontend**: Vanilla HTML5, CSS3, JavaScript ES6 modules
- **Canvas API**: Hardware-accelerated rendering with virtual canvas scaling
- **Responsive Design**: CSS Grid/Flexbox with breakpoint system
- **Color Processing**: Advanced palette extraction algorithms
- **Touch Support**: Multi-touch gesture handling for mobile devices
- **Progressive Enhancement**: Graceful fallbacks for older browsers

## Browser Support

- **Modern browsers**: Chrome 60+, Firefox 60+, Safari 12+, Edge 79+
- **Mobile**: iOS Safari, Android Chrome with full touch gesture support
- **Fallbacks**: Basic functionality on older browsers without advanced features

## Development

This is a modular JavaScript application with clean separation of concerns:
- `index.html` - Main application structure
- `css/style.css` - Responsive styling with mobile-first approach
- `js/main.js` - Core application logic and event handling
- `js/styles.js` - Generative art algorithms and rendering functions
- `js/palette.js` - Advanced color extraction and analysis
- `js/utils.js` - Utility functions and helpers

## Project Status

This is a complete, feature-rich generative art application. The project has reached its intended scope and functionality. The codebase is well-documented and modular for educational purposes and personal use.

## License

This project is open source and available under the [MIT License](LICENSE).