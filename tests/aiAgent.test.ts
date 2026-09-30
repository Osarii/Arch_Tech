import { describe, it, expect, beforeEach } from 'vitest';
import { AIAgent } from '@/bim/ai/AIAgent';
import { RuleBasedProvider } from '@/bim/ai/providers/RuleBasedProvider';
import { ToolRegistry } from '@/bim/ai/ToolRegistry';
import { useBimStore } from '@/stores/bimStore';
import { bimEditService } from '@/bim/edit/bimEditService';

describe('AIAgent & RuleBasedProvider Integration', () => {
  let agent: AIAgent;
  let provider: RuleBasedProvider;

  beforeEach(async () => {
    ToolRegistry.initDefaultTools();
    agent = AIAgent.getInstance();
    agent.clearHistory();
    provider = new RuleBasedProvider();

    // Reset store state
    useBimStore.getState().resetModel();
    await bimEditService.resetAllEdits();
  });

  describe('RuleBasedProvider Intent Mapping', () => {
    it('maps quantities / takeoffs queries to calculate_quantities', async () => {
      const res = await provider.generateResponse(
        'Calculate model quantities and areas',
        [],
        ToolRegistry.getAllTools(),
        { modelLoaded: true }
      );
      expect(res.toolCalls).toBeDefined();
      expect(res.toolCalls![0].toolName).toBe('calculate_quantities');
    });

    it('maps properties queries with element ID to get_element_properties', async () => {
      const res = await provider.generateResponse(
        'Show properties of #44',
        [],
        ToolRegistry.getAllTools(),
        { modelLoaded: true }
      );
      expect(res.toolCalls).toBeDefined();
      expect(res.toolCalls![0].toolName).toBe('get_element_properties');
      expect(res.toolCalls![0].args.elementId).toBe(44);
    });

    it('maps category isolation to isolate_category', async () => {
      const res = await provider.generateResponse(
        'Isolate all walls in view',
        [],
        ToolRegistry.getAllTools(),
        { modelLoaded: true }
      );
      expect(res.toolCalls).toBeDefined();
      expect(res.toolCalls![0].toolName).toBe('isolate_category');
      expect(res.toolCalls![0].args.category).toMatch(/wall/i);
    });

    it('maps category selection to select_category', async () => {
      const res = await provider.generateResponse(
        'Select all doors',
        [],
        ToolRegistry.getAllTools(),
        { modelLoaded: true }
      );
      expect(res.toolCalls).toBeDefined();
      expect(res.toolCalls![0].toolName).toBe('select_category');
      expect(res.toolCalls![0].args.category).toMatch(/door/i);
    });

    it('maps search queries to query_elements', async () => {
      const res = await provider.generateResponse(
        'Find all windows',
        [],
        ToolRegistry.getAllTools(),
        { modelLoaded: true }
      );
      expect(res.toolCalls).toBeDefined();
      expect(res.toolCalls![0].toolName).toBe('query_elements');
      expect(res.toolCalls![0].args.category).toMatch(/window/i);
    });

    it('maps hide commands with element ID or category', async () => {
      const resElement = await provider.generateResponse(
        'Hide element #44',
        [],
        ToolRegistry.getAllTools(),
        { modelLoaded: true }
      );
      expect(resElement.toolCalls![0].toolName).toBe('hide_element');
      expect(resElement.toolCalls![0].args.elementId).toBe(44);

      const resCat = await provider.generateResponse(
        'Hide slabs',
        [],
        ToolRegistry.getAllTools(),
        { modelLoaded: true }
      );
      expect(resCat.toolCalls![0].toolName).toBe('hide_category');
      expect(resCat.toolCalls![0].args.category).toMatch(/slab/i);
    });

    it('maps undo, redo, and export commands', async () => {
      const undoRes = await provider.generateResponse('undo', [], [], {});
      expect(undoRes.toolCalls![0].toolName).toBe('undo');

      const redoRes = await provider.generateResponse('redo', [], [], {});
      expect(redoRes.toolCalls![0].toolName).toBe('redo');

      const exportRes = await provider.generateResponse('export changes as ifc', [], [], {});
      expect(exportRes.toolCalls![0].toolName).toBe('export_changes');
      expect(exportRes.toolCalls![0].args.format).toBe('ifc');
    });

    it('maps WRITE translation, rotation, color, and delete with safety confirmation required', async () => {
      const moveRes = await provider.generateResponse(
        'Move #44 by 2.5m in X',
        [],
        ToolRegistry.getAllTools(),
        { modelLoaded: true }
      );
      expect(moveRes.toolCalls![0].toolName).toBe('move_element');
      expect(moveRes.toolCalls![0].args.elementId).toBe(44);
      expect(moveRes.toolCalls![0].args.x).toBe(2.5);

      const rotRes = await provider.generateResponse(
        'Rotate #44 by 90 degrees',
        [],
        ToolRegistry.getAllTools(),
        { modelLoaded: true }
      );
      expect(rotRes.toolCalls![0].toolName).toBe('rotate_element');
      expect(rotRes.toolCalls![0].args.degrees).toBe(90);

      const colorRes = await provider.generateResponse(
        'Color #44 green',
        [],
        ToolRegistry.getAllTools(),
        { modelLoaded: true }
      );
      expect(colorRes.toolCalls![0].toolName).toBe('set_color_override');
      expect(colorRes.toolCalls![0].args.color).toBe('#10b981');

      const delRes = await provider.generateResponse(
        'Delete element #44',
        [],
        ToolRegistry.getAllTools(),
        { modelLoaded: true }
      );
      expect(delRes.toolCalls![0].toolName).toBe('delete_element');
      expect(delRes.toolCalls![0].args.elementId).toBe(44);
    });
  });

  describe('AIAgent Execution & Safety Flow', () => {
    it('executes READ command directly without proposal or Change Set mutation', async () => {
      // Mock spatial tree with test elements
      useBimStore.getState().setSpatialTree([
        {
          id: 'root',
          name: 'Project',
          type: 'IFCPROJECT',
          visible: true,
          children: [
            {
              id: 'elem-44',
              name: 'Wall 01',
              type: 'IFCWALLSTANDARDCASE',
              category: 'Walls',
              expressID: 44,
              visible: true,
              children: [],
            },
          ],
        },
      ]);

      const msg = await agent.sendMessage('Find all walls');

      expect(msg.role).toBe('assistant');
      expect(msg.proposal).toBeUndefined(); // Direct execution, NO write proposal
      expect(msg.toolCalls).toBeDefined();
      expect(msg.toolCalls![0].category).toBe('READ');
      expect(msg.toolCalls![0].toolName).toBe('query_elements');
      expect(msg.content).toContain('Found 1 matching element');
      expect(useBimStore.getState().changeSet).toHaveLength(0);
    });

    it('intercepts WRITE commands, generates pending confirmation proposal, and DOES NOT mutate Change Set until confirmed', async () => {
      const msg = await agent.sendMessage('Move #44 by 1m in X');

      expect(msg.role).toBe('assistant');
      expect(msg.proposal).toBeDefined();
      expect(msg.proposal?.status).toBe('pending');
      expect(msg.proposal?.toolName).toBe('move_element');
      expect(msg.proposal?.elementId).toBe(44);

      // Verify safety: Change Set is completely untouched while proposal is pending
      expect(useBimStore.getState().changeSet).toHaveLength(0);

      // Confirm the proposal
      const confirmed = await agent.confirmProposal(msg.proposal!.proposalId);
      expect(confirmed).toBe(true);

      // Proposal transitions to executed
      expect(msg.proposal?.status).toBe('executed');

      // Change Set is now updated
      const changes = useBimStore.getState().changeSet;
      expect(changes.length).toBe(1);
      expect(changes[0].type).toBe('move');
      expect(changes[0].elementId).toBe(44);
    });

    it('rejecting a WRITE proposal cancels action and DOES NOT mutate Change Set', async () => {
      const msg = await agent.sendMessage('Delete element #55');

      expect(msg.proposal).toBeDefined();
      expect(msg.proposal?.status).toBe('pending');
      expect(useBimStore.getState().changeSet).toHaveLength(0);

      // Reject the proposal
      const rejected = agent.rejectProposal(msg.proposal!.proposalId);
      expect(rejected).toBe(true);
      expect(msg.proposal?.status).toBe('rejected');

      // Crucial acceptance criterion: Rejected WRITE produces NO modification in Change Set
      expect(useBimStore.getState().changeSet).toHaveLength(0);

      // System message records cancellation
      const lastMsg = agent.getMessages()[agent.getMessages().length - 1];
      expect(lastMsg.role).toBe('system');
      expect(lastMsg.content).toContain('Cancelled');
    });
  });
});
