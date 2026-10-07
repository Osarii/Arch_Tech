import React, { useState, useEffect, useRef } from 'react';
import { ArchTechLogo } from '../brand/ArchTechLogo';
import { GarnierChatShell } from '../ai/GarnierChatShell';
import { publicAssistant } from '../../services/publicAssistantService';
import { useLocale } from '../../portal/locale';
import type { AIMessage } from '../../types/bim';

interface LandingAssistantLauncherProps {
  lightTheme?: boolean;
}

export const LandingAssistantLauncher: React.FC<LandingAssistantLauncherProps> = ({ lightTheme }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const launcherRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const { locale, t } = useLocale();
  const aiT = t.portalAi;

  const isLight = lightTheme ?? (typeof window !== 'undefined' && window.localStorage.getItem('garnier-public-theme') === 'light');

  useEffect(() => {
    const unsubscribe = publicAssistant.subscribe((msgs) => setMessages(msgs));
    return () => unsubscribe();
  }, []);

  // Escape key closes the assistant and returns focus
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setIsOpen(false);
        launcherRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Focus management: when opened, focus inside input field
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        const inputEl = panelRef.current?.querySelector('input');
        inputEl?.focus?.();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleOpen = () => {
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    launcherRef.current?.focus?.();
  };

  const handleSend = async (text: string) => {
    if (!text.trim() || isProcessing) return;
    setIsProcessing(true);
    try {
      await publicAssistant.sendMessage(text, locale);
    } catch (err) {
      console.error('Public assistant error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const quickPrompts = Array.isArray(aiT.landingQuickPrompts)
    ? aiT.landingQuickPrompts
    : [
        locale === 'es' ? '¿Qué tipo de proyectos desarrollan?' : 'What types of projects do you develop?',
        locale === 'es' ? 'Muéstrame proyectos industriales' : 'Show me industrial projects',
        locale === 'es' ? 'Cuéntame sobre La Lima' : 'Tell me about La Lima',
        locale === 'es' ? '¿Qué puedo consultar aquí?' : 'What can I review here?',
      ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-xs sm:hidden"
          onClick={handleClose}
          aria-hidden="true"
        />
      )}

      {/* Floating launcher button */}
      {!isOpen && (
        <aside
          aria-label={aiT.publicAssistantTitle || 'GARNIER ASSISTANT'}
          className="fixed bottom-6 right-6 z-30"
        >
          <button
            ref={launcherRef}
            type="button"
            onClick={handleOpen}
            data-testid="landing-assistant-launcher"
            aria-label={aiT.launcherAriaOpen || 'Open GARNIER assistant'}
            aria-expanded={isOpen}
            className={`group flex items-center gap-2.5 rounded-full border px-3.5 py-2 shadow-2xl backdrop-blur-md transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 ${
              isLight
                ? 'border-black/20 bg-white/95 text-stone-900 hover:border-black hover:bg-white focus-visible:outline-black shadow-[0_8px_30px_rgba(0,0,0,0.12)]'
                : 'border-[#ABD1B5]/35 bg-[#0a0b0e]/95 text-[#EDF4ED] hover:border-[#ABD1B5] hover:bg-black focus-visible:outline-[#ABD1B5] shadow-[0_8px_32px_rgba(0,0,0,0.6)]'
            }`}
          >
            <span
              className={`flex h-6.5 w-6.5 items-center justify-center rounded-full border p-1 transition-transform duration-200 group-hover:scale-105 ${
                isLight ? 'border-black/15 bg-black/5' : 'border-[#ABD1B5]/40 bg-[#12141a]'
              }`}
            >
              <ArchTechLogo
                variant="mark"
                tone={isLight ? 'black' : 'celadon'}
                className="h-4.5 w-4.5"
              />
            </span>
            <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em]">
              {aiT.launcherLabel || (locale === 'es' ? 'Consultar a GARNIER' : 'Ask GARNIER')}
            </span>
            <span className="relative flex h-2 w-2 ml-0.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#79B791] opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#79B791]" />
            </span>
          </button>
        </aside>
      )}

      {/* Docked AI panel */}
      {isOpen && (
        <div
          ref={panelRef}
          data-testid="landing-assistant-panel"
          role="dialog"
          aria-modal="true"
          aria-label={aiT.publicAssistantTitle || 'GARNIER ASSISTANT'}
          className="fixed inset-3 z-40 flex flex-col sm:inset-auto sm:bottom-6 sm:right-6 sm:h-[580px] sm:w-[380px] animate-in fade-in zoom-in-95 duration-200"
        >
          <GarnierChatShell
            variant="docked"
            lightTheme={isLight}
            className="h-full"
            title={aiT.publicAssistantTitle || (locale === 'es' ? 'ASISTENTE GARNIER' : 'GARNIER ASSISTANT')}
            subtitle={aiT.publicAssistantSubtitle || (locale === 'es' ? 'Orientación de arquitectura y desarrollo' : 'Architecture & development concierge')}
            statusLabel={aiT.onlineStatus || (locale === 'es' ? 'En línea' : 'Online')}
            isOnline={true}
            messages={messages}
            isProcessing={isProcessing}
            onSendMessage={handleSend}
            onClose={handleClose}
            closeAriaLabel={aiT.launcherAriaClose || 'Close GARNIER assistant'}
            quickPrompts={quickPrompts}
            emptyHeading={aiT.publicAssistantTitle || (locale === 'es' ? 'ASISTENTE GARNIER' : 'GARNIER ASSISTANT')}
            emptyDescription={
              aiT.landingGreeting ||
              (locale === 'es'
                ? 'Bienvenido a GARNIER ARCHITECTURE. ¿En qué podemos orientarle sobre nuestros proyectos y servicios?'
                : 'Welcome to GARNIER ARCHITECTURE. How can I assist you with our developments, services, or project portals?')
            }
            placeholder={
              locale === 'es' ? 'Consulte sobre proyectos, sectores o acceso…' : 'Ask about projects, sectors or access…'
            }
            sendLabel={aiT.send || 'Send'}
            thinkingLabel={aiT.thinking || (locale === 'es' ? 'Pensando…' : 'Thinking…')}
          />
        </div>
      )}
    </>
  );
};
