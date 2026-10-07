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
  emptyHeading = 'How can the assistant help today?',
  emptyDescription = 'Ask about developments, project milestones, documents or design coordination.',
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

  return (
    <div
      className={`garnier-chat-shell flex flex-col border border-black/15 bg-[var(--portal-surface,#ffffff)] text-[var(--portal-text,#000000)] ${
        isDocked ? 'h-full shadow-2xl rounded-sm' : 'min-h-[520px] rounded-sm'
      } ${className}`}
    >
      {/* Assistant Header */}
      <header className="flex items-center justify-between border-b border-black/15 px-4 py-3.5 sm:px-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm border border-black/15 bg-black/5 p-1.5 dark:bg-white/5">
            <ArchTechLogo variant="mark" tone="celadon" className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-inherit">
                {title}
              </span>
              <span
                className={`inline-block h-2 w-2 rounded-full ${
                  isOnline ? 'bg-[#79B791]' : 'bg-[#FFBF00]'
                }`}
                title={statusLabel}
                aria-label={statusLabel}
              />
            </div>
            <p className="font-mono text-[10px] tracking-wide text-stone-500 dark:text-stone-400">
              {subtitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono text-[10px]">
          {statusLabel && (
            <span className="hidden items-center gap-1 border border-black/10 bg-black/[0.03] px-2 py-0.5 text-[9px] uppercase tracking-wider text-stone-600 sm:inline-flex dark:border-white/10 dark:text-stone-300">
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
              className="flex items-center gap-1 rounded-sm border border-black/15 px-2 py-1 uppercase tracking-wider text-stone-600 transition-colors hover:border-black hover:text-black dark:border-white/20 dark:text-stone-300 dark:hover:border-white dark:hover:text-white"
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
              className="flex h-7 w-7 items-center justify-center rounded-sm border border-black/15 text-stone-600 transition-colors hover:border-black hover:text-black dark:border-white/20 dark:text-stone-300"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </header>

      {/* Quick Suggestions Chips */}
      {quickPrompts.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto border-b border-black/10 bg-black/[0.02] px-4 py-2 text-[10px] font-mono scrollbar-none sm:px-5 dark:bg-white/[0.02]">
          {quickPromptsLabel && (
            <span className="shrink-0 uppercase tracking-widest text-stone-500 dark:text-stone-400">
              {quickPromptsLabel}
            </span>
          )}
          {quickPrompts.map((prompt, idx) => (
            <button
              key={idx}
              type="button"
              disabled={isProcessing}
              onClick={() => onSendMessage(prompt)}
              className="shrink-0 rounded-sm border border-black/15 bg-white/70 px-2.5 py-1 text-left text-stone-700 transition-colors hover:border-black hover:bg-white hover:text-black disabled:opacity-50 dark:border-white/15 dark:bg-white/5 dark:text-stone-200 dark:hover:border-white dark:hover:bg-white/10"
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      {/* Message Thread */}
      <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-5">
        {messages.length === 0 ? (
          <div className="flex h-full min-h-[220px] flex-col items-center justify-center p-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-sm border border-black/15 bg-black/5 dark:border-white/15 dark:bg-white/5">
              <ArchTechLogo variant="mark" tone="celadon" className="h-8 w-8" />
            </div>
            <h3 className="mt-4 font-serif text-xl tracking-tight text-stone-900 dark:text-stone-100">
              {emptyHeading}
            </h3>
            <p className="mt-1.5 max-w-sm text-xs leading-relaxed text-stone-600 dark:text-stone-400">
              {emptyDescription}
            </p>
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
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-sm border border-black/15 bg-black/5 p-1 dark:border-white/15 dark:bg-white/5">
                    <ArchTechLogo variant="mark" tone="celadon" className="h-5 w-5" />
                  </div>
                )}

                <div
                  className={`relative max-w-[85%] rounded-sm px-4 py-3 leading-relaxed sm:max-w-[78%] ${
                    isUser
                      ? 'border border-black bg-black text-[#EDF4ED] dark:border-white dark:bg-white dark:text-black'
                      : 'border border-black/15 bg-white/80 text-stone-900 shadow-sm dark:border-white/15 dark:bg-white/5 dark:text-stone-100'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3 font-mono text-[9px] uppercase tracking-wider opacity-60">
                    <span>{isUser ? 'User' : 'Assistant'}</span>
                    <span>{msg.timestamp}</span>
                  </div>

                  <p className="mt-1.5 whitespace-pre-wrap">{msg.content}</p>

                  {/* Tool Call Presentations */}
                  {msg.toolCalls && msg.toolCalls.length > 0 && (
                    <div className="mt-3 space-y-1.5 border-t border-black/10 pt-2 dark:border-white/10">
                      {msg.toolCalls.map((tc, idx) => (
                        <div
                          key={idx}
                          data-testid={`ai-tool-call-${tc.toolName}`}
                          className="flex items-center justify-between rounded border border-black/15 bg-black/5 px-2.5 py-1 font-mono text-[10px] text-stone-700 dark:border-white/15 dark:bg-white/5 dark:text-stone-300"
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
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-sm border border-black/15 bg-black/5 p-1 dark:border-white/15 dark:bg-white/5">
              <ArchTechLogo variant="mark" tone="celadon" className="h-5 w-5 animate-pulse" />
            </div>
            <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-stone-600 dark:text-stone-400">
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
        className="border-t border-black/15 bg-white/50 p-3 sm:p-4 dark:bg-white/[0.03]"
      >
        <div className="relative flex items-center">
          <input
            ref={inputRef}
            type="text"
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            disabled={isProcessing}
            placeholder={placeholder}
            className="w-full rounded-sm border border-black/20 bg-white px-3.5 py-2.5 pr-14 text-xs text-stone-900 outline-none transition-colors placeholder:text-stone-400 focus:border-black dark:border-white/20 dark:bg-black/40 dark:text-stone-100 dark:focus:border-white"
          />
          <button
            type="submit"
            disabled={isProcessing || !inputPrompt.trim()}
            aria-label={sendLabel}
            className="absolute right-1.5 flex h-7 w-7 items-center justify-center rounded-sm bg-black text-white transition-opacity hover:opacity-90 disabled:opacity-30 dark:bg-white dark:text-black"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
      </form>
    </div>
  );
};
