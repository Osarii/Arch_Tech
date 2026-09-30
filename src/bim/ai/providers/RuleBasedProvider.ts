import {
  AIMessage,
  ConversationContext,
  ToolDefinition,
} from '@/types/bim';

export interface AIProviderResponse {
  message: string;
  toolCalls?: {
    toolName: string;
    args: Record<string, any>;
  }[];
}

export interface AIProvider {
  id: string;
  name: string;
  generateResponse(
    userPrompt: string,
    messages: AIMessage[],
    tools: ToolDefinition[],
    context: ConversationContext
  ): Promise<AIProviderResponse>;
}

export class RuleBasedProvider implements AIProvider {
  public id = 'rule-based-deterministic';
  public name = 'Deterministic BIM Engine (Zero-Latency / Offline)';

  public async generateResponse(
    userPrompt: string,
    _messages: AIMessage[],
    _tools: ToolDefinition[],
    context: ConversationContext
  ): Promise<AIProviderResponse> {
    const prompt = userPrompt.trim().toLowerCase();

    // Helper to resolve elementId from prompt or active context
    const extractElementId = (text: string): number | undefined => {
      const match = text.match(/#?(\d+)/);
      if (match) return parseInt(match[1], 10);
      return context.selectedElementId;
    };

    // 1. SELECT ELEMENT
    if (prompt.includes('select') || prompt.startsWith('pick') || prompt.startsWith('focus')) {
      const id = extractElementId(prompt);
      if (id !== undefined) {
        return {
          message: `Selecting element #${id} in the 3D viewport...`,
          toolCalls: [{ toolName: 'select_element', args: { elementId: id } }],
        };
      }
      return {
        message: 'Please specify an element ID to select (e.g., "select #44").',
      };
    }

    // 2. PROPERTIES / ATTRIBUTES
    if (
      prompt.includes('properties') ||
      prompt.includes('property') ||
      prompt.includes('attributes') ||
      prompt.includes('pset') ||
      prompt.includes('inspect')
    ) {
      const id = extractElementId(prompt);
      if (id !== undefined) {
        return {
          message: `Fetching properties and psets for element #${id}...`,
          toolCalls: [{ toolName: 'get_element_properties', args: { elementId: id } }],
        };
      }
      return {
        message: 'Please select an element or specify an ID to view properties (e.g. "properties of #44").',
      };
    }

    // 3. QUANTITIES / TAKEOFFS / ANALYSIS
    if (
      prompt.includes('quantities') ||
      prompt.includes('takeoff') ||
      prompt.includes('analysis') ||
      prompt.includes('count') ||
      prompt.includes('volume') ||
      prompt.includes('gross area')
    ) {
      return {
        message: 'Calculating model quantities, volume, areas, and element distributions...',
        toolCalls: [{ toolName: 'calculate_quantities', args: {} }],
      };
    }

    // 4. ISOLATE CATEGORY
    const catMatch = prompt.match(/isolate\s+([a-z]+)/);
    if (catMatch) {
      const category = catMatch[1];
      return {
        message: `Isolating category '${category}' in the 3D viewport...`,
        toolCalls: [{ toolName: 'isolate_category', args: { category } }],
      };
    }

    // 5. SHOW ALL / RESET VISIBILITY
    if (prompt.includes('show all') || prompt.includes('unhide') || prompt.includes('restore visibility')) {
      return {
        message: 'Restoring visibility of all elements in the 3D viewport...',
        toolCalls: [{ toolName: 'show_all', args: {} }],
      };
    }

    // 6. FIT VIEW / RESET CAMERA
    if (prompt.includes('fit') || prompt.includes('reset camera')) {
      return {
        message: 'Fitting camera view to model boundaries...',
        toolCalls: [{ toolName: 'fit_view', args: {} }],
      };
    }

    // 7. MOVE ELEMENT (WRITE ACTION - Requires Confirmation)
    if (prompt.includes('move') || prompt.includes('translate')) {
      const id = extractElementId(prompt);
      if (id === undefined) {
        return {
          message: 'Please specify which element to move (e.g., "move #44 by 1m in X").',
        };
      }

      // Check for axis and distance e.g. "by 1.5m in x" or "by 2 x"
      let x = 0;
      let y = 0;
      let z = 0;

      const axisMatch = prompt.match(/(-?\d+\.?\d*)\s*m?\s*(?:in|along)?\s*([xyz])/);
      if (axisMatch) {
        const val = parseFloat(axisMatch[1]);
        const axis = axisMatch[2];
        if (axis === 'x') x = val;
        if (axis === 'y') y = val;
        if (axis === 'z') z = val;
      } else {
        // default offset if just "move #44"
        x = 1.0;
      }

      return {
        message: `I have prepared a proposal to translate element #${id} by [${x}m, ${y}m, ${z}m]. As this is a WRITE action, please confirm to apply the change.`,
        toolCalls: [{ toolName: 'move_element', args: { elementId: id, x, y, z } }],
      };
    }

    // 8. ROTATE ELEMENT (WRITE ACTION - Requires Confirmation)
    if (prompt.includes('rotate') || prompt.includes('turn')) {
      const id = extractElementId(prompt);
      if (id === undefined) {
        return {
          message: 'Please specify which element to rotate (e.g. "rotate #44 by 45 degrees").',
        };
      }

      const degMatch = prompt.match(/(-?\d+\.?\d*)\s*(?:deg|degrees?)/);
      const degrees = degMatch ? parseFloat(degMatch[1]) : 45;

      return {
        message: `I have prepared a proposal to rotate element #${id} by ${degrees}°. As this is a WRITE action, please confirm to apply the change.`,
        toolCalls: [{ toolName: 'rotate_element', args: { elementId: id, degrees } }],
      };
    }

    // 9. COLOR OVERRIDE (WRITE ACTION - Requires Confirmation)
    if (
      prompt.includes('color') ||
      prompt.includes('paint') ||
      prompt.includes('tint') ||
      prompt.includes('highlight')
    ) {
      const id = extractElementId(prompt);
      if (id === undefined) {
        return {
          message: 'Please specify an element to color (e.g. "color #44 cyan").',
        };
      }

      // Detect common color names or hex codes
      let color = '#38bdf8'; // sky/cyan default
      if (prompt.includes('cyan') || prompt.includes('sky')) color = '#06b6d4';
      else if (prompt.includes('emerald') || prompt.includes('green')) color = '#10b981';
      else if (prompt.includes('amber') || prompt.includes('orange') || prompt.includes('yellow')) color = '#f59e0b';
      else if (prompt.includes('rose') || prompt.includes('red')) color = '#f43f5e';
      else if (prompt.includes('purple') || prompt.includes('violet')) color = '#a855f7';
      else {
        const hexMatch = prompt.match(/#(?:[0-9a-f]{3}){1,2}\b/i);
        if (hexMatch) color = hexMatch[0];
      }

      return {
        message: `I have prepared a proposal to apply color override ${color} to element #${id}. As this is a WRITE action, please confirm to apply the change.`,
        toolCalls: [{ toolName: 'set_color_override', args: { elementId: id, color } }],
      };
    }

    // 10. DELETE ELEMENT (WRITE ACTION - Requires Confirmation)
    if (prompt.includes('delete') || prompt.includes('remove')) {
      const id = extractElementId(prompt);
      if (id === undefined) {
        return {
          message: 'Please specify which element to delete (e.g. "delete element #44").',
        };
      }

      return {
        message: `I have prepared a proposal to non-destructively delete element #${id}. As this is a WRITE action, please confirm to apply the change.`,
        toolCalls: [{ toolName: 'delete_element', args: { elementId: id } }],
      };
    }

    // 11. RESET ALL EDITS (WRITE ACTION - Requires Confirmation)
    if (prompt.includes('reset all') || prompt.includes('revert all')) {
      return {
        message: 'I have prepared a proposal to reset all edits and restore the original IFC model. Please confirm to proceed.',
        toolCalls: [{ toolName: 'reset_all_edits', args: {} }],
      };
    }

    // Fallback general guidance
    return {
      message:
        "I'm your BIM Lab AI Assistant. You can ask me to inspect properties, calculate quantities, isolate categories, or propose model edits (move, rotate, color, delete). Try prompts like:\n• 'Select #44'\n• 'Show properties of #44'\n• 'Calculate model quantities'\n• 'Isolate walls'\n• 'Move #44 by 1m in X'\n• 'Color #44 cyan'",
    };
  }
}
