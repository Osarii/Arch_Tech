import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Camera,
  Bookmark,
  Plus,
  Trash2,
  Clock,
  Box,
  Compass,
} from 'lucide-react';
import { useBimStore } from '@/stores/bimStore';
import { bimEngine } from '@/bim/engine/BimEngine';
import { BimViewpoint } from '@/types/bim';

export const ViewpointsPanel: React.FC = () => {
  const { t } = useTranslation('workspace');
  const viewpoints = useBimStore((s) => s.viewpoints);
  const addViewpoint = useBimStore((s) => s.addViewpoint);
  const deleteViewpoint = useBimStore((s) => s.deleteViewpoint);
  const modelMetadata = useBimStore((s) => s.modelMetadata);
  const activeSiteContextId = useBimStore((s) => s.activeSiteContextId);

  const [isCreating, setIsCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const handleSaveViewpoint = () => {
    if (!title.trim()) return;
    const vp = bimEngine.captureCurrentViewpoint(title, description);
    addViewpoint(vp);
    setTitle('');
    setDescription('');
    setIsCreating(false);
  };

  const handleRestoreViewpoint = async (vp: BimViewpoint) => {
    await bimEngine.restoreViewpoint(vp);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden text-xs select-none">
      {/* Panel Top Action Bar */}
      <div className="p-2.5 border-b border-[#222630] flex items-center justify-between bg-[#151720]">
        <div className="flex items-center space-x-1.5 text-slate-300">
          <Bookmark className="w-3.5 h-3.5 text-sky-400" />
          <span className="font-medium text-[11px]">{t('savedViewpointsCount', 'Saved Viewpoints ({{count}})', { count: viewpoints.length })}</span>
        </div>

        {(modelMetadata || activeSiteContextId) && (
          <button
            onClick={() => setIsCreating(true)}
            data-testid="btn-save-viewpoint"
            className="flex items-center space-x-1 px-2.5 py-1 rounded bg-sky-600 hover:bg-sky-500 text-white font-medium text-[11px] transition shadow-sm"
            title={t('saveViewpointTooltip', 'Save current camera angle and selection as a viewpoint')}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t('saveView', 'Save View')}</span>
          </button>
        )}
      </div>

      {/* Viewpoint Creation Modal / Drawer */}
      {isCreating && (
        <div className="p-3 bg-[#181b26] border-b border-[#2a3042] space-y-2.5">
          <h4 className="font-semibold text-slate-200 text-xs flex items-center space-x-1.5">
            <Camera className="w-3.5 h-3.5 text-sky-400" />
            <span>{t('captureNewViewpoint', 'Capture New Viewpoint')}</span>
          </h4>

          <input
            type="text"
            placeholder={t('viewpointTitlePlaceholder', 'Viewpoint title (e.g. North Elevation, Roof Detail)')}
            value={title}
            data-testid="input-viewpoint-title"
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-[#12141c] border border-[#2b3142] rounded px-2.5 py-1.5 text-slate-200 placeholder-slate-500 text-xs focus:outline-none focus:border-sky-500"
          />

          <input
            type="text"
            placeholder={t('viewpointDescPlaceholder', 'Optional description / notes')}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-[#12141c] border border-[#2b3142] rounded px-2.5 py-1.5 text-slate-200 placeholder-slate-500 text-xs focus:outline-none focus:border-sky-500"
          />

          <div className="flex items-center justify-end space-x-2 pt-1">
            <button
              onClick={() => setIsCreating(false)}
              className="px-2.5 py-1 rounded text-slate-400 hover:text-slate-200 text-[11px] transition"
            >
              {t('cancel', 'Cancel')}
            </button>
            <button
              onClick={handleSaveViewpoint}
              disabled={!title.trim()}
              data-testid="btn-confirm-save-viewpoint"
              className="px-3 py-1 rounded bg-sky-600 hover:bg-sky-500 text-white font-medium text-[11px] transition disabled:opacity-40"
            >
              {t('saveViewpointBtn', 'Save Viewpoint')}
            </button>
          </div>
        </div>
      )}

      {/* Viewpoints List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {viewpoints.length > 0 ? (
          viewpoints.map((vp) => (
            <div
              key={vp.id}
              data-testid={`viewpoint-item-${vp.title.toLowerCase().replace(/\s+/g, '-')}`}
              onClick={() => handleRestoreViewpoint(vp)}
              className="p-2.5 rounded-lg bg-[#161822] border border-[#252a36] hover:border-sky-500/60 hover:bg-[#1a1d2a] cursor-pointer transition group"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-semibold text-slate-100 text-sm group-hover:text-sky-300 transition">
                    {vp.title}
                  </h4>
                  {vp.description && (
                    <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">
                      {vp.description}
                    </p>
                  )}
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteViewpoint(vp.id);
                  }}
                  className="p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 rounded transition"
                  title={t('deleteViewpointTitle', 'Delete Viewpoint')}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Viewpoint Metadata Chips */}
              <div className="flex items-center space-x-2 mt-2 pt-2 border-t border-[#222634] text-[10px] text-slate-400">
                <span className="flex items-center space-x-1 font-mono uppercase bg-[#1e2230] px-1.5 py-0.5 rounded border border-[#2a3042]">
                  <Compass className="w-2.5 h-2.5 text-sky-400" />
                  <span>{vp.cameraMode}</span>
                </span>

                {vp.selectedElements.length > 0 && (
                  <span className="flex items-center space-x-1 bg-[#1e2230] px-1.5 py-0.5 rounded border border-[#2a3042]">
                    <Box className="w-2.5 h-2.5 text-emerald-400" />
                    <span>{t('selectedElementsCount', '{{count}} selected', { count: vp.selectedElements.length })}</span>
                  </span>
                )}

                {vp.isolatedStorey && (
                  <span className="bg-emerald-950/60 text-emerald-300 border border-emerald-800/80 px-1.5 py-0.5 rounded">
                    {vp.isolatedStorey}
                  </span>
                )}

                <span className="flex items-center space-x-1 ml-auto text-slate-500">
                  <Clock className="w-2.5 h-2.5" />
                  <span>{vp.createdAt}</span>
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="p-6 text-center text-slate-500">
            <Camera className="w-8 h-8 mx-auto mb-2 text-slate-600" />
            <p>{t('noViewpointsSaved', 'No viewpoints saved yet.')}</p>
            <p className="text-[11px] text-slate-600 mt-1">
              {t('saveViewpointHint', 'Position the 3D camera and click "Save View" to capture key angles.')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
