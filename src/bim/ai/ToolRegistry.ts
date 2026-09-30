import { bimEngine } from '@/bim/engine/BimEngine';
import { bimEditService } from '@/bim/edit/bimEditService';
import { BimAnalysisService } from '@/bim/analysis/bimAnalysisService';
import { useBimStore } from '@/stores/bimStore';
import {
  ToolDefinition,
  PendingWriteProposal,
} from '@/types/bim';

export interface ToolExecutionResult {
  success: boolean;
  data?: any;
  error?: string;
  proposal?: PendingWriteProposal;
}

export class ToolRegistry {
  private static tools: Map<string, ToolDefinition> = new Map();

  public static registerTool(tool: ToolDefinition): void {
    this.tools.set(tool.name, tool);
  }

  public static getTool(name: string): ToolDefinition | undefined {
    return this.tools.get(name);
  }

  public static getAllTools(): ToolDefinition[] {
    return Array.from(this.tools.values());
  }

  /**
   * Initializes all standard BIM Lab AI tools (READ and WRITE).
   */
  public static initDefaultTools(): void {
    if (this.tools.size > 0) return;

    // --- READ TOOLS (Execute immediately without confirmation) ---

    this.registerTool({
      name: 'select_element',
      description: 'Selects and focuses an element in the 3D viewport by its expressID',
      category: 'READ',
      parameters: {
        elementId: { type: 'number', description: 'The expressID of the IFC element', required: true },
      },
    });

    this.registerTool({
      name: 'get_element_properties',
      description: 'Retrieves all IFC attributes, property sets (Psets), and quantities for an element',
      category: 'READ',
      parameters: {
        elementId: { type: 'number', description: 'The expressID of the IFC element', required: true },
      },
    });

    this.registerTool({
      name: 'calculate_quantities',
      description: 'Calculates model-wide BIM takeoffs (volumes, areas, storey distributions, and element counts)',
      category: 'READ',
      parameters: {},
    });

    this.registerTool({
      name: 'query_elements',
      description: 'Queries and filters elements in the active model by type, storey, or name query',
      category: 'READ',
      parameters: {
        type: { type: 'string', description: 'IFC Type/Category (e.g. IFCWALL, IFCSLAB)' },
        storey: { type: 'string', description: 'Building storey name' },
        nameQuery: { type: 'string', description: 'Text search inside element names' },
      },
    });

    this.registerTool({
      name: 'isolate_category',
      description: 'Isolates an element category (e.g. walls, slabs, windows, doors) in the 3D viewport',
      category: 'READ',
      parameters: {
        category: { type: 'string', description: 'Category name to isolate', required: true },
      },
    });

    this.registerTool({
      name: 'show_all',
      description: 'Restores visibility of all elements in the 3D viewport',
      category: 'READ',
      parameters: {},
    });

    this.registerTool({
      name: 'fit_view',
      description: 'Fits the camera view to encompass the entire model',
      category: 'READ',
      parameters: {},
    });

    // --- WRITE TOOLS (Require user confirmation before execution) ---

    this.registerTool({
      name: 'move_element',
      description: 'Translates an element by relative offsets in meters (X, Y, Z)',
      category: 'WRITE',
      parameters: {
        elementId: { type: 'number', description: 'Target element expressID', required: true },
        x: { type: 'number', description: 'Delta X in meters', default: 0 },
        y: { type: 'number', description: 'Delta Y in meters', default: 0 },
        z: { type: 'number', description: 'Delta Z in meters', default: 0 },
      },
    });

    this.registerTool({
      name: 'rotate_element',
      description: 'Rotates an element around the Y axis by specified degrees',
      category: 'WRITE',
      parameters: {
        elementId: { type: 'number', description: 'Target element expressID', required: true },
        degrees: { type: 'number', description: 'Rotation angle in degrees', required: true },
      },
    });

    this.registerTool({
      name: 'set_color_override',
      description: 'Applies a visual color override to an element',
      category: 'WRITE',
      parameters: {
        elementId: { type: 'number', description: 'Target element expressID', required: true },
        color: { type: 'string', description: 'Hex color string (e.g. #38bdf8)', required: true },
      },
    });

    this.registerTool({
      name: 'delete_element',
      description: 'Non-destructively hides/deletes an element from the model',
      category: 'WRITE',
      parameters: {
        elementId: { type: 'number', description: 'Target element expressID', required: true },
      },
    });

    this.registerTool({
      name: 'reset_all_edits',
      description: 'Reverts all active edits and restores pristine original IFC model state',
      category: 'WRITE',
      parameters: {},
    });
  }

