import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Sparkles,
  Send,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Bot,
  User,
  Cpu,
  Check,
  X,
} from 'lucide-react';
import { bimAgent } from '@/bim/ai/AIAgent';
import { AIMessage, PendingWriteProposal } from '@/types/bim';
import { aiService } from '@/services/aiService';

export const AiAssistantPanel: React.FC = () => {
  const { t } = useTranslation(['ai', 'workspace']);
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = bimAgent.subscribe((msgs) => {
      setMessages(msgs);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || inputPrompt).trim();
    if (!text || isProcessing) return;

    setInputPrompt('');
    setIsProcessing(true);
    try {
      await bimAgent.sendMessage(text);
    } catch (err) {
      console.error('AI message handling error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  };

  const handleConfirmProposal = async (proposalId: string) => {
    await bimAgent.confirmProposal(proposalId);
  };

  const handleRejectProposal = (proposalId: string) => {
    bimAgent.rejectProposal(proposalId);
  };

  const handleClearHistory = () => {
    bimAgent.clearHistory();
  };

  const quickPrompts = [
    'Preview 10x8m 2-storey building, 3m height per storey',
    'Discard preview',
    'Commit to model',
    'Select slab #44',
    'Show properties of #44',
    'Calculate model quantities',
    'Isolate walls',
    'Move #44 by 1m in X',
    'Rotate #44 by 45 deg',
    'Color #44 cyan',
    'Show all elements',
  ];

  return (
    <div className="flex-1 flex flex-col h-full bg-[#12141a] text-xs select-none overflow-hidden">
      {/* Header */}
      <div className="p-2.5 border-b border-[#222630] flex items-center justify-between bg-[#151720]">
        <div className="flex items-center space-x-2">
          <div className="p-1 rounded-md bg-purple-950/80 border border-purple-800 text-purple-400">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="font-semibold text-slate-200 text-[11px] flex items-center space-x-1.5">
              <span>{t('ai:bimAiAssistant', 'BIM AI Assistant')}</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-950 text-purple-300 border border-purple-800/80">
                {t('ai:phaseBadge', 'Phase 6B.1')}
              </span>
            </div>
            <div className="text-[10px] text-slate-400 flex items-center space-x-1">
              <Cpu className="w-2.5 h-2.5 text-emerald-400" />
              <span>{aiService.isConfigured() ? t('ai:remoteEngine', 'Remote n8n / offline fallback') : t('ai:offlineEngine', 'Offline Deterministic Engine')}</span>
            </div>
          </div>
        </div>

        <button
          onClick={handleClearHistory}
          data-testid="ai-btn-clear"
          className="p-1.5 rounded hover:bg-[#1e2330] text-slate-400 hover:text-slate-200 transition"
          title={t('ai:clearHistoryTooltip', 'Clear Conversation History')}
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>

      {/* Quick Prompt Chips */}
      <div className="p-2 border-b border-[#222630] bg-[#0f1117] overflow-x-auto flex space-x-1.5 shrink-0 scrollbar-none">
        {quickPrompts.map((qp, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(qp)}
            data-testid={`ai-chip-${idx}`}
            className="px-2 py-1 rounded-full bg-[#171b26] hover:bg-[#212636] border border-[#2b3345] text-[10px] text-slate-300 whitespace-nowrap transition"
          >
            {qp}
          </button>
        ))}
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.map((msg) => (
          <div key={msg.id} className="space-y-1.5">
            {/* User Message */}
            {msg.role === 'user' && (
              <div className="flex justify-end">
                <div
                  data-testid="ai-message-user"
                  className="max-w-[85%] rounded-2xl rounded-tr-sm bg-purple-700/80 border border-purple-600/70 p-2.5 text-purple-50 text-[11px] shadow-sm leading-relaxed"
                >
                  <div className="flex items-center space-x-1 text-[9px] text-purple-200 mb-1 opacity-80">
                    <User className="w-2.5 h-2.5" />
                    <span>{t('ai:userTimestamp', 'User • {{time}}', { time: msg.timestamp })}</span>
                  </div>
                  <div>{msg.content}</div>
                </div>
              </div>
            )}

            {/* Assistant Message */}
            {msg.role === 'assistant' && (
              <div className="flex justify-start">
                <div
                  data-testid="ai-message-assistant"
                  className="max-w-[90%] rounded-2xl rounded-tl-sm bg-[#161a24] border border-[#272f42] p-3 text-slate-200 text-[11px] shadow-sm leading-relaxed space-y-2"
                >
                  <div className="flex items-center space-x-1 text-[9px] text-purple-400 font-medium">
                    <Bot className="w-2.5 h-2.5" />
                    <span>{t('ai:assistantTimestamp', 'AI Assistant • {{time}}', { time: msg.timestamp })}</span>
                  </div>

                  <div className="whitespace-pre-line text-slate-300">{msg.content}</div>

                  {/* Tool Call Badges */}
                  {msg.toolCalls && msg.toolCalls.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      {msg.toolCalls.map((tc, tidx) => (
                        <div
                          key={tidx}
                          data-testid={`ai-tool-call-${tc.toolName}`}
                          className={`p-2 rounded-lg border text-[10px] ${
                            tc.category === 'READ'
                              ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-200'
                              : 'bg-amber-950/40 border-amber-800/60 text-amber-200'
                          }`}
                        >
                          <div className="flex items-center justify-between font-mono font-semibold">
                            <span className="flex items-center space-x-1.5">
                              <span
                                className={`px-1 py-0.5 rounded text-[8px] font-bold ${
                                  tc.category === 'READ'
                                    ? 'bg-emerald-900/80 text-emerald-300'
                                    : 'bg-amber-900/80 text-amber-300'
                                }`}
                              >
                                {tc.category}
                              </span>
                              <span>{tc.toolName}</span>
                            </span>
                            <span className="text-[9px] opacity-75 font-sans">
                              {tc.category === 'READ' ? t('ai:toolExecuted', 'Executed') : t('ai:toolProposalCreated', 'Proposal created')}
                            </span>
                          </div>

                          {/* Compact Tool Result */}
                          {tc.result && tc.category === 'READ' && (
                            <div
                              data-testid={`ai-tool-result-${tc.toolName}`}
                              className="mt-1.5 pt-1.5 border-t border-emerald-800/40 font-mono text-[9px] text-emerald-300/90 whitespace-pre-wrap max-h-24 overflow-y-auto"
                            >
                              {typeof tc.result === 'string'
                                ? tc.result
                                : JSON.stringify(tc.result, null, 2)}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Proposal Confirmation Card */}
                  {msg.proposal && (
                    <ProposalCard
                      proposal={msg.proposal}
                      onConfirm={() => handleConfirmProposal(msg.proposal!.proposalId)}
                      onReject={() => handleRejectProposal(msg.proposal!.proposalId)}
                    />
                  )}
                </div>
              </div>
            )}

            {/* System / Tool Result Message */}
            {msg.role === 'system' && (
              <div className="flex justify-center my-1">
                <div
                  data-testid="ai-message-system"
                  className="px-2.5 py-1 rounded bg-[#10131c] border border-[#212738] text-slate-400 text-[10px] flex items-center space-x-1.5"
                >
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span>{msg.content}</span>
                </div>
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div className="p-2 border-t border-[#222630] bg-[#141720]">
        <div className="flex items-center space-x-1.5 bg-[#0e1017] border border-[#293144] focus-within:border-purple-500 rounded-lg px-2.5 py-1 transition">
          <input
            type="text"
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            data-testid="ai-chat-input"
            placeholder={t('ai:chatPlaceholder', "Ask AI e.g. 'Move #44 by 1m in X'...")}
            className="flex-1 bg-transparent text-slate-200 placeholder-slate-500 text-[11px] focus:outline-none py-1"
          />
          <button
            onClick={() => handleSend()}
            disabled={!inputPrompt.trim() || isProcessing}
            data-testid="ai-chat-send"
            className="p-1 rounded bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white transition"
          >
            <Send className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};

interface ProposalCardProps {
  proposal: PendingWriteProposal;
  onConfirm: () => void;
  onReject: () => void;
}

const ProposalCard: React.FC<ProposalCardProps> = ({ proposal, onConfirm, onReject }) => {
  const { t } = useTranslation(['ai', 'workspace']);
  const isPending = proposal.status === 'pending';
  const isExecuted = proposal.status === 'executed';
  const isRejected = proposal.status === 'rejected';

  return (
    <div
      data-testid="ai-proposal-card"
      className="mt-2 p-2.5 rounded-lg bg-[#11131c] border border-amber-600/60 shadow-lg space-y-2"
    >
      <div className="flex items-center justify-between border-b border-amber-800/40 pb-1.5">
        <div className="flex items-center space-x-1.5 text-amber-400 font-semibold text-[10px]">
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>{t('ai:writeActionConfirmation', 'WRITE ACTION CONFIRMATION')}</span>
        </div>
        <span className="font-mono text-[9px] uppercase px-1 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-800">
          {proposal.toolName}
        </span>
      </div>

      <div className="text-slate-200 font-medium text-[11px]">{proposal.summary}</div>
      <div className="text-slate-400 text-[10px]">{proposal.description}</div>

      {isPending && (
        <div className="flex items-center justify-end space-x-1.5 pt-1">
          <button
            onClick={onReject}
            data-testid="ai-reject-write"
            className="flex items-center space-x-1 px-2.5 py-1 rounded bg-[#1c202a] hover:bg-[#252b39] text-slate-300 border border-[#2c3345] text-[10px] transition"
          >
            <X className="w-3 h-3 text-rose-400" />
            <span>{t('workspace:cancel', 'Cancel')}</span>
          </button>
          <button
            onClick={onConfirm}
            data-testid="ai-confirm-write"
            className="flex items-center space-x-1 px-3 py-1 rounded bg-amber-600 hover:bg-amber-500 text-white font-medium text-[10px] shadow transition"
          >
            <Check className="w-3 h-3" />
            <span>{t('ai:confirmAndApply', 'Confirm & Apply')}</span>
          </button>
        </div>
      )}

      {isExecuted && (
        <div className="flex items-center space-x-1.5 text-emerald-400 text-[10px] font-medium pt-1">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>{t('ai:executedAndRecorded', 'Executed & Recorded in Change Set')}</span>
        </div>
      )}

      {isRejected && (
        <div className="flex items-center space-x-1.5 text-slate-500 text-[10px] font-medium pt-1">
          <XCircle className="w-3.5 h-3.5" />
          <span>{t('ai:actionCancelled', 'Action Cancelled')}</span>
        </div>
      )}
    </div>
  );
};
