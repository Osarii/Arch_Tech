import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, FastForward, X } from 'lucide-react';
import { useDemoTour } from '../../demo/DemoTourContext';

const copy = {
  dialogLabel: 'ARCH_TECH Intro Video',
  skipBtn: 'OMITIR INTRODUCCIÓN',
  skipShort: 'Omitir',
  play: 'Reproducir',
  pause: 'Pausar',
  mute: 'Silenciar',
  unmute: 'Activar Sonido',
  fullscreen: 'Pantalla Completa',
  exit: 'Salir',
  brand: 'ARCH_TECH',
  tagline: 'Enterprise Development Platform',
  clickToPlay: 'HAGA CLIC PARA INICIAR EL VIDEO',
};

export const DemoIntroModal: React.FC = () => {
  const { isTourActive, stage, nextStage, exitTour, isFullscreen, toggleFullscreen } = useDemoTour();
  const videoRef = useRef<HTMLVideoElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  const isOpen = isTourActive && stage === 'intro';

  // Handle video playback lifecycle
  useEffect(() => {
    if (!isOpen) return;

    const video = videoRef.current;
    if (!video) return;

    video.currentTime = 0;
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          setIsPlaying(true);
          setAutoplayBlocked(false);
          setHasStarted(true);
        })
        .catch(() => {
          // Autoplay blocked by browser policy
          setAutoplayBlocked(true);
          setIsPlaying(false);
        });
    }

    const onTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      if (video.duration && !isNaN(video.duration)) {
        setDuration(video.duration);
      }
    };

    const onEnded = () => {
      setIsPlaying(false);
      nextStage();
    };

    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('ended', onEnded);

    return () => {
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('ended', onEnded);
      video.pause();
    };
  }, [isOpen, nextStage]);

  // Keyboard controls: Escape to skip, Space to play/pause
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        nextStage();
      } else if (e.key === ' ') {
        e.preventDefault();
        togglePlay();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      void video.play().then(() => {
        setIsPlaying(true);
        setAutoplayBlocked(false);
        setHasStarted(true);
      });
    } else {
      video.pause();
      setIsPlaying(false);
    }
  }, []);

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  }, []);

  const handleStartManualPlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = false;
    setIsMuted(false);
    void video.play().then(() => {
      setIsPlaying(true);
      setAutoplayBlocked(false);
      setHasStarted(true);
    });
  }, []);

  if (!isOpen) return null;

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div
      data-testid="demo-intro-modal"
      role="dialog"
      aria-modal="true"
      aria-label={copy.dialogLabel}
      className="fixed inset-0 z-[120] flex flex-col justify-between bg-[#07080a] text-white select-none animate-in fade-in duration-300"
    >
      {/* Top Header Controls */}
      <header className="flex w-full items-center justify-between p-6 z-20">
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs font-bold uppercase tracking-[0.24em] text-[#ABD1B5]">
            {copy.brand}
          </span>
          <span className="h-3 w-px bg-white/20" aria-hidden="true" />
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-stone-400">
            {copy.tagline}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            data-testid="demo-intro-skip"
            onClick={nextStage}
            className="group flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-[#EDF4ED] transition-all hover:border-[#79B791] hover:bg-[#79B791] hover:text-black shadow-lg"
          >
            <span>{copy.skipBtn}</span>
            <FastForward className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </button>

          <button
            type="button"
            data-testid="demo-intro-exit"
            onClick={exitTour}
            aria-label={copy.exit}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/5 text-stone-400 transition-colors hover:border-white/40 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Main Video Viewport */}
      <main className="relative flex flex-1 items-center justify-center overflow-hidden px-4 sm:px-8">
        <div className="relative aspect-video max-h-[82vh] w-full max-w-6xl overflow-hidden rounded-xl border border-white/10 bg-black shadow-2xl">
          <video
            ref={videoRef}
            data-testid="demo-intro-video"
            playsInline
            className="h-full w-full object-contain"
            onClick={togglePlay}
          >
            <source src="/demo/intro.mp4" type="video/mp4" />
            <source src="/demo/intro.mov" type="video/quicktime" />
            Your browser does not support HTML5 video playback.
          </video>

          {/* Autoplay blocked manual trigger overlay */}
          {autoplayBlocked && !hasStarted && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/75 backdrop-blur-xs">
              <button
                type="button"
                data-testid="demo-intro-play-overlay"
                onClick={handleStartManualPlay}
                className="group flex flex-col items-center gap-4 rounded-2xl border border-[#79B791]/60 bg-[#0c0e14]/90 p-8 shadow-2xl transition-transform hover:scale-105"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#79B791] text-black shadow-lg">
                  <Play className="h-8 w-8 fill-current translate-x-0.5" />
                </div>
                <span className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-[#ABD1B5]">
                  {copy.clickToPlay}
                </span>
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Bottom Timeline & Controls Bar */}
      <footer className="w-full p-6 z-20">
        <div className="mx-auto max-w-6xl space-y-3">
          {/* Progress Bar */}
          <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-white/15">
            <div
              className="h-full bg-gradient-to-r from-[#79B791] to-[#ABD1B5] transition-all duration-150"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs text-stone-400 font-mono">
            <div className="flex items-center gap-3">
              <button
                type="button"
                data-testid="demo-intro-toggle-play"
                onClick={togglePlay}
                className="flex items-center gap-1.5 rounded border border-white/15 bg-white/5 px-3 py-1.5 text-stone-200 hover:border-white/40 hover:text-white"
              >
                {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5 fill-current" />}
                <span>{isPlaying ? copy.pause : copy.play}</span>
              </button>

              <button
                type="button"
                data-testid="demo-intro-toggle-mute"
                onClick={toggleMute}
                className="flex items-center gap-1.5 rounded border border-white/15 bg-white/5 px-3 py-1.5 text-stone-200 hover:border-white/40 hover:text-white"
              >
                {isMuted ? <VolumeX className="h-3.5 w-3.5 text-red-400" /> : <Volume2 className="h-3.5 w-3.5 text-[#79B791]" />}
                <span>{isMuted ? copy.unmute : copy.mute}</span>
              </button>

              <span className="text-[11px] tracking-wider text-stone-400">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleFullscreen}
                className="flex items-center gap-1.5 rounded border border-white/15 bg-white/5 px-3 py-1.5 text-stone-200 hover:border-white/40 hover:text-white"
              >
                {isFullscreen ? <Minimize className="h-3.5 w-3.5" /> : <Maximize className="h-3.5 w-3.5" />}
                <span className="hidden sm:inline">{copy.fullscreen}</span>
              </button>

              <button
                type="button"
                onClick={nextStage}
                className="flex items-center gap-1 rounded bg-[#79B791] px-3.5 py-1.5 font-semibold text-black hover:bg-[#8fd0aa]"
              >
                <span>{copy.skipShort} →</span>
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
