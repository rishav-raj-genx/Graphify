import { useState, useCallback, useRef, useEffect } from 'react';

export type Theme = 'green' | 'halloween' | 'winter' | 'custom';

export interface ProcessorOptions {
  resolution: number;
  invertColors: boolean;
  isDarkMode: boolean;
  contrast: number;
  theme: Theme;
  customColor?: string;
}

function hexToRgb(hex: string) {
  const c = hex.replace('#', '');
  return {
    r: parseInt(c.substring(0, 2), 16) || 0,
    g: parseInt(c.substring(2, 4), 16) || 0,
    b: parseInt(c.substring(4, 6), 16) || 0
  };
}

function rgbToHex(r: number, g: number, b: number) {
  return '#' + [r, g, b].map(x => {
    const hex = Math.round(x).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

function interpolateColor(color1: string, color2: string, factor: number) {
  const c1 = hexToRgb(color1);
  const c2 = hexToRgb(color2);
  return rgbToHex(
    c1.r + factor * (c2.r - c1.r),
    c1.g + factor * (c2.g - c1.g),
    c1.b + factor * (c2.b - c1.b)
  );
}

function generateCustomPalette(baseColor: string, isDarkMode: boolean) {
  const empty = isDarkMode ? '#161b22' : '#ebedf0';
  return [
    empty,
    interpolateColor(empty, baseColor, 0.4),
    interpolateColor(empty, baseColor, 0.6),
    interpolateColor(empty, baseColor, 0.8),
    baseColor,
  ];
}

const THEMES = {
  green: {
    light: ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39'],
    dark: ['#161b22', '#0e4429', '#006d32', '#26a641', '#39d353'],
  },
  halloween: {
    light: ['#ebedf0', '#ffee4a', '#ffc501', '#fe9600', '#03001c'],
    dark: ['#161b22', '#631c03', '#bd561d', '#fa7a18', '#fddf68'],
  },
  winter: {
    light: ['#ebedf0', '#79b8ff', '#2188ff', '#005cc5', '#00448b'],
    dark: ['#161b22', '#0a3069', '#0969da', '#54aeff', '#b6e3ff'],
  },
};

export function useGitHubGraphProcessor(options: ProcessorOptions) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gridData, setGridData] = useState<number[][]>([]);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  const getColors = useCallback(() => {
    if (options.theme === 'custom' && options.customColor) {
      return generateCustomPalette(options.customColor, options.isDarkMode);
    }
    const themeKey = options.theme === 'custom' ? 'green' : options.theme;
    return THEMES[themeKey][options.isDarkMode ? 'dark' : 'light'];
  }, [options.theme, options.customColor, options.isDarkMode]);

  const processImage = useCallback(
    (src: string) => {
      setIsProcessing(true);
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => {
        const { resolution, invertColors, contrast } = options;
        
        // Target max size to maintain performance while allowing high res blocks
        const MAX_SIZE = 800;
        let scale = 1;
        if (img.width > MAX_SIZE || img.height > MAX_SIZE) {
          scale = Math.min(MAX_SIZE / img.width, MAX_SIZE / img.height);
        }
        
        const targetWidth = Math.floor(img.width * scale);
        const targetHeight = Math.floor(img.height * scale);

        const offscreenCanvas = document.createElement('canvas');
        offscreenCanvas.width = targetWidth;
        offscreenCanvas.height = targetHeight;
        const ctx = offscreenCanvas.getContext('2d', { willReadFrequently: true });
        
        if (!ctx) return;
        
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
        
        const cols = resolution;
        const blockSize = targetWidth / cols;
        const rows = Math.floor(targetHeight / blockSize);
        
        setDimensions({ width: cols, height: rows });
        
        const newGridData: number[][] = [];
        
        for (let y = 0; y < rows; y++) {
          const row: number[] = [];
          for (let x = 0; x < cols; x++) {
            const startX = Math.floor(x * blockSize);
            const startY = Math.floor(y * blockSize);
            const sizeX = Math.floor(blockSize) || 1;
            const sizeY = Math.floor(blockSize) || 1;
            
            const imageData = ctx.getImageData(startX, startY, sizeX, sizeY);
            const data = imageData.data;
            
            let totalLuminance = 0;
            let pixelCount = 0;
            
            for (let i = 0; i < data.length; i += 4) {
              const r = data[i];
              const g = data[i + 1];
              const b = data[i + 2];
              const a = data[i + 3] / 255;
              
              if (a > 0.1) { // ignore fully transparent pixels
                // Calculate luminance
                const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
                totalLuminance += luminance;
                pixelCount++;
              }
            }
            
            let avgLuminance = pixelCount === 0 ? 255 : totalLuminance / pixelCount;
            
            // Apply contrast
            const contrastFactor = (259 * (contrast + 255)) / (255 * (259 - contrast));
            avgLuminance = contrastFactor * (avgLuminance - 128) + 128;
            avgLuminance = Math.max(0, Math.min(255, avgLuminance));
            
            // Map to 0-4 scale
            let level = 0;
            // We want 5 levels: 0, 1, 2, 3, 4
            // Default mapping: darker pixels -> higher level (more green)
            const normalized = avgLuminance / 255; // 0 (dark) to 1 (light)
            
            if (invertColors) {
              if (normalized > 0.8) level = 4;
              else if (normalized > 0.6) level = 3;
              else if (normalized > 0.4) level = 2;
              else if (normalized > 0.2) level = 1;
              else level = 0;
            } else {
              if (normalized < 0.2) level = 4;
              else if (normalized < 0.4) level = 3;
              else if (normalized < 0.6) level = 2;
              else if (normalized < 0.8) level = 1;
              else level = 0;
            }
            
            row.push(level);
          }
          newGridData.push(row);
        }
        
        setGridData(newGridData);
        setIsProcessing(false);
      };
      img.src = src;
    },
    [options]
  );

  // Redraw canvas whenever grid data or options change
  useEffect(() => {
    if (!canvasRef.current || gridData.length === 0) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const colors = getColors();
    
    // GitHub graph styling
    const GAP = 3;
    const BLOCK_SIZE = 12;
    const RADIUS = 2;
    
    canvas.width = dimensions.width * (BLOCK_SIZE + GAP) - GAP;
    canvas.height = dimensions.height * (BLOCK_SIZE + GAP) - GAP;
    
    // Background clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    gridData.forEach((row, y) => {
      row.forEach((level, x) => {
        const xPos = x * (BLOCK_SIZE + GAP);
        const yPos = y * (BLOCK_SIZE + GAP);
        
        ctx.fillStyle = colors[level];
        ctx.beginPath();
        ctx.roundRect(xPos, yPos, BLOCK_SIZE, BLOCK_SIZE, RADIUS);
        ctx.fill();
      });
    });
    
  }, [gridData, options, dimensions]);

  const handleImageUpload = (fileOrDataUrl: File | string) => {
    if (typeof fileOrDataUrl === 'string') {
      setImageSrc(fileOrDataUrl);
      processImage(fileOrDataUrl);
      return;
    }
    if (!fileOrDataUrl.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      if (typeof e.target?.result === 'string') {
        setImageSrc(e.target.result);
        processImage(e.target.result);
      }
    };
    reader.readAsDataURL(fileOrDataUrl);
  };

  // Re-process when options change but we have an image
  useEffect(() => {
    if (imageSrc && !isProcessing) {
      processImage(imageSrc);
    }
    // We intentionally don't put processImage in dep array to avoid loops, 
    // but options change should trigger it.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    options.resolution,
    options.invertColors,
    options.contrast,
  ]); // theme and darkMode don't need re-processing, only re-draw which is handled in the other useEffect

  const downloadPNG = () => {
    if (!canvasRef.current) return;
    const url = canvasRef.current.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = 'github-graph.png';
    a.click();
  };

  const downloadSVG = () => {
    if (gridData.length === 0) return;
    
    const colors = getColors();
    const GAP = 3;
    const BLOCK_SIZE = 12;
    const RADIUS = 2;
    
    const width = dimensions.width * (BLOCK_SIZE + GAP) - GAP;
    const height = dimensions.height * (BLOCK_SIZE + GAP) - GAP;
    
    let svgContent = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">\n`;
    
    gridData.forEach((row, y) => {
      row.forEach((level, x) => {
        const xPos = x * (BLOCK_SIZE + GAP);
        const yPos = y * (BLOCK_SIZE + GAP);
        svgContent += `  <rect x="${xPos}" y="${yPos}" width="${BLOCK_SIZE}" height="${BLOCK_SIZE}" rx="${RADIUS}" fill="${colors[level]}" />\n`;
      });
    });
    
    svgContent += '</svg>';
    
    const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'github-graph.svg';
    a.click();
    URL.revokeObjectURL(url);
  };

  const shareImage = async () => {
    if (!canvasRef.current) return;
    
    if (navigator.share) {
      try {
        canvasRef.current.toBlob(async (blob) => {
          if (!blob) return;
          const file = new File([blob], 'github-graph.png', { type: 'image/png' });
          await navigator.share({
            title: 'Image to GitHub Graph',
            text: 'Check out my image converted to a GitHub contribution graph!',
            files: [file],
          });
        });
      } catch (error) {
        console.error('Error sharing', error);
      }
    } else {
      alert('Web Share API is not supported in your browser.');
    }
  };

  return {
    canvasRef,
    isProcessing,
    hasImage: !!imageSrc,
    handleImageUpload,
    downloadPNG,
    downloadSVG,
    shareImage
  };
}
