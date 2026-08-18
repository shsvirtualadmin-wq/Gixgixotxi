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
  Physics: { bg: 'bg-cyan-500/15', text: 'text-cyan-400', border: 'border-cyan-500/30' },
  Chemistry: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  Biology: { bg: 'bg-teal-500/15', text: 'text-teal-400', border: 'border-teal-500/30' },
  Mathematics: { bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/30' },
  'Computer Science': { bg: 'bg-indigo-500/15', text: 'text-indigo-400', border: 'border-indigo-500/30' },
  English: { bg: 'bg-purple-500/15', text: 'text-purple-400', border: 'border-purple-500/30' },
  'Logical Reasoning': { bg: 'bg-pink-500/15', text: 'text-pink-400', border: 'border-pink-500/30' },
  General: { bg: 'bg-slate-500/15', text: 'text-slate-300', border: 'border-slate-500/30' },
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

export const ResourceCard = React.memo<ResourceCardProps>(({
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
      className={`bg-[#131f42] hover:bg-[#17254e] border ${
        isSelected
          ? 'border-[#1a6dff] ring-1 ring-[#1a6dff]/40 bg-[#13224f]'
          : 'border-[#1e3a8a]/50 hover:border-[#1a6dff]/60'
      } rounded-2xl p-4 sm:p-4.5 transition-colors shadow-sm group flex flex-col justify-between gap-3 relative`}
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
                  ? 'bg-[#1a6dff] border-[#1a6dff] text-white shadow-sm shadow-[#1a6dff]/40'
                  : 'bg-[#0d1b3e] border-[#1e3a8a] text-transparent hover:border-[#1a6dff]/50'
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
            <span className="text-[10px] font-extrabold text-[#94a3b8] bg-[#0d1b3e] border border-[#1e3a8a] px-2.5 py-0.5 rounded-full">
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
            className="text-[#94a3b8] hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-500/10 transition-colors cursor-pointer"
            title="Delete PDF Resource"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Middle: Document Title & Metadata */}
      <div className="space-y-1.5">
        <h4 className="font-['Space_Grotesk'] font-bold text-sm sm:text-base text-white group-hover:text-blue-200 transition-colors leading-snug line-clamp-2">
          {item.title}
        </h4>

        <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#94a3b8] font-medium pt-0.5">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3 text-[#1a6dff]" />
            <span>{formatDate(item.created_at)}</span>
          </span>
          {item.file_size && (
            <span className="flex items-center gap-1">
              <FileText className="w-3 h-3 text-[#94a3b8]" />
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
          className="flex-1 bg-[#1e293b] hover:bg-[#1a6dff]/20 text-slate-200 hover:text-white border border-[#1e3a8a]/70 hover:border-[#1a6dff]/60 font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-sm cursor-pointer"
          title="Preview PDF document without downloading"
        >
          <Eye className="w-3.5 h-3.5 text-[#1a6dff]" />
          <span>Preview</span>
        </button>

        {/* Download PDF Button */}
        <button
          type="button"
          id={`download-resource-btn-${item.id}`}
          onClick={() => onDownload(item)}
          className="flex-1 bg-[#1a6dff] hover:bg-[#1557cc] text-white font-extrabold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-sm cursor-pointer border border-blue-400/20"
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
            className="px-3 py-2.5 bg-[#0d1b3e] hover:bg-rose-500/15 text-[#94a3b8] hover:text-rose-400 border border-[#1e3a8a]/60 hover:border-rose-500/40 rounded-xl transition-colors cursor-pointer flex items-center justify-center shrink-0 active:scale-95"
            title="Delete PDF Resource"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
});

ResourceCard.displayName = 'ResourceCard';
