import { describe, it, expect, beforeEach } from 'vitest';
import { useBimStore } from '../src/stores/bimStore';

describe('useBimStore', () => {
  beforeEach(() => {
    useBimStore.getState().resetModel();
  });

  it('initializes with default tool and camera state', () => {
    const state = useBimStore.getState();
    expect(state.activeTool).toBe('select');
    expect(state.cameraMode).toBe('perspective');
    expect(state.modelMetadata).toBeNull();
    expect(state.selectedElement).toBeNull();
  });

  it('switches active tools correctly', () => {
    const { setActiveTool } = useBimStore.getState();
    setActiveTool('measure');
    expect(useBimStore.getState().activeTool).toBe('measure');

    setActiveTool('section');
    expect(useBimStore.getState().activeTool).toBe('section');
  });

  it('manages selection and reset', () => {
    const { setSelectedElement, resetModel } = useBimStore.getState();
    setSelectedElement({
      expressID: 101,
      globalId: 'GUID-1234',
      type: 'IFCWALL',
      name: 'North Wall',
      propertyGroups: [
        {
          name: 'Pset_WallCommon',
          properties: [{ name: 'LoadBearing', value: true }],
        },
      ],
    });

    expect(useBimStore.getState().selectedElement?.name).toBe('North Wall');
    expect(useBimStore.getState().selectedElement?.expressID).toBe(101);

    resetModel();
    expect(useBimStore.getState().selectedElement).toBeNull();
  });

  it('toggles category and storey visibility filters', () => {
    const { toggleCategoryVisibility, toggleStoreyVisibility } = useBimStore.getState();

    toggleCategoryVisibility('Walls');
    expect(useBimStore.getState().hiddenCategories.has('Walls')).toBe(true);
    toggleCategoryVisibility('Walls');
    expect(useBimStore.getState().hiddenCategories.has('Walls')).toBe(false);

    toggleStoreyVisibility('Level 1');
    expect(useBimStore.getState().hiddenStoreys.has('Level 1')).toBe(true);
    toggleStoreyVisibility('Level 1');
    expect(useBimStore.getState().hiddenStoreys.has('Level 1')).toBe(false);
  });
});
