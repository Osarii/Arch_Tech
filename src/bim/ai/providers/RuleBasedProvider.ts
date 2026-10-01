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

    // Helper to detect common BIM category keywords
    const extractCategory = (text: string): string | undefined => {
      const categories = [
        'wall',
        'walls',
        'slab',
        'slabs',
        'door',
        'doors',
        'window',
        'windows',
        'column',
        'columns',
        'beam',
        'beams',
        'space',
        'spaces',
        'roof',
        'roofs',
        'stair',
        'stairs',
        'storey',
        'storeys',
      ];
      for (const cat of categories) {
        // match whole word or category phrase
        const regex = new RegExp(`\\b${cat}\\b`, 'i');
        if (regex.test(text)) {
          // Normalize singular/plural
          return cat;
        }
      }
      return undefined;
    };

    // 1. UNDO / REVERT
    if (
      prompt === 'undo' ||
      prompt.startsWith('undo') ||
      prompt.includes('revert last') ||
      prompt.includes('undo last')
    ) {
      return {
        message: 'I have prepared a proposal to undo the latest modification. As this mutates model state, please confirm to proceed.',
        toolCalls: [{ toolName: 'undo', args: {} }],
      };
    }

    // 2. REDO / REAPPLY
    if (
      prompt === 'redo' ||
      prompt.startsWith('redo') ||
      prompt.includes('reapply')
    ) {
      return {
        message: 'I have prepared a proposal to redo the previously undone modification. As this mutates model state, please confirm to proceed.',
        toolCalls: [{ toolName: 'redo', args: {} }],
      };
    }

    // 3. EXPORT CHANGES / PERSIST
    if (
      prompt.includes('export') ||
      prompt.includes('download changeset') ||
      prompt.includes('download ifc') ||
      prompt.includes('save changeset') ||
      prompt.includes('save model')
    ) {
      const format = prompt.includes('ifc') ? 'ifc' : 'json';
      return {
        message:
          format === 'ifc'
            ? 'I have prepared a proposal to persist changes into an IFC file. Please confirm to export.'
            : `Exporting BIM changes as ${format.toUpperCase()}...`,
        toolCalls: [{ toolName: 'export_changes', args: { format } }],
      };
    }

    // 4. HIDE (element or category)
    if (prompt.startsWith('hide') || prompt.includes('hide element') || prompt.includes('hide category')) {
      const idMatch = prompt.match(/#(\d+)|element\s+(\d+)/);
      if (idMatch) {
        const id = parseInt(idMatch[1] || idMatch[2], 10);
        return {
          message: `Hiding element #${id} in the 3D viewport...`,
          toolCalls: [{ toolName: 'hide_element', args: { elementId: id } }],
        };
      }

      const cat = extractCategory(prompt);
      if (cat) {
        return {
          message: `Hiding all ${cat} in the 3D viewport...`,
          toolCalls: [{ toolName: 'hide_category', args: { category: cat } }],
        };
      }

      if (context.selectedElementId !== undefined) {
        return {
          message: `Hiding selected element #${context.selectedElementId} in the 3D viewport...`,
          toolCalls: [{ toolName: 'hide_element', args: { elementId: context.selectedElementId } }],
        };
      }

      return {
        message: 'Please specify an element ID (e.g. "hide #44") or category (e.g. "hide walls") to hide.',
      };
    }

    // 5. SHOW ALL / RESTORE VISIBILITY
    if (
      prompt === 'show all' ||
      prompt.includes('show all') ||
      prompt.includes('unhide all') ||
      prompt.includes('restore visibility') ||
      prompt.includes('clear isolation')
    ) {
      return {
        message: 'Restoring visibility of all elements in the 3D viewport...',
        toolCalls: [{ toolName: 'show_all', args: {} }],
      };
    }

    // 6. ISOLATE / SHOW BY CATEGORY
    if (prompt.startsWith('isolate') || prompt.startsWith('show only') || prompt.includes('isolate category')) {
      const cat = extractCategory(prompt);
      if (cat) {
        return {
          message: `Isolating category '${cat}' in the 3D viewport...`,
          toolCalls: [{ toolName: 'isolate_category', args: { category: cat } }],
        };
      }
      return {
        message: 'Please specify a category to isolate (e.g. "isolate walls", "isolate slabs").',
      };
    }

    // 7. SHOW CATEGORY (e.g. "show walls", "show doors")
    if (prompt.startsWith('show ') && !prompt.includes('all') && !prompt.includes('properties')) {
      const cat = extractCategory(prompt);
      if (cat) {
        return {
          message: `Displaying category '${cat}' in the 3D viewport...`,
          toolCalls: [{ toolName: 'isolate_category', args: { category: cat } }],
        };
      }
    }

    // 8. SELECT ELEMENTS (BY CATEGORY OR BY ID)
    if (prompt.startsWith('select') || prompt.startsWith('pick') || prompt.startsWith('focus')) {
      const id = extractElementId(prompt);
      const cat = extractCategory(prompt);

      // If category is mentioned without explicit #ID (e.g. "select walls", "select all slabs")
      if (cat && !prompt.includes('#')) {
        return {
          message: `Selecting all elements in category '${cat}'...`,
          toolCalls: [{ toolName: 'select_category', args: { category: cat } }],
        };
      }

      if (id !== undefined) {
        return {
          message: `Selecting element #${id} in the 3D viewport...`,
          toolCalls: [{ toolName: 'select_element', args: { elementId: id } }],
        };
      }

      return {
        message: 'Please specify an element ID (e.g., "select #44") or category (e.g., "select walls").',
      };
    }

    // 9. SEARCH / QUERY ELEMENTS
    if (
      prompt.startsWith('search') ||
      prompt.startsWith('find') ||
      prompt.startsWith('query') ||
      prompt.startsWith('filter')
    ) {
      const cat = extractCategory(prompt);
      const typeMatch = prompt.match(/\b(ifc[a-z0-9]+)\b/i);
      const storeyMatch = prompt.match(/(?:in|on|level|storey|floor)\s+([a-z0-9_-]+)/i);

      let nameQuery: string | undefined;
      // Extract quoted query if present e.g. search "exterior"
      const quoteMatch = prompt.match(/["']([^"']+)["']/);
      if (quoteMatch) {
        nameQuery = quoteMatch[1];
      }

      return {
        message: `Querying BIM elements matching criteria...`,
        toolCalls: [
          {
            toolName: 'query_elements',
            args: {
              category: cat,
              type: typeMatch ? typeMatch[1].toUpperCase() : undefined,
              storey: storeyMatch ? storeyMatch[1] : undefined,
              nameQuery,
            },
          },
        ],
      };
    }

    // 10. PROPERTIES / ATTRIBUTES / INSPECT
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

    // 11. QUANTITIES / TAKEOFFS / ELEMENT COUNTS
    if (
      prompt.includes('quantities') ||
      prompt.includes('takeoff') ||
      prompt.includes('analysis') ||
      prompt.includes('how many elements') ||
      prompt.includes('element count') ||
      prompt.includes('total count') ||
      prompt.includes('volume') ||
      prompt.includes('gross area')
    ) {
      return {
        message: 'Calculating model quantities, volume, areas, and element distributions...',
        toolCalls: [{ toolName: 'calculate_quantities', args: {} }],
      };
    }

    // 12. FIT VIEW / RESET CAMERA
    if (prompt.includes('fit') || prompt.includes('reset camera')) {
      return {
        message: 'Fitting camera view to model boundaries...',
        toolCalls: [{ toolName: 'fit_view', args: {} }],
      };
    }

    // 13. DISCARD / CLEAR GENERATION PREVIEW
    if (
      prompt === 'discard preview' ||
      prompt.includes('discard preview') ||
      prompt.includes('clear preview') ||
      prompt.includes('remove preview') ||
      prompt.includes('delete preview') ||
      prompt.includes('close preview')
    ) {
      return {
        message: 'Discarding 3D generation preview overlay...',
        toolCalls: [{ toolName: 'discard_generation_preview', args: {} }],
      };
    }

    // 14. PREVIEW GENERATION (BIM Massing / Building Plan)
    if (
      prompt.includes('generate') ||
      prompt.includes('preview') ||
      prompt.includes('massing') ||
      prompt.includes('create building') ||
      prompt.includes('build') ||
      prompt.includes('house')
    ) {
      // Dimensions: e.g. "10x8", "10 x 8", "10m x 8m", "10 by 8", "length 10 ... width 8"
      let length: number | undefined;
      let width: number | undefined;

      const dimMatch = prompt.match(/(\d+\.?\d*)\s*(?:m)?\s*(?:x|by|×|\*)\s*(\d+\.?\d*)\s*(?:m)?/);
      if (dimMatch) {
        length = parseFloat(dimMatch[1]);
        width = parseFloat(dimMatch[2]);
      } else {
        const lenMatch = prompt.match(/length\s*[:=]?\s*(\d+\.?\d*)/);
        const widMatch = prompt.match(/width\s*[:=]?\s*(\d+\.?\d*)/);
        if (lenMatch && widMatch) {
          length = parseFloat(lenMatch[1]);
          width = parseFloat(widMatch[1]);
        }
      }

      // Storeys: e.g. "2 storeys", "2-storey", "1 story", "3 floors", "storeys: 2"
      let storeys: number | undefined;
      const storeyMatch = prompt.match(/(\d+)\s*-?\s*(?:storey|storeys|story|stories|floors?|levels?)/);
      if (storeyMatch) {
        storeys = parseInt(storeyMatch[1], 10);
      } else {
        const storeyNamedMatch = prompt.match(/storeys?\s*[:=]?\s*(\d+)/);
        if (storeyNamedMatch) {
          storeys = parseInt(storeyNamedMatch[1], 10);
        }
      }

      // Height: e.g. "3m height per storey", "3m storey height", "6m height", "3m tall", "height: 3"
      let storeyHeight: number | undefined;
      let totalHeight: number | undefined;

      const perStoreyMatch = prompt.match(
        /(\d+\.?\d*)\s*-?\s*m?\s*(?:storey\s*height|height\s*per\s*storey|height\s*each\s*storey|floor\s*height|each\s*storey|per\s*storey)/
      );
      if (perStoreyMatch) {
        storeyHeight = parseFloat(perStoreyMatch[1]);
      }

      const totalHMatch = prompt.match(/(\d+\.?\d*)\s*-?\s*m?\s*(?:total\s*height|height|tall|high)/);
      if (totalHMatch && !storeyHeight) {
        totalHeight = parseFloat(totalHMatch[1]);
      }

      // Wall thickness
      let wallThickness: number | undefined;
      const thickMatch = prompt.match(/(\d+\.?\d*)\s*-?\s*m?\s*(?:wall\s*thickness|thickness)/);
      if (thickMatch) {
        wallThickness = parseFloat(thickMatch[1]);
      }

      // Missing dimensions validation - NO silent defaults
      if (length === undefined || width === undefined) {
        return {
          message:
            "To preview a generated building, please specify dimensions: length, width, height (or storey height), and storeys (e.g., 'Generate 10x8m building, 2 storeys, 3m height').",
        };
      }

      if (storeys === undefined && storeyHeight === undefined && totalHeight === undefined) {
        return {
          message:
            "Please specify the number of storeys and height (e.g., '2 storeys, 3m height per storey').",
        };
      }

      if (storeys === undefined) {
        return {
          message:
            "Please specify the number of storeys for the building (e.g., '1 storey' or '2 storeys').",
        };
      }

      if (storeyHeight === undefined && totalHeight === undefined) {
        return {
          message:
            "Please specify the storey height or total building height (e.g., '3m height per storey').",
        };
      }

      const calculatedStoreyHeight = storeyHeight || (totalHeight! / storeys);

      return {
        message: `Generating 3D preview for a ${storeys}-storey building (${length}m × ${width}m, ${calculatedStoreyHeight}m/storey)...`,
        toolCalls: [
          {
            toolName: 'preview_generation',
            args: {
              length,
              width,
              storeys,
              storeyHeight: calculatedStoreyHeight,
              ...(wallThickness ? { wallThickness } : {}),
            },
          },
        ],
      };
    }

    // 14b. COMMIT GENERATION (WRITE ACTION - Requires Confirmation)
    if (
      prompt.includes('commit') ||
      prompt.includes('save generated') ||
      prompt.includes('build ifc') ||
      prompt.includes('author ifc')
    ) {
      return {
        message:
          'I have prepared a proposal to author an authentic IFC4 model from the active generation plan and load it into the viewer. As this is a WRITE action replacing the current viewport model, please confirm to proceed.',
        toolCalls: [
          {
            toolName: 'commit_generation',
            args: {},
          },
        ],
      };
    }

    // 15. MOVE ELEMENT (WRITE ACTION - Requires Confirmation)
    if (prompt.includes('move') || prompt.includes('translate')) {
      const id = extractElementId(prompt);
      if (id === undefined) {
        return {
          message: 'Please specify which element to move (e.g., "move #44 by 1m in X").',
        };
      }

      const axisMatch = prompt.match(/(-?\d+\.?\d*)\s*m?\s*(?:in|along)?\s*([xyz])/);
      if (!axisMatch) {
        return {
          message: `Please specify the displacement distance and axis to move element #${id} (e.g., 'move #${id} by 1m in X').`,
        };
      }

      let x = 0;
      let y = 0;
      let z = 0;

      const val = parseFloat(axisMatch[1]);
      const axis = axisMatch[2];
      if (axis === 'x') x = val;
      if (axis === 'y') y = val;
      if (axis === 'z') z = val;

      return {
        message: `I have prepared a proposal to translate element #${id} by [${x}m, ${y}m, ${z}m]. As this is a WRITE action, please confirm to apply the change.`,
        toolCalls: [{ toolName: 'move_element', args: { elementId: id, x, y, z } }],
      };
    }

    // 16. ROTATE ELEMENT (WRITE ACTION - Requires Confirmation)
    if (prompt.includes('rotate') || prompt.includes('turn')) {
      const id = extractElementId(prompt);
      if (id === undefined) {
        return {
          message: 'Please specify which element to rotate (e.g. "rotate #44 by 45 degrees").',
        };
      }

      const degMatch = prompt.match(/(-?\d+\.?\d*)\s*(?:deg|degrees?)/);
      if (!degMatch) {
        return {
          message: `Please specify the rotation angle in degrees (e.g. 'rotate #${id} by 45 degrees').`,
        };
      }

      const degrees = parseFloat(degMatch[1]);

      return {
        message: `I have prepared a proposal to rotate element #${id} by ${degrees}°. As this is a WRITE action, please confirm to apply the change.`,
        toolCalls: [{ toolName: 'rotate_element', args: { elementId: id, degrees } }],
      };
    }

    // 17. COLOR OVERRIDE (WRITE ACTION - Requires Confirmation)
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

      let color = '#38bdf8'; // cyan default
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

    // 18. DELETE ELEMENT (WRITE ACTION - Requires Confirmation)
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

    // 19. RESET ALL EDITS (WRITE ACTION - Requires Confirmation)
    if (prompt.includes('reset all') || prompt.includes('revert all')) {
      return {
        message: 'I have prepared a proposal to reset all edits and restore the original IFC model. Please confirm to proceed.',
        toolCalls: [{ toolName: 'reset_all_edits', args: {} }],
      };
    }

    // Fallback general guidance
    return {
      message:
        "I'm your BIM Lab AI Assistant. You can ask me to inspect properties, calculate quantities, isolate categories, search elements, or propose model edits:\n• 'Select #44' or 'Select walls'\n• 'Show properties of #44'\n• 'Calculate model quantities'\n• 'Preview 10x8m 2-storey building, 3m height'\n• 'Discard preview'\n• 'Isolate walls' or 'Hide slabs'\n• 'Undo' or 'Export changes'\n• 'Move #44 by 1m in X'\n• 'Color #44 cyan'",
    };
  }
}
