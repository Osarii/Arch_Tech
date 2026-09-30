import { describe, it, expect, beforeEach } from 'vitest';
import { bimEditService } from '../src/bim/edit/bimEditService';

describe('BimEditService (Non-Destructive Editing)', () => {
  beforeEach(async () => {
    await bimEditService.resetAllEdits();
  });

  it('records translation changes non-destructively in the change set', async () => {
    await bimEditService.transformElement(101, 'Basic Wall:Exterior', { x: 1.5, y: 0, z: 0 });

    const changeSet = bimEditService.getChangeSet();
    expect(changeSet.length).toBe(1);
    expect(changeSet[0].elementId).toBe(101);
    expect(changeSet[0].type).toBe('move');
    expect(changeSet[0].newValue.x).toBe(1.5);
    expect(changeSet[0].originalValue.x).toBe(0);

    const state = bimEditService.getElementState(101);
    expect(state).toBeDefined();
    expect(state?.transform.x).toBe(1.5);
  });

  it('records rotation changes and updates element state', async () => {
    await bimEditService.transformElement(102, 'Door:Interior', { rotationY: 45 });

    const changeSet = bimEditService.getChangeSet();
    expect(changeSet.length).toBe(1);
    expect(changeSet[0].type).toBe('rotate');
    expect(changeSet[0].newValue.rotationY).toBe(45);

    const state = bimEditService.getElementState(102);
    expect(state?.transform.rotationY).toBe(45);
  });

  it('records visual appearance overrides (color, opacity)', async () => {
    await bimEditService.setVisualOverride(103, 'Slab:Floor', {
      color: '#06b6d4',
      opacity: 0.5,
    });

    const changeSet = bimEditService.getChangeSet();
    expect(changeSet.length).toBe(1);
    expect(changeSet[0].type).toBe('color');
    expect(changeSet[0].newValue.color).toBe('#06b6d4');
    expect(changeSet[0].newValue.opacity).toBe(0.5);

    const state = bimEditService.getElementState(103);
    expect(state?.override.color).toBe('#06b6d4');
    expect(state?.override.opacity).toBe(0.5);
  });

  it('supports undo and redo stack transitions', async () => {
    await bimEditService.transformElement(104, 'Column:Square', { x: 2.0 });
    expect(bimEditService.getChangeSet().length).toBe(1);
    expect(bimEditService.getElementState(104)?.transform.x).toBe(2.0);

    // Undo
    await bimEditService.undo();
    expect(bimEditService.getChangeSet().length).toBe(0);
    expect(bimEditService.getElementState(104)?.transform.x).toBe(0);

    // Redo
    await bimEditService.redo();
    expect(bimEditService.getChangeSet().length).toBe(1);
    expect(bimEditService.getElementState(104)?.transform.x).toBe(2.0);
  });

  it('supports temporary element deletion and restoration', async () => {
    await bimEditService.deleteElement(105, 'Window:Double');
    expect(bimEditService.getElementState(105)?.isDeleted).toBe(true);
    expect(bimEditService.getChangeSet().some((c) => c.type === 'delete')).toBe(true);

    // Restore
    await bimEditService.restoreElement(105);
    expect(bimEditService.getElementState(105)?.isDeleted).toBe(false);
  });

  it('resets individual element edits back to original IFC state', async () => {
    await bimEditService.transformElement(106, 'Beam:Steel', { x: 3.0 });
    await bimEditService.setVisualOverride(106, 'Beam:Steel', { color: '#ef4444' });

    expect(bimEditService.getChangeSet().length).toBe(2);

    await bimEditService.resetElement(106);
    expect(bimEditService.getChangeSet().length).toBe(0);
    expect(bimEditService.getElementState(106)).toBeNull();
  });

  it('resets all edits across multiple elements', async () => {
    await bimEditService.transformElement(107, 'Wall A', { x: 1.0 });
    await bimEditService.transformElement(108, 'Wall B', { y: 2.0 });
    expect(bimEditService.getChangeSet().length).toBe(2);

    await bimEditService.resetAllEdits();
    expect(bimEditService.getChangeSet().length).toBe(0);
    expect(bimEditService.getElementState(107)).toBeNull();
    expect(bimEditService.getElementState(108)).toBeNull();
  });
});
