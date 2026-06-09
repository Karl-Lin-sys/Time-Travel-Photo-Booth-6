/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { Camera, Clock, Loader2, RefreshCw, X, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { HISTORICAL_SCENES, HistoricalSceneId } from './types';

export default function App() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  
  const [selectedScene, setSelectedScene] = useState<HistoricalSceneId>('1920s');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user', width: { ideal: 1024 }, height: { ideal: 1024 } } 
      });
      setStream(mediaStream);
      setHasCameraPermission(true);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error('Failed to access camera:', err);
      setHasCameraPermission(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  // Re-attach stream to video element when it mounts if we have a stream but it's not playing
  useEffect(() => {
    if (stream && videoRef.current && videoRef.current.srcObject !== stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream, capturedImage, resultImage]);

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current || !stream) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // We want a square crop if possible, or just the whole frame
    const size = Math.min(video.videoWidth, video.videoHeight);
    canvas.width = size;
    canvas.height = size;
    
    // Calculate cropping to center the square
    const sx = (video.videoWidth - size) / 2;
    const sy = (video.videoHeight - size) / 2;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Flip horizontally since it's a front-facing camera usually mirrored
    ctx.translate(size, 0);
    ctx.scale(-1, 1);
    
    ctx.drawImage(video, sx, sy, size, size, 0, 0, size, size);
    
    const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setCapturedImage(imageDataUrl);
    
    // Stop camera while we generate
    stopCamera();
    
    await generateTimeTravelPhoto(imageDataUrl);
  };

  const generateTimeTravelPhoto = async (image: string) => {
    setIsGenerating(true);
    setError(null);
    
    const scene = HISTORICAL_SCENES.find(s => s.id === selectedScene)!;

    try {
      const response = await fetch('/api/generate-photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          image,
          scenePrompt: scene.prompt
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate image');
      }

      setResultImage(data.imageUrl);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsGenerating(false);
    }
  };

  const resetBooth = () => {
    setCapturedImage(null);
    setResultImage(null);
    setError(null);
    startCamera();
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-50 flex flex-col font-sans selection:bg-amber-500/30">
      <header className="p-6 border-b border-neutral-800 bg-neutral-950/50 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 rounded-xl text-amber-500">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-medium tracking-tight text-neutral-100">Time Travel Booth</h1>
              <p className="text-xs text-neutral-400 font-medium">Historical Portrait Generator</p>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto p-6 flex flex-col pt-8">
        <AnimatePresence mode="wait">
          {!resultImage && !capturedImage ? (
            <motion.div 
              key="camera-view"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex-1 flex flex-col md:flex-row gap-8"
            >
              {/* Camera Preview */}
              <div className="flex-1 flex flex-col gap-4">
                <div className="relative aspect-square w-full max-w-lg mx-auto bg-neutral-900 rounded-3xl overflow-hidden shadow-2xl border border-neutral-800 ring-1 ring-white/5">
                  {hasCameraPermission === false ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center text-neutral-400">
                      <Camera className="w-12 h-12 mb-4 opacity-50" />
                      <p className="font-medium">Camera access is required</p>
                      <p className="text-sm mt-2 opacity-80">Please allow camera access in your browser settings to use the photo booth.</p>
                    </div>
                  ) : (
                    <>
                      <video 
                        ref={videoRef} 
                        autoPlay 
                        playsInline 
                        muted 
                        className="absolute inset-0 w-full h-full object-cover transform -scale-x-100"
                      />
                      <div className="absolute inset-0 ring-1 ring-inset ring-black/10 rounded-3xl pointer-events-none" />
                      
                      {/* Viewfinder brackets */}
                      <div className="absolute inset-8 border-2 border-white/20 rounded-3xl pointer-events-none">
                        <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-amber-500 rounded-tl-2xl -translate-x-[2px] -translate-y-[2px]" />
                        <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-amber-500 rounded-tr-2xl translate-x-[2px] -translate-y-[2px]" />
                        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-amber-500 rounded-bl-2xl -translate-x-[2px] translate-y-[2px]" />
                        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-amber-500 rounded-br-2xl translate-x-[2px] translate-y-[2px]" />
                      </div>
                    </>
                  )}
                </div>

                <div className="flex justify-center mt-2">
                  <button
                    onClick={capturePhoto}
                    disabled={!stream}
                    className="group relative flex items-center justify-center gap-3 px-8 py-4 bg-amber-500 hover:bg-amber-400 text-amber-950 rounded-full font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed mx-auto shadow-[0_0_40px_rgba(245,158,11,0.2)] hover:shadow-[0_0_60px_rgba(245,158,11,0.4)] disabled:shadow-none"
                  >
                    <Camera className="w-5 h-5 transition-transform group-hover:scale-110" />
                    <span>Travel Through Time</span>
                  </button>
                </div>
              </div>

              {/* Scene Selection */}
              <div className="w-full md:w-80 flex flex-col gap-4">
                <h3 className="text-sm font-semibold tracking-wider text-neutral-400 uppercase">Destination</h3>
                <div className="grid grid-cols-2 md:grid-cols-1 gap-3">
                  {HISTORICAL_SCENES.map((scene) => (
                    <button
                      key={scene.id}
                      onClick={() => setSelectedScene(scene.id)}
                      className={`
                        text-left p-4 rounded-2xl transition-all border
                        ${selectedScene === scene.id 
                          ? 'bg-amber-500/10 border-amber-500/50 text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.1)]' 
                          : 'bg-neutral-900/50 border-neutral-800 text-neutral-300 hover:bg-neutral-800 hover:border-neutral-700'
                        }
                      `}
                    >
                      <span className="block font-medium">{scene.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          ) : resultImage ? (
            <motion.div 
              key="result-view"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4 }}
              className="flex-1 flex flex-col items-center justify-center gap-10"
            >
              <div className="relative aspect-square w-full max-w-xl mx-auto rounded-3xl overflow-hidden shadow-2xl ring-1 ring-white/10 group">
                <img src={resultImage} alt="Time Travel Result" className="w-full h-full object-cover" />
                
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
                  <a 
                    href={resultImage} 
                    download="time-travel-portrait.png"
                    className="flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-md px-4 py-2 rounded-full text-white text-sm font-medium transition-colors"
                  >
                    <Download className="w-4 h-4" /> Download
                  </a>
                </div>
              </div>
              
              <button
                onClick={resetBooth}
                className="flex items-center gap-3 px-8 py-4 bg-neutral-800 hover:bg-neutral-700 text-white rounded-full font-semibold transition-all shadow-lg"
              >
                <RefreshCw className="w-5 h-5" />
                <span>Travel Again</span>
              </button>
            </motion.div>
          ) : (
            <motion.div 
              key="loading-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col items-center justify-center p-8 text-center"
            >
              <div className="relative mb-12">
                <div className="w-24 h-24 border-4 border-neutral-800 rounded-full" />
                <div className="absolute inset-0 border-4 border-amber-500 rounded-full border-t-transparent animate-spin" />
                <Clock className="w-8 h-8 text-amber-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
              </div>
              
              {capturedImage && (
                 <div className="opacity-30 absolute pb-32 blur-md scale-110 pointer-events-none">
                    <img src={capturedImage} className="w-40 h-40 object-cover rounded-full mix-blend-screen" />
                 </div>
              )}

              <h2 className="text-2xl font-bold mb-4 relative z-10">Generative Time Loop Engaged</h2>
              <p className="text-neutral-400 max-w-sm font-medium relative z-10">We are reconstructing your atoms in the {HISTORICAL_SCENES.find(s => s.id === selectedScene)?.name}. This usually takes about 10-20 seconds.</p>
              
              {error && (
                <div className="mt-8 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 flex items-start gap-4 max-w-md mx-auto relative z-10 text-left">
                  <X className="w-6 h-6 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-red-300">Temporal Anomaly Detected</h4>
                    <p className="text-sm mt-1">{error}</p>
                    <button onClick={resetBooth} className="text-sm font-medium text-white hover:text-red-200 mt-3 underline underline-offset-2">Return to Present</button>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
