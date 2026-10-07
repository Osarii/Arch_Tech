import React, { useRef, useEffect, useState } from 'react';
import { Send, Trash2, X, Check } from 'lucide-react';
import { ArchTechLogo } from '../brand/ArchTechLogo';
import type { AIMessage } from '../../types/bim';

export interface GarnierChatShellProps {
  title?: string;
  subtitle?: string;
  statusLabel?: string;
  isOnline?: boolean;
  messages: AIMessage[];
  isProcessing?: boolean;
  onSendMessage: (text: string) => void | Promise<void>;
  onClearHistory?: () => void;
  onConfirmProposal?: (proposalId: string) => void;
  onRejectProposal?: (proposalId: string) => void;
  quickPrompts?: string[];
  quickPromptsLabel?: string;
  placeholder?: string;
  emptyHeading?: string;
  emptyDescription?: string;
  onClose?: () => void;
  closeAriaLabel?: string;
  variant?: 'portal' | 'docked' | 'full';
  className?: string;
  clearLabel?: string;
  sendLabel?: string;
  confirmLabel?: string;
  rejectLabel?: string;
  writeConfirmationLabel?: string;
  thinkingLabel?: string;
  lightTheme?: boolean;
}

export const GarnierChatShell: React.FC<GarnierChatShellProps> = ({
  title = 'GARNIER ASSISTANT',
  subtitle = 'Project intelligence',
  statusLabel,
  isOnline = true,
  messages,
  isProcessing = false,
  onSendMessage,
  onClearHistory,
  onConfirmProposal,
  onRejectProposal,
  quickPrompts = [],
  quickPromptsLabel,
  placeholder = 'Ask GARNIER assistant…',
  emptyHeading = 'GARNIER ASSISTANT',
  emptyDescription = 'Architecture & development concierge',
  onClose,
  closeAriaLabel = 'Close assistant',
  variant = 'portal',
  className = '',
  clearLabel = 'Clear',
  sendLabel = 'Send',
  confirmLabel = 'Confirm',
  rejectLabel = 'Reject',
  writeConfirmationLabel = 'WRITE ACTION CONFIRMATION',
  thinkingLabel = 'Thinking…',
  lightTheme = false,
}) => {
  const [inputPrompt, setInputPrompt] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView?.({ behavior: 'smooth' });
  }, [messages, isProcessing]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = inputPrompt.trim();
    if (!trimmed || isProcessing) return;
    setInputPrompt('');
    onSendMessage(trimmed);
  };

  const isDocked = variant === 'docked';
  const isEs = title.toLowerCase().includes('asistente') || emptyDescription.toLowerCase().includes('arquitectura');

  return (
    <div
      className={`garnier-chat-shell flex flex-col ${
        isDocked
          ? `h-full rounded-xl overflow-hidden ${
              lightTheme
                ? 'border border-black/20 bg-[#fbfaf8] text-stone-900 shadow-[0_24px_48px_rgba(0,0,0,0.14)]'
                : 'border border-[#ABD1B5]/30 bg-[#0c0d11] text-[#EDF4ED] shadow-[0_24px_48px_rgba(0,0,0,0.7)]'
            }`
          : 'min-h-[520px] rounded-sm border border-black/15 bg-[var(--portal-surface,#ffffff)] text-[var(--portal-text,#000000)]'
      } ${className}`}
    >
      {/* Assistant Header */}
      <header
        className={`flex items-center justify-between px-4 py-3 sm:px-4.5 border-b ${
          isDocked
            ? lightTheme
              ? 'border-black/10 bg-[#f3f1eb]'
              : 'border-white/10 bg-[#12141a]'
            : 'border-black/15'
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-sm border p-1 ${
              isDocked
                ? lightTheme
                  ? 'border-black/15 bg-black/5'
                  : 'border-[#ABD1B5]/35 bg-[#181a22]'
                : 'border-black/15 bg-black/5 dark:bg-white/5'
            }`}
          >
            <ArchTechLogo
              variant="mark"
              tone={lightTheme ? 'black' : 'celadon'}
              className="h-5 w-5"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-inherit">
                {title}
              </span>
              <span className="relative flex h-2 w-2">
                {isOnline && (
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#79B791] opacity-75" />
                )}
                <span
                  className={`relative inline-flex h-2 w-2 rounded-full ${
                    isOnline ? 'bg-[#79B791]' : 'bg-[#FFBF00]'
                  }`}
                  title={statusLabel}
                  aria-label={statusLabel}
                />
              </span>
            </div>
            <p
              className={`font-mono text-[10px] tracking-wide ${
                isDocked
                  ? lightTheme
                    ? 'text-stone-500'
                    : 'text-stone-400'
                  : 'text-stone-500 dark:text-stone-400'
              }`}
            >
              {subtitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono text-[10px]">
          {statusLabel && (
            <span
              className={`hidden items-center gap-1 border px-2 py-0.5 text-[9px] uppercase tracking-wider sm:inline-flex rounded-xs ${
                isDocked
                  ? lightTheme
                    ? 'border-black/10 bg-black/5 text-stone-700'
                    : 'border-white/10 bg-white/5 text-stone-300'
                  : 'border-black/10 bg-black/[0.03] text-stone-600 dark:border-white/10 dark:text-stone-300'
              }`}
            >
              {statusLabel}
            </span>
          )}

          {onClearHistory && (
            <button
              type="button"
              onClick={onClearHistory}
              data-testid="ai-btn-clear"
              aria-label={clearLabel}
              title={clearLabel}
              className={`flex items-center gap-1 rounded-sm border px-2 py-1 uppercase tracking-wider transition-colors ${
                isDocked
                  ? lightTheme
                    ? 'border-black/15 text-stone-700 hover:border-black hover:text-black'
                    : 'border-white/15 text-stone-300 hover:border-white hover:text-white'
                  : 'border-black/15 text-stone-600 hover:border-black hover:text-black dark:border-white/20 dark:text-stone-300 dark:hover:border-white dark:hover:text-white'
              }`}
            >
              <Trash2 className="h-3 w-3" />
              <span className="hidden sm:inline">{clearLabel}</span>
            </button>
          )}

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label={closeAriaLabel}
              className={`flex h-7 w-7 items-center justify-center rounded-sm border transition-colors ${
                isDocked
                  ? lightTheme
                    ? 'border-black/15 text-stone-700 hover:border-black hover:bg-black/5 hover:text-black'
                    : 'border-white/20 text-stone-300 hover:border-white hover:bg-white/10 hover:text-white'
                  : 'border-black/15 text-stone-600 hover:border-black hover:text-black dark:border-white/20 dark:text-stone-300'
              }`}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </header>

      {/* Quick Suggestions Chips */}
      {quickPrompts.length > 0 && (
        <div
          className={`flex items-center gap-1.5 overflow-x-auto border-b px-4 py-2 text-[10px] font-mono scrollbar-none sm:px-4.5 ${
            isDocked
              ? lightTheme
                ? 'border-black/10 bg-[#f7f6f0]'
                : 'border-white/[0.08] bg-[#0f1116]'
              : 'border-black/10 bg-black/[0.02] dark:bg-white/[0.02]'
          }`}
        >
          {quickPromptsLabel && (
            <span
              className={`shrink-0 uppercase tracking-widest text-[9px] ${
                lightTheme ? 'text-stone-500' : 'text-stone-400'
              }`}
            >
              {quickPromptsLabel}
            </span>
          )}
          {quickPrompts.map((prompt, idx) => (
            <button
              key={idx}
              type="button"
              disabled={isProcessing}
              onClick={() => onSendMessage(prompt)}
              className={`shrink-0 rounded-sm border px-2.5 py-1 text-left transition-colors disabled:opacity-50 ${
                isDocked
                  ? lightTheme
                    ? 'border-black/15 bg-white text-stone-800 hover:border-black hover:bg-stone-50 hover:text-black'
                    : 'border-white/15 bg-white/[0.06] text-stone-200 hover:border-[#ABD1B5] hover:bg-[#ABD1B5]/15 hover:text-white'
                  : 'border-black/15 bg-white/70 text-stone-700 hover:border-black hover:bg-white hover:text-black dark:border-white/15 dark:bg-white/5 dark:text-stone-200 dark:hover:border-white dark:hover:bg-white/10'
              }`}
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      {/* Message Thread */}
      <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-4.5">
        {messages.length === 0 ? (
          <div className="flex h-full min-h-[200px] flex-col items-center justify-center p-4 text-center">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-sm border p-1 ${
                isDocked
                  ? lightTheme
                    ? 'border-black/15 bg-black/5'
                    : 'border-[#ABD1B5]/35 bg-[#14161f]'
                  : 'border-black/15 bg-black/5 dark:border-white/15 dark:bg-white/5'
              }`}
            >
              <ArchTechLogo
                variant="mark"
                tone={lightTheme ? 'black' : 'celadon'}
                className="h-6 w-6"
              />
            </div>
            <h3
              className={`mt-3 font-mono text-xs font-semibold uppercase tracking-[0.2em] ${
                isDocked
                  ? lightTheme ? 'text-stone-900' : 'text-[#EDF4ED]'
                  : 'font-serif text-xl tracking-tight text-stone-900 dark:text-stone-100'
              }`}
            >
              {emptyHeading}
            </h3>
            <p
              className={`mt-1 max-w-sm text-xs leading-relaxed ${
                isDocked
                  ? lightTheme ? 'text-stone-600' : 'text-stone-400'
                  : 'text-stone-600 dark:text-stone-400'
              }`}
            >
              {emptyDescription}
            </p>

            {isDocked && (
              <div
                className={`mt-4 w-full rounded-sm border p-3 text-left font-mono text-[10px] ${
                  lightTheme
                    ? 'border-black/10 bg-black/[0.02] text-stone-700'
                    : 'border-white/10 bg-white/[0.03] text-stone-300'
                }`}
              >
                <p className="font-semibold uppercase tracking-wider opacity-60 text-[9px] mb-2">
                  {isEs ? 'CONSULTAS DISPONIBLES:' : 'AVAILABLE INTELLIGENCE:'}
                </p>
                <ul className="space-y-1.5">
                  <li className="flex items-center gap-2">
                    <span className="h-1 w-1 rounded-full bg-[#79B791]" />
                    <span>{isEs ? 'Proyectos y masterplans en curso' : 'Active developments & masterplans'}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1 w-1 rounded-full bg-[#79B791]" />
                    <span>{isEs ? 'Avance de obra e hitos trimestrales' : 'Real-time project progress & milestones'}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1 w-1 rounded-full bg-[#79B791]" />
                    <span>{isEs ? 'Modelos BIM y especificaciones' : 'BIM coordination & specifications'}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1 w-1 rounded-full bg-[#79B791]" />
                    <span>{isEs ? 'Acceso al Portal de Clientes' : 'Client & architect portal access'}</span>
                  </li>
                </ul>
              </div>
            )}
          </div>
        ) : (
          messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 text-xs ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-sm border p-1 ${
                      isDocked
                        ? lightTheme
                          ? 'border-black/15 bg-black/5'
                          : 'border-[#ABD1B5]/35 bg-[#14161f]'
                        : 'border-black/15 bg-black/5 dark:border-white/15 dark:bg-white/5'
                    }`}
                  >
                    <ArchTechLogo
                      variant="mark"
                      tone={lightTheme ? 'black' : 'celadon'}
                      className="h-5 w-5"
                    />
                  </div>
                )}

                <div
                  className={`relative max-w-[85%] rounded-sm px-4 py-3 leading-relaxed sm:max-w-[80%] ${
                    isUser
                      ? isDocked
                        ? lightTheme
                          ? 'border border-black bg-stone-900 text-white'
                          : 'border border-white/25 bg-[#1b1e26] text-[#EDF4ED]'
                        : 'border border-black bg-black text-[#EDF4ED] dark:border-white dark:bg-white dark:text-black'
                      : isDocked
                        ? lightTheme
                          ? 'border border-black/15 bg-[#f3f1ea] text-stone-900 shadow-xs'
                          : 'border border-[#ABD1B5]/25 bg-[#12141a] text-[#EDF4ED] shadow-xs'
                        : 'border border-black/15 bg-white/80 text-stone-900 shadow-sm dark:border-white/15 dark:bg-white/5 dark:text-stone-100'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3 font-mono text-[9px] uppercase tracking-wider opacity-60">
                    <span>{isUser ? 'User' : 'Assistant'}</span>
                    <span>{msg.timestamp}</span>
                  </div>

                  <p className="mt-1.5 whitespace-pre-wrap leading-relaxed">{msg.content}</p>

                  {/* Tool Call Presentations */}
                  {msg.toolCalls && msg.toolCalls.length > 0 && (
                    <div className="mt-3 space-y-1.5 border-t border-current/10 pt-2">
                      {msg.toolCalls.map((tc, idx) => (
                        <div
                          key={idx}
                          data-testid={`ai-tool-call-${tc.toolName}`}
                          className="flex items-center justify-between rounded border border-current/15 bg-current/5 px-2.5 py-1 font-mono text-[10px]"
                        >
                          <span className="font-semibold">{tc.toolName}</span>
                          <span className="text-[9px] uppercase opacity-75">{tc.category}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* WRITE Confirmation Cards */}
                  {msg.proposal && (
                    <div
                      data-testid="ai-proposal-card"
                      className="mt-3 border-l-2 border-[#FFBF00] bg-[#FFBF00]/10 p-3 text-stone-900 dark:text-stone-100"
                    >
                      <div className="flex items-center gap-1.5 font-mono text-[9px] font-semibold uppercase tracking-wider text-[#FFBF00]">
                        <span>{writeConfirmationLabel}</span>
                      </div>
                      <p className="mt-1 font-mono text-xs font-medium">
                        {msg.proposal.toolName}
                      </p>
                      <p className="mt-0.5 text-xs text-stone-700 dark:text-stone-300">
                        {msg.proposal.description}
                      </p>

                      <div className="mt-3 flex gap-2">
                        {onConfirmProposal && (
                          <button
                            type="button"
                            onClick={() => onConfirmProposal(msg.proposal!.proposalId)}
                            className="flex items-center gap-1 rounded-sm bg-black px-3 py-1 font-mono text-[9px] uppercase tracking-wider text-white transition-colors hover:bg-stone-800 dark:bg-white dark:text-black dark:hover:bg-stone-200"
                          >
                            <Check className="h-3 w-3" />
                            <span>{confirmLabel}</span>
                          </button>
                        )}
                        {onRejectProposal && (
                          <button
                            type="button"
                            onClick={() => onRejectProposal(msg.proposal!.proposalId)}
                            className="rounded-sm border border-black/25 px-3 py-1 font-mono text-[9px] uppercase tracking-wider text-stone-700 transition-colors hover:border-black hover:text-black dark:border-white/25 dark:text-stone-300 dark:hover:border-white"
                          >
                            <span>{rejectLabel}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}

        {/* Processing / Thinking State */}
        {isProcessing && (
          <div className="flex items-center gap-3 text-xs text-stone-500">
            <div
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-sm border p-1 ${
                isDocked
                  ? lightTheme
                    ? 'border-black/15 bg-black/5'
                    : 'border-[#ABD1B5]/35 bg-[#14161f]'
                  : 'border-black/15 bg-black/5 dark:border-white/15 dark:bg-white/5'
              }`}
            >
              <ArchTechLogo
                variant="mark"
                tone={lightTheme ? 'black' : 'celadon'}
                className="h-5 w-5 animate-pulse"
              />
            </div>
            <div
              className={`flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider ${
                lightTheme ? 'text-stone-700' : 'text-stone-400'
              }`}
            >
              <span>{thinkingLabel}</span>
              <span className="flex gap-1">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:0ms]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:150ms]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:300ms]" />
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Prompt Composer */}
      <form
        onSubmit={handleSubmit}
        className={`border-t p-3 sm:p-3.5 ${
          isDocked
            ? lightTheme
              ? 'border-black/10 bg-[#f7f6f0]'
              : 'border-white/10 bg-[#0c0d11]'
            : 'border-black/15 bg-white/50 dark:bg-white/[0.03]'
        }`}
      >
        <div className="relative flex items-center">
          <input
            ref={inputRef}
            type="text"
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            disabled={isProcessing}
            placeholder={placeholder}
            className={`w-full rounded-sm border px-3.5 py-2.5 pr-12 text-xs outline-none transition-colors ${
              isDocked
                ? lightTheme
                  ? 'border-black/25 bg-white text-stone-900 placeholder:text-stone-400 focus:border-black focus:ring-1 focus:ring-black/30'
                  : 'border-white/20 bg-[#14161f] text-[#EDF4ED] placeholder:text-stone-400 focus:border-[#ABD1B5] focus:ring-1 focus:ring-[#ABD1B5]/30'
                : 'border-black/20 bg-white text-stone-900 placeholder:text-stone-400 focus:border-black dark:border-white/20 dark:bg-black/40 dark:text-stone-100 dark:focus:border-white'
            }`}
          />
          <button
            type="submit"
            disabled={isProcessing || !inputPrompt.trim()}
            aria-label={sendLabel}
            className={`absolute right-1.5 flex h-7 w-7 items-center justify-center rounded-sm transition-opacity hover:opacity-90 disabled:opacity-30 ${
              isDocked
                ? lightTheme
                  ? 'bg-black text-white hover:bg-stone-800'
                  : 'bg-[#ABD1B5] text-black hover:bg-[#c2e2ca]'
                : 'bg-black text-white dark:bg-white dark:text-black'
            }`}
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
      </form>
    </div>
  );
};
