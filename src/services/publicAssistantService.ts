import type { AIMessage } from '../types/bim';
import { aiService } from './aiService';
import type { PresentationAssistantContext } from '../presentation/componentRegistry';

export class PublicAssistantService {
  private messages: AIMessage[] = [];
  private listeners = new Set<(messages: AIMessage[]) => void>();

  getHistory(): AIMessage[] {
    return [...this.messages];
  }

  clearHistory(): void {
    this.messages = [];
    this.notify();
  }

  subscribe(listener: (messages: AIMessage[]) => void): () => void {
    this.listeners.add(listener);
    listener(this.getHistory());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    const copy = this.getHistory();
    this.listeners.forEach((listener) => listener(copy));
  }

  async sendMessage(
    prompt: string,
    locale: 'en' | 'es' = 'en',
    presentationContext?: PresentationAssistantContext,
  ): Promise<AIMessage> {
    const trimmed = prompt.trim();
    if (!trimmed) {
      throw new Error('Prompt cannot be empty');
    }

    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg: AIMessage = {
      id: `pub-user-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      role: 'user',
      content: trimmed,
      timestamp,
    };
    this.messages.push(userMsg);
    this.notify();

    const unavailableCopy =
      locale === 'es'
        ? 'El servicio del asistente no está disponible en este momento. Por favor intente más tarde o comuníquese directamente con nuestro equipo.'
        : 'The assistant service is currently unavailable. Please check back shortly or contact our team directly.';
    const presentationFallback = presentationContext?.currentComponent
      ? `${presentationContext.currentComponent.label}: ${presentationContext.currentComponent.assistantContext}`
      : unavailableCopy;

    if (!aiService.isConfigured()) {
      const fallbackMsg: AIMessage = {
        id: `pub-asst-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        role: 'assistant',
        content: presentationFallback,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      this.messages.push(fallbackMsg);
      this.notify();
      return fallbackMsg;
    }

    try {
      const response = await aiService.generateResponse({
        userPrompt: trimmed,
        messages: this.messages,
        tools: [],
        context: {},
        locale,
        role: 'public',
        route: '/',
        presentationContext,
      });

      const assistantMsg: AIMessage = {
        id: `pub-asst-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        role: 'assistant',
        content: response.message,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      this.messages.push(assistantMsg);
      this.notify();
      return assistantMsg;
    } catch {
      const fallbackMsg: AIMessage = {
        id: `pub-asst-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        role: 'assistant',
        content: presentationFallback,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      this.messages.push(fallbackMsg);
      this.notify();
      return fallbackMsg;
    }
  }
}

export const publicAssistant = new PublicAssistantService();
