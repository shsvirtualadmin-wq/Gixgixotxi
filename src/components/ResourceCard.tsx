import React from 'react';
import {
  FileText,
  Calendar,
  Eye,
  Download,
  Trash2,
  Check,
} from 'lucide-react';
import { ResourceItem } from '../types';

export interface ResourceCardProps {
  item: ResourceItem;
  isSelected: boolean;
  isAdmin: boolean;
  onToggleSelect: (id: string, e: React.MouseEvent) => void;
  onOpenDeleteModal: (item: ResourceItem, e: React.MouseEvent) => void;
  onOpenPreview: (item: ResourceItem, e: React.MouseEvent) => void;
  onDownload: (item: ResourceItem) => void;
}

const subjectBadgeColors: Record<string, { bg: string; text: string; border: string }> = {
  Physics: { bg: 'bg-cyan-50', text: 'text-cyan-800', border: 'border-cyan-200' },
  Chemistry: { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200' },
  Biology: { bg: 'bg-teal-50', text: 'text-teal-800', border: 'border-teal-200' },
  Mathematics: { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' },
  'Computer Science': { bg: 'bg-indigo-50', text: 'text-indigo-800', border: 'border-indigo-200' },
  English: { bg: 'bg-purple-50', text: 'text-purple-800', border: 'border-purple-200' },
  'Logical Reasoning': { bg: 'bg-pink-50', text: 'text-pink-800', border: 'border-pink-200' },
  General: { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' },
};

function getSubjectBadge(subject: string) {
  return subjectBadgeColors[subject] || subjectBadgeColors.General;
}

function formatDate(dateStr?: string) {
  if (!dateStr) return 'Recently';
  try {
    const d = new Date(dateStr);
    return isNaN(d.getTime())
      ? 'Recently'
      : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return 'Recently';
  }
}

const ResourceCardComponent: React.FC<ResourceCardProps> = ({
  item,
  isSelected,
  isAdmin,
  onToggleSelect,
  onOpenDeleteModal,
  onOpenPreview,
  onDownload,
}) => {
  const badge = getSubjectBadge(item.subject);

  return (
    <div
      id={`resource-card-${item.id}`}
      style={{
        contentVisibility: 'auto',
        containIntrinsicSize: 'auto 168px',
      }}
      className={`bg-white hover:bg-slate-50/80 border ${
        isSelected
          ? 'border-[#1E5AFF] ring-1 ring-[#1E5AFF]/30 bg-blue-50/30'
          : 'border-slate-200 hover:border-blue-300'
      } rounded-2xl p-4 sm:p-4.5 transition-all shadow-xs group flex flex-col justify-between gap-3 relative`}
    >
      {/* Top Row: Selection Checkbox + Subject/Class Badges + Top Admin Delete */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          {/* Admin Multi-Select Checkbox */}
          {isAdmin && (
            <button
              type="button"
              id={`select-resource-chk-${item.id}`}
              onClick={e => onToggleSelect(item.id, e)}
              className={`p-1 rounded-lg border transition-colors cursor-pointer flex items-center justify-center ${
                isSelected
                  ? 'bg-[#1E5AFF] border-[#1E5AFF] text-white shadow-xs shadow-blue-500/30'
                  : 'bg-slate-100 border-slate-300 text-transparent hover:border-[#1E5AFF]/60'
              }`}
              title={isSelected ? 'Deselect resource' : 'Select resource for batch actions'}
            >
              <Check className={`w-3.5 h-3.5 stroke-[3] ${isSelected ? 'opacity-100' : 'opacity-0'}`} />
            </button>
          )}

          {/* Subject Badge */}
          <span
            className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${badge.bg} ${badge.text} ${badge.border}`}
          >
            {item.subject}
          </span>

          {/* Class Badge */}
          {item.class && item.class !== 'All' && (
            <span className="text-[10px] font-extrabold text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-full">
              {item.class}
            </span>
          )}
        </div>

        {/* Top Admin Delete Action */}
        {isAdmin && (
          <button
            type="button"
            id={`delete-resource-btn-top-${item.id}`}
            onClick={e => onOpenDeleteModal(item, e)}
            className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
            title="Delete PDF Resource"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Middle: Document Title & Metadata */}
      <div className="space-y-1.5">
        <h4 className="font-['Space_Grotesk'] font-bold text-sm sm:text-base text-slate-900 group-hover:text-[#1E5AFF] transition-colors leading-snug line-clamp-2">
          {item.title}
        </h4>

        <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 font-medium pt-0.5">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3 text-[#1E5AFF]" />
            <span>{formatDate(item.created_at)}</span>
          </span>
          {item.file_size && (
            <span className="flex items-center gap-1">
              <FileText className="w-3 h-3 text-slate-400" />
              <span>{item.file_size}</span>
            </span>
          )}
        </div>
      </div>

      {/* Bottom Action: Preview + Download + Admin Delete */}
      <div className="pt-1 flex items-center gap-2">
        {/* Preview PDF Button */}
        <button
          type="button"
          id={`preview-resource-btn-${item.id}`}
          onClick={(e) => onOpenPreview(item, e)}
          className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200 font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-xs cursor-pointer"
          title="Preview PDF document without downloading"
        >
          <Eye className="w-3.5 h-3.5 text-[#1E5AFF]" />
          <span>Preview</span>
        </button>

        {/* Download PDF Button */}
        <button
          type="button"
          id={`download-resource-btn-${item.id}`}
          onClick={() => onDownload(item)}
          className="flex-1 bg-[#1E5AFF] hover:bg-[#1546CC] text-white font-extrabold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-xs cursor-pointer border border-blue-600/20"
          title="Download PDF file directly"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Download</span>
        </button>

        {/* Second Bottom Admin Delete Button */}
        {isAdmin && (
          <button
            type="button"
            id={`delete-resource-btn-bottom-${item.id}`}
            onClick={e => onOpenDeleteModal(item, e)}
            className="px-3 py-2.5 bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 border border-slate-200 hover:border-rose-200 rounded-xl transition-colors cursor-pointer flex items-center justify-center shrink-0 active:scale-95"
            title="Delete PDF Resource"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export const ResourceCard = React.memo<ResourceCardProps>(ResourceCardComponent, (prev, next) => {
  return (
    prev.item.id === next.item.id &&
    prev.item.title === next.item.title &&
    prev.item.file_size === next.item.file_size &&
    prev.item.subject === next.item.subject &&
    prev.item.class === next.item.class &&
    prev.isSelected === next.isSelected &&
    prev.isAdmin === next.isAdmin
  );
});

ResourceCard.displayName = 'ResourceCard';
