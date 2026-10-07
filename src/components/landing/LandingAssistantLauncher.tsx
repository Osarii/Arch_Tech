import React, { useState, useEffect, useRef } from 'react';
import { ArchTechLogo } from '../brand/ArchTechLogo';
import { GarnierChatShell } from '../ai/GarnierChatShell';
import { publicAssistant } from '../../services/publicAssistantService';
import { useLocale } from '../../portal/locale';
import type { AIMessage } from '../../types/bim';

export const LandingAssistantLauncher: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const launcherRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const { locale, t } = useLocale();
  const aiT = t.portalAi;

  useEffect(() => {
    const unsubscribe = publicAssistant.subscribe((msgs) => setMessages(msgs));
    return () => unsubscribe();
  }, []);

  // Escape key closes the assistant
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

  // Focus management: when opened, focus inside panel; when closed, restore to launcher
  useEffect(() => {
    if (isOpen) {
      const inputEl = panelRef.current?.querySelector('input');
      inputEl?.focus?.();
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
        locale === 'es' ? 'Cuéntame sobre sus servicios' : 'Tell me about your services',
        locale === 'es' ? '¿Cómo ingreso a mi portal de proyecto?' : 'How can I access my project portal?',
      ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm sm:hidden"
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
            className="group flex items-center gap-3 rounded-full border border-[#ABD1B5]/30 bg-[#000000]/90 px-4 py-2.5 text-[#EDF4ED] shadow-2xl backdrop-blur-md transition-all duration-300 hover:border-[#ABD1B5] hover:bg-[#000000] hover:shadow-[0_0_24px_rgba(171,209,181,0.25)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ABD1B5]"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#111216] p-1 border border-[#ABD1B5]/40 transition-transform duration-300 group-hover:scale-105">
              <ArchTechLogo variant="mark" tone="celadon" className="h-5 w-5" />
            </span>
            <span className="font-mono text-xs uppercase tracking-[0.16em] text-[#EDF4ED] group-hover:text-white">
              {aiT.launcherLabel || 'Ask GARNIER'}
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
          className="fixed inset-3 z-40 flex flex-col sm:inset-auto sm:bottom-6 sm:right-6 sm:h-[580px] sm:w-[410px] animate-in fade-in zoom-in-95 duration-200"
        >
          <GarnierChatShell
            variant="docked"
            className="h-full border border-[#ABD1B5]/30 bg-[#000000] text-[#EDF4ED] shadow-2xl"
            title={aiT.publicAssistantTitle || 'GARNIER ASSISTANT'}
            subtitle={aiT.publicAssistantSubtitle || 'Architecture & development concierge'}
            statusLabel={aiT.onlineStatus || 'Online'}
            isOnline={true}
            messages={messages}
            isProcessing={isProcessing}
            onSendMessage={handleSend}
            onClose={handleClose}
            closeAriaLabel={aiT.launcherAriaClose || 'Close GARNIER assistant'}
            quickPrompts={quickPrompts}
            emptyHeading={aiT.publicAssistantTitle || 'GARNIER ASSISTANT'}
            emptyDescription={
              aiT.landingGreeting ||
              'Welcome to GARNIER ARCHITECTURE. How can I assist you with our developments, services, or project portals?'
            }
            placeholder={
              locale === 'es' ? 'Consulte sobre proyectos, sectores o acceso…' : 'Ask about projects, sectors or access…'
            }
            sendLabel={aiT.send || 'Send'}
            thinkingLabel={aiT.thinking || 'Thinking…'}
          />
        </div>
      )}
    </>
  );
};
