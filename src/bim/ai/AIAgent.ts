import {
  AIMessage,
  BimAnalysisData,
  ConversationContext,
  PendingWriteProposal,
} from '@/types/bim';
import { ToolRegistry } from '@/bim/ai/ToolRegistry';
import { AIProvider, RuleBasedProvider } from '@/bim/ai/providers/RuleBasedProvider';
import { useBimStore } from '@/stores/bimStore';
import { aiService } from '@/services/aiService';
import { getStoredLocale } from '@/portal/locale';
import { portalAuth } from '@/portal/demoAuth';

export class AIAgent {
  private static instance: AIAgent;
  private provider: AIProvider;
  private messages: AIMessage[] = [];
  private listeners: Set<(messages: AIMessage[]) => void> = new Set();

  private constructor() {
    this.provider = new RuleBasedProvider();
    ToolRegistry.initDefaultTools();
    this.messages = [
      {
        id: 'msg-welcome',
        role: 'assistant',
        content:
          '👋 Hello! I am your BIM Lab AI Assistant. You can ask me to inspect properties, query elements, calculate takeoffs, or propose non-destructive model modifications (moves, rotations, colors, deletes).',
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
   * Formats READ tool results into clean, user-visible summaries.
   */
  private formatReadResult(toolName: string, args: Record<string, any>, result: any): string {
    if (!result.success) {
      return `⚠️ ${result.error || 'Execution failed.'}`;
    }

    const data = result.data;
    switch (toolName) {
      case 'calculate_quantities': {
        if (!data) return 'No quantities available.';
        const a: BimAnalysisData = data.analysis || data;
        const q = a.quantities || ({} as any);
        const breakdown = a.categoryCounts
          ? Object.entries(a.categoryCounts)
              .map(([k, v]) => `${k}: ${v}`)
              .join(', ')
          : '';
        const lines = [
          `📊 Model Breakdown:`,
          a.totalElements !== undefined ? `• Total Elements: ${a.totalElements}` : null,
          a.totalStoreys !== undefined ? `• Storeys: ${a.totalStoreys}` : null,
          q.totalVolume !== undefined ? `• Total Volume: ${Number(q.totalVolume).toFixed(2)} m³` : null,
          q.totalWallGrossArea !== undefined ? `• Wall Gross Area: ${Number(q.totalWallGrossArea).toFixed(2)} m²` : null,
          q.totalWallNetArea !== undefined ? `• Wall Net Area: ${Number(q.totalWallNetArea).toFixed(2)} m²` : null,
          q.totalSlabArea !== undefined ? `• Slab Area: ${Number(q.totalSlabArea).toFixed(2)} m²` : null,
          q.totalDoorsCount !== undefined || q.totalWindowsCount !== undefined || q.totalSpacesCount !== undefined
            ? `• Doors: ${q.totalDoorsCount ?? 0} | Windows: ${q.totalWindowsCount ?? 0} | Spaces: ${q.totalSpacesCount ?? 0}`
            : null,
          breakdown ? `• Categories: ${breakdown}` : null,
        ].filter(Boolean);
        return lines.join('\n');
      }

      case 'get_element_properties': {
        if (!data) return 'No element properties returned.';
        const lines = [
          `🔍 Properties for Element #${data.expressID} (${data.type}):`,
          `• Name: ${data.name || 'Unnamed'}`,
          data.globalId ? `• GlobalId: ${data.globalId}` : null,
          data.storey ? `• Storey: ${data.storey}` : null,
        ].filter(Boolean);

        if (data.propertyGroups && data.propertyGroups.length > 0) {
          lines.push(`• Property Sets:`);
          for (const grp of data.propertyGroups.slice(0, 3)) {
            const propsStr = (grp.properties || [])
              .slice(0, 3)
              .map((p: any) => `${p.name}: ${p.value}`)
              .join(', ');
            lines.push(`  - [${grp.name}]: ${propsStr || 'empty'}`);
          }
        }
        return lines.join('\n');
      }

      case 'query_elements': {
        if (!data || data.totalFound === 0) {
          return `🔎 Found 0 elements matching query.`;
        }
        const lines = [`🔎 Found ${data.totalFound} matching element(s):`];
        for (const e of (data.elements || []).slice(0, 8)) {
          lines.push(`• #${e.id}: ${e.name || e.type} (${e.category || e.type}${e.storey ? ` @ ${e.storey}` : ''})`);
        }
        if (data.totalFound > 8) {
          lines.push(`... and ${data.totalFound - 8} more`);
        }
        return lines.join('\n');
      }

      case 'select_element':
        return `✅ Selected element #${args.elementId} in 3D viewport.`;

      case 'select_category':
        return `✅ Selected ${data.selectedCount} ${args.category} elements in 3D viewport.`;

      case 'isolate_category':
        return `✅ Isolated ${data.isolatedCount} ${args.category} elements in 3D viewport.`;

      case 'hide_element':
        return `👁️ Hid element #${args.elementId} in 3D viewport.`;

      case 'hide_category':
        return `👁️ Hid ${data.hiddenCount} ${args.category} elements in 3D viewport.`;

      case 'show_all':
        return `👁️ Restored visibility for all elements in 3D viewport.`;

      case 'fit_view':
        return `🎯 Camera fitted to model.`;

      case 'undo':
        return `↩️ ${data.message || 'Undo applied.'}`;

      case 'redo':
        return `↪️ ${data.message || 'Redo applied.'}`;

      case 'export_changes':
        return `💾 ${data.message || 'Changes exported.'}`;

      case 'preview_generation': {
        const plan = data.plan;
        if (!plan) return data.message || '3D generation preview rendered.';
        const p = plan.params;
        const lines = [
          `🏗️ BIM Generation Preview:`,
          `• Dimensions: ${p.length}m × ${p.width}m`,
          `• Height: ${p.totalHeight}m (${p.storeys} storey${p.storeys > 1 ? 's' : ''}, ${p.storeyHeight}m/storey)`,
          `• Elements: ${plan.walls.length} walls, ${plan.slabs.length} slabs`,
          `• Footprint Area: ${p.footprintArea.toFixed(2)} m²`,
          `• Gross Volume: ${p.grossVolume.toFixed(2)} m³`,
          `💡 Non-destructive 3D preview overlay rendered. (No IFC or Change Set changes).`,
        ];
        return lines.join('\n');
      }

      case 'discard_generation_preview':
        return `🗑️ ${data.message || 'Generation preview overlay cleared.'}`;

      default:
        return typeof data === 'string' ? data : JSON.stringify(data);
    }
  }

  /**
   * Processes a natural language user query.
   * READ actions execute directly.
   * WRITE actions produce a pending confirmation proposal.
   */
  public async sendMessage(
    content: string,
    options?: { locale?: 'en' | 'es'; role?: string; route?: string; projectId?: string }
  ): Promise<AIMessage> {
    const userMsg: AIMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date().toLocaleTimeString(),
    };

    this.messages.push(userMsg);
    this.notify();

    const context = this.getActiveContext();
    const locale = options?.locale ?? getStoredLocale();
    const role = options?.role ?? portalAuth.getSession()?.role ?? undefined;
    const route = options?.route ?? (typeof window !== 'undefined' ? window.location.pathname : undefined);
    const projectId =
      options?.projectId ??
      (typeof window !== 'undefined'
        ? window.location.pathname.match(/\/portal\/project\/([^/?#]+)/)?.[1]
        : undefined);

    let providerResponse;
    if (aiService.isConfigured()) {
      try {
        providerResponse = await aiService.generateResponse({
          userPrompt: content,
          messages: this.messages,
          tools: ToolRegistry.getAllTools(),
          context,
          locale,
          role,
          route,
          projectId,
        });
      } catch {
        const fallback = await this.provider.generateResponse(content, this.messages, ToolRegistry.getAllTools(), context);
        providerResponse = { ...fallback, message: `${fallback.message}\n\nRemote AI unavailable; deterministic fallback used.` };
      }
    } else {
      providerResponse = await this.provider.generateResponse(content, this.messages, ToolRegistry.getAllTools(), context);
    }

    let proposal: PendingWriteProposal | undefined;
    const executedToolCalls: any[] = [];
    const readSummaries: string[] = [];

    if (providerResponse.toolCalls && providerResponse.toolCalls.length > 0) {
      for (const call of providerResponse.toolCalls) {
        const toolDef = ToolRegistry.getTool(call.toolName);
        if (!toolDef) continue;

        const isWrite = ToolRegistry.isWriteAction(call.toolName, call.args);

        if (!isWrite) {
          // Direct execution for READ tools
          const result = await ToolRegistry.executeTool(call.toolName, call.args, false);
          const formatted = this.formatReadResult(call.toolName, call.args, result);
          if (formatted) {
            readSummaries.push(formatted);
          }

          executedToolCalls.push({
            toolName: call.toolName,
            category: 'READ',
            args: call.args,
            result: result.success ? (result.data || formatted) : (result.error || 'Execution failed'),
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

    let finalContent = providerResponse.message;
    if (readSummaries.length > 0) {
      finalContent = `${providerResponse.message}\n\n${readSummaries.join('\n\n')}`;
    }

    const assistantMsg: AIMessage = {
      id: `asst-${Date.now()}`,
      role: 'assistant',
      content: finalContent,
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
      msg.proposal.status = 'failed';
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
