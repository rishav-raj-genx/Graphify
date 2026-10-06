"use client";

import React, { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Download, Image as ImageIcon, Settings, 
  Moon, Sun, Share2, UploadCloud, RefreshCw, Palette, Check, X
} from 'lucide-react';
import ReactCrop, { Crop, PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { useGitHubGraphProcessor, Theme, ProcessorOptions } from '@/hooks/useGitHubGraphProcessor';

export default function Home() {
  const [options, setOptions] = useState<ProcessorOptions>({
    resolution: 50,
    invertColors: false,
    isDarkMode: true,
    contrast: 0,
    theme: 'green',
    customColor: '#8a2be2',
  });
  
  const [isDragging, setIsDragging] = useState(false);
  
  const [cropModalSrc, setCropModalSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const imgRef = useRef<HTMLImageElement>(null);
  
  const {
    canvasRef,
    isProcessing,
    hasImage,
    handleImageUpload,
    downloadPNG,
    downloadSVG,
    shareImage
  } = useGitHubGraphProcessor(options);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleFileForCrop = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      if (typeof e.target?.result === 'string') {
        setCropModalSrc(e.target.result);
        setCrop(undefined);
        setCompletedCrop(undefined);
      }
    };
    reader.readAsDataURL(file);
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileForCrop(e.dataTransfer.files[0]);
    }
  };

  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileForCrop(e.target.files[0]);
    }
  };

  const onApplyCrop = () => {
    if (!completedCrop || !completedCrop.width || !completedCrop.height || !imgRef.current) {
      if (cropModalSrc) handleImageUpload(cropModalSrc); 
      setCropModalSrc(null);
      return;
    }
    
    const image = imgRef.current;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;
    
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    
    canvas.width = completedCrop.width * scaleX;
    canvas.height = completedCrop.height * scaleY;
    
    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY
    );
    
    const dataUrl = canvas.toDataURL('image/png');
    handleImageUpload(dataUrl);
    setCropModalSrc(null);
  };

  const updateOption = <K extends keyof ProcessorOptions>(key: K, value: ProcessorOptions[K]) => {
    setOptions(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className={`min-h-screen flex flex-col md:flex-row transition-colors duration-300 ${options.isDarkMode ? 'bg-[#0d1117] text-[#c9d1d9]' : 'bg-[#f6f8fa] text-[#24292f]'}`}>
      
      {/* Sidebar Controls */}
      <motion.aside 
        initial={{ x: -300, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className={`w-full md:w-80 flex flex-col shrink-0 border-r overflow-y-auto ${options.isDarkMode ? 'border-gray-800 bg-[#161b22]' : 'border-gray-200 bg-white'}`}
      >
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <div className={`p-2 rounded-lg ${options.isDarkMode ? 'bg-[#238636] text-white' : 'bg-[#2ea043] text-white'}`}>
              <ImageIcon size={24} />
            </div>
            <h1 className="text-xl font-bold tracking-tight">Graphify</h1>
          </div>
          
          <div className="space-y-6">
            <div className="space-y-3">
              <label className="text-sm font-semibold flex items-center gap-2">
                <Settings size={16} /> Resolution ({options.resolution})
              </label>
              <input 
                type="range" 
                min="10" 
                max="120" 
                value={options.resolution}
                onChange={(e) => updateOption('resolution', parseInt(e.target.value))}
                className="w-full accent-green-600"
              />
              <p className={`text-xs ${options.isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Higher resolution means more GitHub blocks (smaller blocks).
              </p>
            </div>
            
            <div className="space-y-3">
              <label className="text-sm font-semibold flex items-center gap-2">
                <RefreshCw size={16} /> Contrast ({options.contrast})
              </label>
              <input 
                type="range" 
                min="-100" 
                max="100" 
                value={options.contrast}
                onChange={(e) => updateOption('contrast', parseInt(e.target.value))}
                className="w-full accent-green-600"
              />
              <p className={`text-xs ${options.isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Adjust mapping threshold.
              </p>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-semibold flex items-center gap-2">
                <Palette size={16} /> Theme
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['green', 'halloween', 'winter', 'custom'] as Theme[]).map((theme) => (
                  <button
                    key={theme}
                    onClick={() => updateOption('theme', theme)}
                    className={`py-2 px-3 rounded-md text-xs font-medium transition-all ${
                      options.theme === theme 
                        ? (options.isDarkMode ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-900') 
                        : (options.isDarkMode ? 'bg-[#0d1117] hover:bg-gray-800' : 'bg-[#f6f8fa] hover:bg-gray-100')
                    } border ${options.isDarkMode ? 'border-gray-700' : 'border-gray-300'}`}
                  >
                    {theme.charAt(0).toUpperCase() + theme.slice(1)}
                  </button>
                ))}
              </div>
              <AnimatePresence>
                {options.theme === 'custom' && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="flex items-center gap-3 pt-2">
                      <label className="text-xs font-semibold">Custom Base Color:</label>
                      <input 
                        type="color" 
                        value={options.customColor}
                        onChange={(e) => updateOption('customColor', e.target.value)}
                        className={`w-8 h-8 rounded cursor-pointer border-0 p-0 bg-transparent`}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="pt-4 border-t border-dashed border-gray-500/30 flex flex-col gap-4">
              <label className="flex items-center justify-between cursor-pointer group">
                <span className="text-sm font-semibold">Invert Colors</span>
                <div className={`w-11 h-6 rounded-full flex items-center p-1 transition-colors ${options.invertColors ? 'bg-green-600' : 'bg-gray-400 dark:bg-gray-600'}`}>
                  <div className={`w-4 h-4 bg-white rounded-full transition-transform ${options.invertColors ? 'translate-x-5' : 'translate-x-0'}`} />
                </div>
                <input 
                  type="checkbox" 
                  className="hidden" 
                  checked={options.invertColors}
                  onChange={(e) => updateOption('invertColors', e.target.checked)}
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer group">
                <span className="text-sm font-semibold flex items-center gap-2">
                  {options.isDarkMode ? <Moon size={16} /> : <Sun size={16} />} 
                  Dark Mode
                </span>
                <div className={`w-11 h-6 rounded-full flex items-center p-1 transition-colors ${options.isDarkMode ? 'bg-green-600' : 'bg-gray-400'}`}>
                  <div className={`w-4 h-4 bg-white rounded-full transition-transform ${options.isDarkMode ? 'translate-x-5' : 'translate-x-0'}`} />
                </div>
                <input 
                  type="checkbox" 
                  className="hidden" 
                  checked={options.isDarkMode}
                  onChange={(e) => updateOption('isDarkMode', e.target.checked)}
                />
              </label>
            </div>
            
            <div className="pt-6 border-t border-dashed border-gray-500/30">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={downloadPNG}
                  disabled={!hasImage || isProcessing}
                  className="flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-semibold bg-[#238636] hover:bg-[#2ea043] text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Download size={16} /> PNG
                </button>
                <button
                  onClick={downloadSVG}
                  disabled={!hasImage || isProcessing}
                  className={`flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-semibold border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    options.isDarkMode 
                      ? 'border-gray-700 bg-[#21262d] hover:bg-[#30363d]' 
                      : 'border-gray-300 bg-white hover:bg-gray-50'
                  }`}
                >
                  <Download size={16} /> SVG
                </button>
                <button
                  onClick={shareImage}
                  disabled={!hasImage || isProcessing}
                  className={`col-span-2 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-semibold border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    options.isDarkMode 
                      ? 'border-gray-700 bg-[#21262d] hover:bg-[#30363d]' 
                      : 'border-gray-300 bg-white hover:bg-gray-50'
                  }`}
                >
                  <Share2 size={16} /> Share
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.aside>

      {/* Main Preview Area */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <div className="flex-1 p-4 md:p-8 flex items-center justify-center overflow-auto relative">
          
          <AnimatePresence mode="wait">
            {!hasImage && !cropModalSrc ? (
              <motion.div
                key="upload-zone"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
                className={`w-full max-w-2xl aspect-video rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-8 transition-colors ${
                  isDragging 
                    ? (options.isDarkMode ? 'border-green-500 bg-green-500/10' : 'border-green-500 bg-green-50') 
                    : (options.isDarkMode ? 'border-gray-700 hover:border-gray-500 bg-[#161b22]' : 'border-gray-300 hover:border-gray-400 bg-white')
                }`}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
              >
                <UploadCloud size={64} className={`mb-4 ${options.isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
                <h3 className="text-xl font-bold mb-2">Drag & Drop an image</h3>
                <p className={`text-sm mb-6 ${options.isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Supports JPG, PNG, WebP up to high resolution.
                </p>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="py-2 px-6 rounded-full bg-[#238636] hover:bg-[#2ea043] text-white font-semibold transition-colors"
                >
                  Browse Files
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={onFileChange} 
                  accept="image/*" 
                  className="hidden" 
                />
              </motion.div>
            ) : cropModalSrc ? (
              <motion.div
                key="crop-modal"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`p-6 rounded-xl shadow-2xl relative max-w-full flex flex-col items-center ${
                  options.isDarkMode ? 'bg-[#161b22] shadow-black/50' : 'bg-white shadow-gray-200/50'
                }`}
              >
                <h2 className="text-lg font-bold mb-4">Crop Image</h2>
                <div className="max-h-[60vh] overflow-auto rounded-lg border border-gray-700">
                  <ReactCrop 
                    crop={crop} 
                    onChange={(c) => setCrop(c)}
                    onComplete={(c) => setCompletedCrop(c)}
                  >
                    <img 
                      ref={imgRef}
                      src={cropModalSrc} 
                      alt="Crop target" 
                      className="max-w-full"
                    />
                  </ReactCrop>
                </div>
                <div className="flex gap-4 mt-6">
                  <button 
                    onClick={() => setCropModalSrc(null)}
                    className="flex items-center gap-2 py-2 px-4 rounded-md text-sm font-semibold border border-gray-600 hover:bg-gray-800 text-gray-300 transition-colors"
                  >
                    <X size={16} /> Cancel
                  </button>
                  <button 
                    onClick={onApplyCrop}
                    className="flex items-center gap-2 py-2 px-4 rounded-md text-sm font-semibold bg-[#238636] hover:bg-[#2ea043] text-white transition-colors"
                  >
                    <Check size={16} /> Apply Crop & Generate
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="canvas-preview"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className={`p-6 rounded-xl shadow-2xl relative max-w-full overflow-auto ${
                  options.isDarkMode ? 'bg-[#161b22] shadow-black/50' : 'bg-white shadow-gray-200/50'
                }`}
              >
                {isProcessing && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/20 backdrop-blur-sm rounded-xl">
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                      className="w-10 h-10 border-4 border-[#238636] border-t-transparent rounded-full"
                    />
                  </div>
                )}
                
                <canvas 
                  ref={canvasRef} 
                  className="mx-auto block"
                />
                
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className={`mt-6 mx-auto flex items-center gap-2 py-2 px-4 rounded-md text-sm font-semibold border transition-colors ${
                    options.isDarkMode 
                      ? 'border-gray-700 hover:bg-[#30363d] text-gray-300' 
                      : 'border-gray-300 hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <ImageIcon size={16} /> Choose different image
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={onFileChange} 
                  accept="image/*" 
                  className="hidden" 
                />
              </motion.div>
            )}
          </AnimatePresence>
          
        </div>
      </main>
    </div>
  );
}
