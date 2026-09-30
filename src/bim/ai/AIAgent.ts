import { useBimStore } from '@/stores/bimStore';
import {
  AIMessage,
  ConversationContext,
  PendingWriteProposal,
} from '@/types/bim';
import { ToolRegistry } from './ToolRegistry';
import { AIProvider, RuleBasedProvider } from './providers/RuleBasedProvider';

export class AIAgent {
  private static instance: AIAgent;
  private provider: AIProvider;
  private messages: AIMessage[] = [];
  private listeners: Set<(messages: AIMessage[]) => void> = new Set();

  private constructor() {
    this.provider = new RuleBasedProvider();
    ToolRegistry.initDefaultTools();

    // Default welcome message
    this.messages = [
      {
        id: 'msg-welcome',
        role: 'assistant',
        content:
          'Hello! I am your AI BIM Assistant. I can inspect model elements, calculate quantities, isolate categories, and prepare non-destructive edits with strict confirmation safeguards. What would you like to explore?',
        timestamp: new Date().toLocaleTimeString(),
      },
    ];
  }

  public static getInstance(): AIAgent {
    if (!AIAgent.instance) {
      AIAgent.instance = new AIAgent();
    }
    return AIAgent.instance;
  }

  public setProvider(provider: AIProvider): void {
    this.provider = provider;
  }

  public getProvider(): AIProvider {
    return this.provider;
  }

  public getMessages(): AIMessage[] {
    return [...this.messages];
  }

  public subscribe(listener: (messages: AIMessage[]) => void): () => void {
    this.listeners.add(listener);
    listener(this.getMessages());
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    const msgs = this.getMessages();
    this.listeners.forEach((l) => l(msgs));
  }

  private getActiveContext(): ConversationContext {
    const state = useBimStore.getState();
    return {
      modelLoaded: !!state.modelMetadata,
      modelName: state.modelMetadata?.name,
      selectedElementId: state.selectedElement?.expressID,
      selectedElementName: state.selectedElement?.name,
      totalElements: state.modelMetadata?.elementCount,
      changeSetCount: state.changeSet.length,
    };
  }

  /**
   * Processes a natural language user query.
   * READ actions execute directly.
   * WRITE actions produce a pending confirmation proposal.
   */
  public async sendMessage(content: string): Promise<AIMessage> {
    const userMsg: AIMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date().toLocaleTimeString(),
    };

    this.messages.push(userMsg);
    this.notify();

    const context = this.getActiveContext();
    const providerResponse = await this.provider.generateResponse(
      content,
      this.messages,
      ToolRegistry.getAllTools(),
      context
    );

    let proposal: PendingWriteProposal | undefined;
    const executedToolCalls: any[] = [];

    if (providerResponse.toolCalls && providerResponse.toolCalls.length > 0) {
      for (const call of providerResponse.toolCalls) {
        const toolDef = ToolRegistry.getTool(call.toolName);
        if (!toolDef) continue;

        if (toolDef.category === 'READ') {
          // Direct execution for READ tools
          const result = await ToolRegistry.executeTool(call.toolName, call.args, false);
          executedToolCalls.push({
            toolName: call.toolName,
            category: 'READ',
            args: call.args,
            result: result.data || result.error,
          });
        } else {
          // Intercept WRITE tools: generate proposal requiring user confirmation
          const result = await ToolRegistry.executeTool(call.toolName, call.args, false);
          if (result.proposal) {
            proposal = result.proposal;
            executedToolCalls.push({
              toolName: call.toolName,
              category: 'WRITE',
              args: call.args,
              result: 'Pending user confirmation',
            });
          }
        }
      }
    }

    const assistantMsg: AIMessage = {
      id: `asst-${Date.now()}`,
      role: 'assistant',
      content: providerResponse.message,
      timestamp: new Date().toLocaleTimeString(),
      toolCalls: executedToolCalls.length > 0 ? executedToolCalls : undefined,
      proposal,
    };

    this.messages.push(assistantMsg);
    this.notify();
    return assistantMsg;
  }

  /**
   * Confirms and executes a pending WRITE action proposal.
   */
  public async confirmProposal(proposalId: string): Promise<boolean> {
    const msg = this.messages.find((m) => m.proposal && m.proposal.proposalId === proposalId);
    if (!msg || !msg.proposal || msg.proposal.status !== 'pending') return false;

    const { toolName, args, summary } = msg.proposal;
    msg.proposal.status = 'confirmed';
    this.notify();

    // Execute through ToolRegistry with confirmed=true
    const result = await ToolRegistry.executeTool(toolName, args, true);

    if (result.success) {
      msg.proposal.status = 'executed';
      this.messages.push({
        id: `sys-${Date.now()}`,
        role: 'system',
        content: `Confirmed & Executed: ${summary}. Change recorded into active Change Set.`,
        timestamp: new Date().toLocaleTimeString(),
      });
    } else {
      this.messages.push({
        id: `sys-${Date.now()}`,
        role: 'system',
        content: `Failed to execute: ${result.error}`,
        timestamp: new Date().toLocaleTimeString(),
      });
    }

    this.notify();
    return result.success;
  }

  /**
   * Rejects/cancels a pending WRITE action proposal.
   */
  public rejectProposal(proposalId: string): boolean {
    const msg = this.messages.find((m) => m.proposal && m.proposal.proposalId === proposalId);
    if (!msg || !msg.proposal || msg.proposal.status !== 'pending') return false;

    msg.proposal.status = 'rejected';
    this.messages.push({
      id: `sys-${Date.now()}`,
      role: 'system',
      content: `Cancelled: ${msg.proposal.summary}`,
      timestamp: new Date().toLocaleTimeString(),
    });

    this.notify();
    return true;
  }

  /**
   * Clears the chat history.
   */
  public clearHistory(): void {
    this.messages = [
      {
        id: 'msg-welcome',
        role: 'assistant',
        content:
          'Chat history cleared. I am ready for your next BIM query or edit command.',
        timestamp: new Date().toLocaleTimeString(),
      },
    ];
    this.notify();
  }
}

export const bimAgent = AIAgent.getInstance();