  /**
   * Executes a tool with strict READ vs WRITE validation.
   * WRITE actions must have `confirmed: true` to execute; otherwise a proposal is generated.
   */
  public static async executeTool(
    name: string,
    args: Record<string, any>,
    confirmed = false
  ): Promise<ToolExecutionResult> {
    this.initDefaultTools();
    const tool = this.getTool(name);
    if (!tool) {
      return { success: false, error: `Unknown tool: ${name}` };
    }

    // 1. Check READ vs WRITE enforcement
    if (tool.category === 'WRITE' && !confirmed) {
      const proposal: PendingWriteProposal = {
        proposalId: `prop-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        toolName: name,
        args,
        summary: this.generateWriteSummary(name, args),
        description: tool.description,
        elementId: args.elementId,
        elementName: args.elementName || (args.elementId ? `#${args.elementId}` : undefined),
        status: 'pending',
        createdAt: new Date().toLocaleTimeString(),
      };

      return {
        success: true,
        proposal,
        data: { message: 'Write action requires user confirmation before execution.' },
      };
    }

    // 2. Execute concrete tool
    try {
      switch (name) {
        // --- READ ACTIONS ---
        case 'select_element': {
          const id = Number(args.elementId);
          await bimEngine.selectElements([id], true);
          await bimEngine.focusElements([id]);
          return { success: true, data: { selectedId: id, message: `Selected element #${id}` } };
        }

        case 'get_element_properties': {
          const id = Number(args.elementId);
          const props = bimEngine.getProperties(id);
          if (!props) {
            return { success: false, error: `Could not retrieve properties for element #${id}` };
          }
          return { success: true, data: props };
        }

        case 'calculate_quantities': {
          if (!bimEngine.webIfcApi || (bimEngine.webIfcModelID === null && bimEngine.webIfcModelID !== 0)) {
            return { success: false, error: 'No model loaded.' };
          }
          const analysis = await BimAnalysisService.analyzeModel(
            bimEngine.webIfcApi,
            bimEngine.webIfcModelID
          );
          return { success: true, data: analysis };
        }

        case 'query_elements': {
          const spatialTree = useBimStore.getState().spatialTree;
          if (!spatialTree) return { success: false, error: 'No spatial tree available.' };

          // Collect all leaf elements from tree
          const allElements: { expressID: number; name: string; type: string; storey?: string }[] = [];
          const collectLeaves = (node: any, currentStorey = '') => {
            const storey = node.type === 'IFCBUILDINGSTOREY' ? node.name : currentStorey;
            if ((!node.children || node.children.length === 0) && node.expressID !== undefined) {
              allElements.push({
                expressID: node.expressID,
                name: node.name,
                type: node.type,
                storey,
              });
            }
            if (node.children) {
              for (const child of node.children) collectLeaves(child, storey);
            }
          };
          collectLeaves(spatialTree);

          let filtered = allElements;
          if (args.type) {
            const t = String(args.type).toUpperCase();
            filtered = filtered.filter((e) => e.type.toUpperCase().includes(t));
          }
          if (args.storey) {
            const s = String(args.storey).toLowerCase();
            filtered = filtered.filter((e) => e.storey && e.storey.toLowerCase().includes(s));
          }
          if (args.nameQuery) {
            const q = String(args.nameQuery).toLowerCase();
            filtered = filtered.filter((e) => e.name && e.name.toLowerCase().includes(q));
          }

          return {
            success: true,
            data: {
              totalFound: filtered.length,
              elements: filtered.slice(0, 15).map((e) => ({ id: e.expressID, name: e.name, type: e.type })),
            },
          };
        }

        case 'isolate_category': {
          const cat = String(args.category).toUpperCase();
          const spatialTree = useBimStore.getState().spatialTree;
          if (!spatialTree) return { success: false, error: 'No spatial tree available.' };

          const ids: number[] = [];
          const collectCat = (node: any) => {
            if (node.type && node.type.toUpperCase().includes(cat) && node.expressID !== undefined) {
              ids.push(node.expressID);
            }
            if (node.children) {
              for (const c of node.children) collectCat(c);
            }
          };
          collectCat(spatialTree);

          if (ids.length === 0) {
            return { success: false, error: `No elements found for category '${args.category}'.` };
          }

          await bimEngine.isolateElements(ids);
          return { success: true, data: { isolatedCount: ids.length, ids } };
        }

        case 'show_all': {
          await bimEngine.showAll();
          return { success: true, data: { message: 'All elements restored to visible.' } };
        }

        case 'fit_view': {
          bimEngine.fitModel();
          return { success: true, data: { message: 'Camera fit to model.' } };
        }

        // --- WRITE ACTIONS (Executed only with confirmed=true) ---
        case 'move_element': {
          const id = Number(args.elementId);
          const currentEdit = bimEditService.getElementState(id);
          const name = args.elementName || currentEdit?.elementName || `Element #${id}`;

          const dx = Number(args.x) || 0;
          const dy = Number(args.y) || 0;
          const dz = Number(args.z) || 0;

          const baseTransform = currentEdit?.transform || {
            x: 0,
            y: 0,
            z: 0,
            rotationX: 0,
            rotationY: 0,
            rotationZ: 0,
          };

          const newTransform = {
            ...baseTransform,
            x: baseTransform.x + dx,
            y: baseTransform.y + dy,
            z: baseTransform.z + dz,
          };

          await bimEditService.transformElement(id, name, newTransform, true);
          return {
            success: true,
            data: {
              elementId: id,
              transform: newTransform,
              message: `Moved #${id} by [${dx}m, ${dy}m, ${dz}m]`,
            },
          };
        }

        case 'rotate_element': {
          const id = Number(args.elementId);
          const currentEdit = bimEditService.getElementState(id);
          const name = args.elementName || currentEdit?.elementName || `Element #${id}`;

          const deg = Number(args.degrees) || 0;
          const baseTransform = currentEdit?.transform || {
            x: 0,
            y: 0,
            z: 0,
            rotationX: 0,
            rotationY: 0,
            rotationZ: 0,
          };

          const newTransform = {
            ...baseTransform,
            rotationY: baseTransform.rotationY + deg,
          };

          await bimEditService.transformElement(id, name, newTransform, true);
          return {
            success: true,
            data: {
              elementId: id,
              rotationY: newTransform.rotationY,
              message: `Rotated #${id} by ${deg}°`,
            },
          };
        }

        case 'set_color_override': {
          const id = Number(args.elementId);
          const currentEdit = bimEditService.getElementState(id);
          const name = args.elementName || currentEdit?.elementName || `Element #${id}`;
          const color = String(args.color);

          await bimEditService.setVisualOverride(id, name, { color });
          return {
            success: true,
            data: { elementId: id, color, message: `Color override applied to #${id}: ${color}` },
          };
        }

        case 'delete_element': {
          const id = Number(args.elementId);
          const currentEdit = bimEditService.getElementState(id);
          const name = args.elementName || currentEdit?.elementName || `Element #${id}`;

          await bimEditService.deleteElement(id, name);
          return {
            success: true,
            data: { elementId: id, message: `Non-destructively deleted element #${id}` },
          };
        }

        case 'reset_all_edits': {
          await bimEditService.resetAllEdits();
          return { success: true, data: { message: 'All edits reset. Restored original IFC state.' } };
        }

        default:
          return { success: false, error: `Tool handler for ${name} not implemented.` };
      }
    } catch (err: any) {
      return { success: false, error: `Execution error in ${name}: ${err.message}` };
    }
  }

  private static generateWriteSummary(name: string, args: Record<string, any>): string {
    switch (name) {
      case 'move_element':
        return `Move element #${args.elementId} by [${args.x || 0}m, ${args.y || 0}m, ${args.z || 0}m]`;
      case 'rotate_element':
        return `Rotate element #${args.elementId} by ${args.degrees || 0}°`;
      case 'set_color_override':
        return `Set color of element #${args.elementId} to ${args.color}`;
      case 'delete_element':
        return `Delete element #${args.elementId} from model view`;
      case 'reset_all_edits':
        return 'Reset all edits and restore original IFC model';
      default:
        return `Execute ${name} with arguments: ${JSON.stringify(args)}`;
    }
  }
}
