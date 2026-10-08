import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FastForward, Maximize, Minimize, Pause, Play, Volume2, VolumeX, X } from 'lucide-react';
import { DEMO_VIDEOS, useDemoTour } from '../../demo/DemoTourContext';

const copy = {
  brand: 'ARCH_TECH',
  exit: 'Salir',
  clickToPlay: 'HAGA CLIC PARA REPRODUCIR',
  fullscreen: 'Pantalla completa',
};

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const DemoVideoStage: React.FC = () => {
  const {
    activeVideo,
    completeVideo,
    exitTour,
    isFullscreen,
    isPreparingStage,
    toggleFullscreen,
  } = useDemoTour();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [hasFinished, setHasFinished] = useState(false);

  const video = activeVideo ? DEMO_VIDEOS[activeVideo] : null;

  const finishVideo = useCallback(() => {
    setIsPlaying(false);
    setHasFinished(true);
    completeVideo();
  }, [completeVideo]);

  const togglePlay = useCallback(() => {
    const element = videoRef.current;
    if (!element || isPreparingStage) return;
    if (element.paused) {
      void element.play().then(() => {
        setIsPlaying(true);
        setAutoplayBlocked(false);
        setHasStarted(true);
      }).catch(() => setAutoplayBlocked(true));
    } else {
      element.pause();
      setIsPlaying(false);
    }
  }, [isPreparingStage]);

  useEffect(() => {
    if (!video || !activeVideo) return;
    const element = videoRef.current;
    if (!element) return;

    setCurrentTime(0);
    setDuration(0);
    setHasStarted(false);
    setHasFinished(false);
    setAutoplayBlocked(false);
    element.currentTime = 0;
    element.muted = false;
    setIsMuted(false);
    void element.play().then(() => {
      setIsPlaying(true);
      setHasStarted(true);
    }).catch(() => {
      setAutoplayBlocked(true);
      setIsPlaying(false);
    });

    const preload = video.next ? document.createElement('video') : null;
    if (preload && video.next) {
      preload.preload = 'auto';
      preload.src = DEMO_VIDEOS[video.next].src;
    }

    return () => {
      element.pause();
      if (preload) {
        preload.removeAttribute('src');
      }
    };
  }, [activeVideo, video]);

  useEffect(() => {
    if (!activeVideo) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        finishVideo();
      } else if (event.key === ' ') {
        event.preventDefault();
        togglePlay();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeVideo, finishVideo, togglePlay]);

  useEffect(() => {
    if (!hasFinished || isPreparingStage || !activeVideo) return;
    const fallback = setTimeout(() => setHasFinished(false), 350);
    return () => clearTimeout(fallback);
  }, [activeVideo, hasFinished, isPreparingStage]);

  if (!video || !activeVideo) return null;

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const toggleMute = () => {
    const element = videoRef.current;
    if (!element) return;
    element.muted = !element.muted;
    setIsMuted(element.muted);
  };

  return (
    <div
      data-testid="demo-video-stage"
      role="dialog"
      aria-modal="true"
      aria-label={`${video.label} video`}
      className={`fixed inset-0 z-[120] flex flex-col justify-between bg-[#07080a] text-white transition-opacity duration-300 ${hasFinished && !isPreparingStage ? 'opacity-0' : 'opacity-100'}`}
    >
      <header className="z-20 flex w-full items-center justify-between p-6">
        <div className="flex items-center gap-3 font-mono uppercase">
          <span className="text-xs font-bold tracking-[0.24em] text-[#ABD1B5]">{copy.brand}</span>
          <span className="h-3 w-px bg-white/20" aria-hidden="true" />
          <span className="text-[10px] tracking-[0.18em] text-stone-400">{video.label}</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            data-testid="demo-video-skip"
            onClick={finishVideo}
            disabled={isPreparingStage}
            className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-[#EDF4ED] hover:border-[#79B791] hover:bg-[#79B791] hover:text-black disabled:opacity-50"
          >
            <span>{isPreparingStage ? 'PREPARANDO…' : 'OMITIR VIDEO'}</span>
            <FastForward className="h-3.5 w-3.5" />
          </button>
          <button type="button" onClick={exitTour} aria-label={copy.exit} className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/5 text-stone-400 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>
      </header>

      <main className="relative flex flex-1 items-center justify-center overflow-hidden px-4 sm:px-8">
        <div className="relative aspect-video max-h-[82vh] w-full max-w-6xl overflow-hidden rounded-xl border border-white/10 bg-black shadow-2xl">
          <video
            key={activeVideo}
            ref={videoRef}
            data-testid="demo-video"
            src={video.src}
            preload="auto"
            playsInline
            className="h-full w-full object-contain"
            onClick={togglePlay}
            onEnded={finishVideo}
            onTimeUpdate={(event) => {
              setCurrentTime(event.currentTarget.currentTime);
              if (Number.isFinite(event.currentTarget.duration)) setDuration(event.currentTarget.duration);
            }}
          />
          {autoplayBlocked && !hasStarted && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/75 backdrop-blur-xs">
              <button type="button" data-testid="demo-video-play-overlay" onClick={togglePlay} className="flex flex-col items-center gap-4 rounded-2xl border border-[#79B791]/60 bg-[#0c0e14]/90 p-8">
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#79B791] text-black"><Play className="h-8 w-8 fill-current" /></span>
                <span className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-[#ABD1B5]">{copy.clickToPlay}</span>
              </button>
            </div>
          )}
        </div>
      </main>

      <footer className="z-20 w-full p-6">
        <div className="mx-auto max-w-6xl space-y-3">
          <div className="h-1.5 overflow-hidden rounded-full bg-white/15"><div className="h-full bg-[#79B791] transition-[width] duration-150" style={{ width: `${progress}%` }} /></div>
          <div className="flex items-center justify-between font-mono text-xs text-stone-400">
            <div className="flex items-center gap-3">
              <button type="button" data-testid="demo-video-toggle-play" onClick={togglePlay} className="flex items-center gap-1.5 rounded border border-white/15 bg-white/5 px-3 py-1.5 text-stone-200">
                {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5 fill-current" />}{isPlaying ? 'Pausar' : 'Reproducir'}
              </button>
              <button type="button" data-testid="demo-video-toggle-mute" onClick={toggleMute} className="flex items-center gap-1.5 rounded border border-white/15 bg-white/5 px-3 py-1.5 text-stone-200">
                {isMuted ? <VolumeX className="h-3.5 w-3.5 text-red-400" /> : <Volume2 className="h-3.5 w-3.5 text-[#79B791]" />}{isMuted ? 'Activar sonido' : 'Silenciar'}
              </button>
              <span className="text-[11px] tracking-wider">{formatTime(currentTime)} / {formatTime(duration)}</span>
            </div>
            <button type="button" onClick={toggleFullscreen} className="flex items-center gap-1.5 rounded border border-white/15 bg-white/5 px-3 py-1.5 text-stone-200">
              {isFullscreen ? <Minimize className="h-3.5 w-3.5" /> : <Maximize className="h-3.5 w-3.5" />}<span className="hidden sm:inline">{copy.fullscreen}</span>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
