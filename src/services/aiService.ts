import type { AIMessage, ConversationContext, ToolDefinition } from '../types/bim';
import type { AIProviderResponse } from '../bim/ai/providers/RuleBasedProvider';
import { getApiBaseUrl } from './apiClient';

export type RemoteAIRequest = {
  userPrompt: string;
  messages: AIMessage[];
  tools: ToolDefinition[];
  context: ConversationContext;
};

export class AIServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AIServiceError';
  }
}

const getWebhookUrl = () => (import.meta.env.VITE_N8N_AI_WEBHOOK_URL ?? '').trim();

export const aiService = {
  isConfigured: () => Boolean(getWebhookUrl()),
  async generateResponse(payload: RemoteAIRequest): Promise<AIProviderResponse> {
    const webhookUrl = getWebhookUrl();
    if (!webhookUrl) throw new AIServiceError('Remote AI is not configured.');
    const response = await fetch(webhookUrl, { method: 'POST', headers: { Accept: 'application/json', 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (!response.ok) throw new AIServiceError(`Remote AI failed with status ${response.status}.`);
    const body = await response.json() as Partial<AIProviderResponse>;
    if (typeof body.message !== 'string') throw new AIServiceError('Remote AI returned an invalid structured response.');
    return { message: body.message, toolCalls: Array.isArray(body.toolCalls) ? body.toolCalls : undefined };
  },
  async healthCheck(): Promise<boolean> {
    return Boolean(getWebhookUrl() || getApiBaseUrl());
  },
};
