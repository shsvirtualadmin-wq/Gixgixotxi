import React from 'react';
import { Link } from 'react-router-dom';
import { Trash2, ArrowLeft, Search, BookOpen } from 'lucide-react';
import { PageMeta } from '@/components/ui/PageMeta';

interface GonePageProps {
  title?: string;
  message?: string;
}

export const GonePage: React.FC<GonePageProps> = ({
  title = 'This content has been removed (410)',
  message = 'The post or study resource you are looking for was removed by its author or moderated under Boardly Community Guidelines.',
}) => {
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] pt-32 pb-24 px-4 flex items-center justify-center">
      <PageMeta
        title="Content Removed (410) — Boardly"
        description="This resource is no longer available on Boardly."
        noindex={true}
      />

      <div className="glass-panel max-w-lg w-full p-8 sm:p-10 text-center">
        <div className="w-12 h-12 rounded-2xl bg-[#D71921]/15 border border-[#D71921]/35 flex items-center justify-center text-[#D71921] mx-auto mb-4">
          <Trash2 size={22} />
        </div>

        <div className="section-chip-red mx-auto mb-3">410 Gone</div>
        <h1 className="font-dot text-2xl sm:text-3xl font-bold text-white mb-3">{title}</h1>
        <p className="text-sm text-white/70 leading-relaxed mb-8">{message}</p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link to="/commons" className="btn-primary px-5 py-2.5 text-xs font-semibold inline-flex items-center gap-2">
            <ArrowLeft size={14} />
            <span>Back to Boardly Commons</span>
          </Link>
          <Link to="/material" className="btn-secondary px-5 py-2.5 text-xs font-semibold inline-flex items-center gap-2">
            <BookOpen size={14} />
            <span>Study Material Library</span>
          </Link>
          <Link to="/search" className="btn-secondary px-5 py-2.5 text-xs font-semibold inline-flex items-center gap-2">
            <Search size={14} />
            <span>Search Boardly</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default GonePage;
