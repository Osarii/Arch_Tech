import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ToolRegistry } from '@/bim/ai/ToolRegistry';
import { useBimStore } from '@/stores/bimStore';
import { bimEditService } from '@/bim/edit/bimEditService';
import { bimEngine } from '@/bim/engine/BimEngine';
import { BimTreeNode } from '@/types/bim';

describe('ToolRegistry & AI Tool Executor', () => {
  const sampleTree: BimTreeNode[] = [
    {
      id: 'proj',
      name: 'Sample Project',
      type: 'IFCPROJECT',
      visible: true,
      children: [
        {
          id: 'site',
          name: 'Building Site',
          type: 'IFCSITE',
          visible: true,
          children: [
            {
              id: 'bldg',
              name: 'Main Building',
              type: 'IFCBUILDING',
              visible: true,
              children: [
                {
                  id: 'storey-1',
                  name: 'Level 1',
                  type: 'IFCBUILDINGSTOREY',
                  visible: true,
                  children: [
                    {
                      id: 'elem-101',
                      name: 'Exterior Wall South',
                      type: 'IFCWALLSTANDARDCASE',
                      category: 'Walls',
                      expressID: 101,
                      visible: true,
                      children: [],
                    },
                    {
                      id: 'elem-102',
                      name: 'Exterior Wall North',
                      type: 'IFCWALLSTANDARDCASE',
                      category: 'Walls',
                      expressID: 102,
                      visible: true,
                      children: [],
                    },
                    {
                      id: 'elem-103',
                      name: 'Floor Slab 01',
                      type: 'IFCSLAB',
                      category: 'Slabs',
                      expressID: 103,
                      visible: true,
                      children: [],
                    },
                    {
                      id: 'elem-104',
                      name: 'Entrance Door',
                      type: 'IFCDOOR',
                      category: 'Doors',
                      expressID: 104,
                      visible: true,
                      children: [],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ];

  beforeEach(async () => {
    ToolRegistry.initDefaultTools();
    useBimStore.getState().resetModel();
    useBimStore.getState().setSpatialTree(sampleTree);
    await bimEditService.resetAllEdits();
  });

  describe('Tool Definitions and Categorization', () => {
    it('registers all required READ tools', () => {
      const readTools = [
        'select_element',
        'select_category',
        'hide_element',
        'hide_category',
        'isolate_category',
        'show_all',
        'fit_view',
        'get_element_properties',
        'calculate_quantities',
        'query_elements',
        'export_changes',
      ];
      for (const t of readTools) {
        const tool = ToolRegistry.getTool(t);
        expect(tool, `Tool ${t} must be registered`).toBeDefined();
        expect(tool?.category).toBe('READ');
      }
    });

    it('registers all required WRITE tools', () => {
      const writeTools = [
        'move_element',
        'rotate_element',
        'set_color_override',
        'delete_element',
        'reset_all_edits',
        'undo',
        'redo',
      ];
      for (const t of writeTools) {
        const tool = ToolRegistry.getTool(t);
        expect(tool, `Tool ${t} must be registered`).toBeDefined();
        expect(tool?.category).toBe('WRITE');
      }
    });

    it('isWriteAction properly identifies write tools and format-dependent confirmation', () => {
      expect(ToolRegistry.isWriteAction('undo')).toBe(true);
      expect(ToolRegistry.isWriteAction('redo')).toBe(true);
      expect(ToolRegistry.isWriteAction('move_element')).toBe(true);
      expect(ToolRegistry.isWriteAction('rotate_element')).toBe(true);
      expect(ToolRegistry.isWriteAction('set_color_override')).toBe(true);
      expect(ToolRegistry.isWriteAction('delete_element')).toBe(true);
      expect(ToolRegistry.isWriteAction('reset_all_edits')).toBe(true);
      expect(ToolRegistry.isWriteAction('export_changes', { format: 'ifc' })).toBe(true);
      expect(ToolRegistry.isWriteAction('export_changes', { format: 'json' })).toBe(false);
      expect(ToolRegistry.isWriteAction('select_element')).toBe(false);
      expect(ToolRegistry.isWriteAction('query_elements')).toBe(false);
    });
  });

  describe('READ Tool Executions & Spatial Querying', () => {
    it('query_elements filters by category, type, and storey', async () => {
      const resWalls = await ToolRegistry.executeTool('query_elements', { category: 'walls' });
      expect(resWalls.success).toBe(true);
      expect(resWalls.data.totalFound).toBe(2);
      expect(resWalls.data.elements.map((e: any) => e.id)).toEqual([101, 102]);

      const resDoor = await ToolRegistry.executeTool('query_elements', { type: 'ifcdoor' });
      expect(resDoor.success).toBe(true);
      expect(resDoor.data.totalFound).toBe(1);
      expect(resDoor.data.elements[0].id).toBe(104);

      const resStorey = await ToolRegistry.executeTool('query_elements', { storey: 'level 1' });
      expect(resStorey.success).toBe(true);
      expect(resStorey.data.totalFound).toBe(4);
    });

    it('isolate_category collects all category IDs and triggers engine isolation', async () => {
      const isolateSpy = vi.spyOn(bimEngine, 'isolateElements').mockResolvedValue(undefined);

      const res = await ToolRegistry.executeTool('isolate_category', { category: 'walls' });
      expect(res.success).toBe(true);
      expect(res.data.isolatedCount).toBe(2);
      expect(res.data.ids).toEqual([101, 102]);
      expect(isolateSpy).toHaveBeenCalledWith([101, 102]);

      isolateSpy.mockRestore();
    });

    it('select_category collects category IDs and triggers engine selection', async () => {
      const selectSpy = vi.spyOn(bimEngine, 'selectElements').mockResolvedValue(undefined);
      const focusSpy = vi.spyOn(bimEngine, 'focusElements').mockResolvedValue(undefined);

      const res = await ToolRegistry.executeTool('select_category', { category: 'slabs' });
      expect(res.success).toBe(true);
      expect(res.data.selectedCount).toBe(1);
      expect(res.data.ids).toEqual([103]);
      expect(selectSpy).toHaveBeenCalledWith([103], true);
      expect(focusSpy).toHaveBeenCalledWith([103]);

      selectSpy.mockRestore();
      focusSpy.mockRestore();
    });

    it('hide_element and hide_category call engine hider', async () => {
      const hideSpy = vi.spyOn(bimEngine, 'hideElements').mockResolvedValue(undefined);

      const resElem = await ToolRegistry.executeTool('hide_element', { elementId: 104 });
      expect(resElem.success).toBe(true);
      expect(hideSpy).toHaveBeenCalledWith([104]);

      const resCat = await ToolRegistry.executeTool('hide_category', { category: 'doors' });
      expect(resCat.success).toBe(true);
      expect(hideSpy).toHaveBeenCalledWith([104]);

      hideSpy.mockRestore();
    });

    it('show_all and fit_view call engine controls', async () => {
      const showSpy = vi.spyOn(bimEngine, 'showAll').mockResolvedValue(undefined);
      const fitSpy = vi.spyOn(bimEngine, 'fitModel').mockReturnValue(undefined);

      const resShow = await ToolRegistry.executeTool('show_all', {});
      expect(resShow.success).toBe(true);
      expect(showSpy).toHaveBeenCalled();

      const resFit = await ToolRegistry.executeTool('fit_view', {});
      expect(resFit.success).toBe(true);
      expect(fitSpy).toHaveBeenCalled();

      showSpy.mockRestore();
      fitSpy.mockRestore();
    });

    it('export_changes validates non-empty changeSet', async () => {
      // Empty changeset returns error
      const emptyRes = await ToolRegistry.executeTool('export_changes', { format: 'json' });
      expect(emptyRes.success).toBe(false);
      expect(emptyRes.error).toContain('empty');

      // Add a modification
      await bimEditService.transformElement(101, 'Wall', {
        x: 1,
        y: 0,
        z: 0,
        rotationX: 0,
        rotationY: 0,
        rotationZ: 0,
      });

      const res = await ToolRegistry.executeTool('export_changes', { format: 'json' });
      expect(res.success).toBe(true);
      expect(res.data.count).toBe(1);
      expect(res.data.format).toBe('json');
    });
  });

  describe('WRITE Tool Safety Enforcements', () => {
    it('calling WRITE tools without confirmation returns proposal and DOES NOT execute', async () => {
      const unconfirmed = await ToolRegistry.executeTool(
        'move_element',
        { elementId: 101, x: 2 },
        false
      );

      expect(unconfirmed.success).toBe(true);
      expect(unconfirmed.proposal).toBeDefined();
      expect(unconfirmed.proposal?.status).toBe('pending');
      expect(useBimStore.getState().changeSet).toHaveLength(0);
    });

    it('calling WRITE tools with confirmed=true executes and records in Change Set', async () => {
      const confirmed = await ToolRegistry.executeTool(
        'move_element',
        { elementId: 101, x: 2, y: 0, z: 0 },
        true
      );

      expect(confirmed.success).toBe(true);
      expect(useBimStore.getState().changeSet).toHaveLength(1);
      expect(useBimStore.getState().changeSet[0].elementId).toBe(101);
      expect(useBimStore.getState().changeSet[0].type).toBe('move');
    });

    it('undo and redo require confirmation and do not mutate state when unconfirmed', async () => {
      const undoSpy = vi.spyOn(bimEditService, 'undo').mockResolvedValue(undefined);
      const redoSpy = vi.spyOn(bimEditService, 'redo').mockResolvedValue(undefined);
      useBimStore.getState().setCanUndo(true);
      useBimStore.getState().setCanRedo(true);

      // Unconfirmed undo returns proposal
      const unconfirmedUndo = await ToolRegistry.executeTool('undo', {}, false);
      expect(unconfirmedUndo.success).toBe(true);
      expect(unconfirmedUndo.proposal).toBeDefined();
      expect(unconfirmedUndo.proposal?.toolName).toBe('undo');
      expect(undoSpy).not.toHaveBeenCalled();

      // Confirmed undo executes
      const confirmedUndo = await ToolRegistry.executeTool('undo', {}, true);
      expect(confirmedUndo.success).toBe(true);
      expect(undoSpy).toHaveBeenCalled();

      // Unconfirmed redo returns proposal
      const unconfirmedRedo = await ToolRegistry.executeTool('redo', {}, false);
      expect(unconfirmedRedo.success).toBe(true);
      expect(unconfirmedRedo.proposal).toBeDefined();
      expect(unconfirmedRedo.proposal?.toolName).toBe('redo');
      expect(redoSpy).not.toHaveBeenCalled();

      undoSpy.mockRestore();
      redoSpy.mockRestore();
    });

    it('export_changes format=ifc requires confirmation while format=json executes directly', async () => {
      // Setup a change so export has data
      await bimEditService.transformElement(101, 'Wall', {
        x: 1,
        y: 0,
        z: 0,
        rotationX: 0,
        rotationY: 0,
        rotationZ: 0,
      });

      // format=ifc unconfirmed produces proposal
      const ifcUnconfirmed = await ToolRegistry.executeTool(
        'export_changes',
        { format: 'ifc' },
        false
      );
      expect(ifcUnconfirmed.success).toBe(true);
      expect(ifcUnconfirmed.proposal).toBeDefined();
      expect(ifcUnconfirmed.proposal?.toolName).toBe('export_changes');
      expect(ifcUnconfirmed.proposal?.args.format).toBe('ifc');

      // format=json unconfirmed executes directly
      const jsonDirect = await ToolRegistry.executeTool(
        'export_changes',
        { format: 'json' },
        false
      );
      expect(jsonDirect.success).toBe(true);
      expect(jsonDirect.proposal).toBeUndefined();
      expect(jsonDirect.data.format).toBe('json');
    });

    it('excludes spatial hierarchy containers from element queries even if they have an expressID', async () => {
      const treeWithSpatialIDs: BimTreeNode[] = [
        {
          id: 'proj',
          name: 'Project',
          type: 'IFCPROJECT',
          expressID: 1,
          visible: true,
          children: [
            {
              id: 'site',
              name: 'Site',
              type: 'IFCSITE',
              expressID: 2,
              visible: true,
              children: [
                {
                  id: 'storey',
                  name: 'Level 1',
                  type: 'IFCBUILDINGSTOREY',
                  expressID: 3,
                  visible: true,
                  children: [
                    {
                      id: 'wall-1',
                      name: 'Wall 101',
                      type: 'IFCWALLSTANDARDCASE',
                      category: 'Walls',
                      expressID: 101,
                      visible: true,
                      children: [],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ];

      useBimStore.getState().setSpatialTree(treeWithSpatialIDs);

      const res = await ToolRegistry.executeTool('query_elements', {});
      expect(res.success).toBe(true);
      // Only the wall (101) is returned, spatial containers 1, 2, 3 are excluded
      expect(res.data.totalFound).toBe(1);
      expect(res.data.elements[0].id).toBe(101);
    });
  });
});
