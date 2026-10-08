import type { AIMessage, ConversationContext, ToolDefinition } from '../types/bim';
import type { AIProviderResponse } from '../bim/ai/providers/RuleBasedProvider';
import { getApiBaseUrl } from './apiClient';
import type { PresentationAssistantContext } from '../presentation/componentRegistry';

export type RemoteAIRequest = {
  userPrompt: string;
  messages: AIMessage[];
  tools: ToolDefinition[];
  context: ConversationContext;
  locale: 'en' | 'es';
  role?: string;
  route?: string;
  projectId?: string;
  presentationContext?: PresentationAssistantContext;
};

export interface RemoteAIResponsePayload {
  message?: string;
  toolCalls?: AIProviderResponse['toolCalls'];
  toolRequest?: AIProviderResponse['toolCalls'];
  success?: boolean;
  error?: string | null;
}

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

    let response: Response;
    try {
      response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(25000),
      });
    } catch (err: unknown) {
      const error = err as { name?: string; message?: string } | undefined;
      if (error?.name === 'TimeoutError' || error?.name === 'AbortError') {
        throw new AIServiceError('Remote AI request timed out.');
      }
      throw new AIServiceError(`Network error communicating with AI service: ${error?.message || 'Connection failed'}`);
    }

    if (!response.ok) {
      throw new AIServiceError(`Remote AI failed with status ${response.status}.`);
    }

    let rawData: unknown;
    try {
      rawData = await response.json();
    } catch {
      throw new AIServiceError('Remote AI returned a malformed response.');
    }

    if (!rawData || typeof rawData !== 'object') {
      throw new AIServiceError('Remote AI returned an empty response.');
    }

    const body = rawData as RemoteAIResponsePayload;

    if (body.error) {
      throw new AIServiceError(String(body.error));
    }

    if (typeof body.message !== 'string' || !body.message.trim()) {
      throw new AIServiceError('Remote AI returned an invalid structured response.');
    }

    const toolCalls = Array.isArray(body.toolCalls)
      ? body.toolCalls
      : Array.isArray(body.toolRequest)
        ? body.toolRequest
        : undefined;

    return {
      message: body.message.trim(),
      toolCalls,
    };
  },
  async healthCheck(): Promise<boolean> {
    const webhookUrl = getWebhookUrl();
    if (!webhookUrl) return Boolean(getApiBaseUrl());
    try {
      const healthUrl = webhookUrl.replace(/\/webhook\/[^/?#]+/, '/webhook/garnier-assistant-health');
      const response = await fetch(healthUrl, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(5000),
      });
      if (response.ok) {
        const data = (await response.json()) as { success?: boolean; status?: string };
        return Boolean(data.success && data.status === 'ok');
      }
      return false;
    } catch {
      return false;
    }
  },
};
