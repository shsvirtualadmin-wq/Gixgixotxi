import { Link } from 'react-router-dom';
import { PageMeta } from '@/components/ui/PageMeta';
import { Logo } from '@/components/ui/Logo';
import { Home, ArrowLeft } from 'lucide-react';
import { useHomeUrl, useSmartBack } from '@/utils/homeUrl';
import { useLanguage } from '@/contexts/LanguageContext';

export function NotFoundPage() {
  const homeUrl = useHomeUrl();
  const handleBack = useSmartBack();
  const { t } = useLanguage();

  return (
    <>
      <PageMeta
        title={`404 — ${t('notFound.title')}`}
        description={t('notFound.metaDescription')}
      />
      <div className="pt-32 pb-24 boardly-container page-enter min-h-[60vh] flex items-center justify-center">
        <div className="glass-panel max-w-lg w-full text-center p-8 sm:p-12 space-y-6 rounded-[32px] sm:rounded-[36px] ">
          <div className="flex justify-center pb-1">
            <Link to={homeUrl} aria-label="Boardly">
              <Logo height={32} className="text-[var(--text)] hover:opacity-80 transition-opacity" />
            </Link>
          </div>
          <div className="flex justify-center">
            <span className="section-chip-red">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D71921] animate-pulse" />
              {t('notFound.error404')}
            </span>
          </div>

          <div>
            <h1
              className="text-6xl sm:text-7xl font-black text-[#D71921] font-dot tracking-tight drop-shadow-[0_0_24px_rgba(215,25,33,0.4)] ltr-nums"
              style={{ fontFamily: 'var(--font-dot)' }}
            >
              404
            </h1>
            <h2
              className="text-2xl sm:text-3xl font-black text-[var(--text)] mt-3 font-dot tracking-tight"
              style={{ fontFamily: 'var(--font-dot)' }}
            >
              {t('notFound.title')}
            </h2>
            <p className="text-sm text-[var(--muted)] mt-2 leading-relaxed">
              {t('notFound.description')}
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to={homeUrl}
              className="btn-primary w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-bold active:scale-[0.98]"
            >
              <Home size={18} />
              <span>{t('notFound.backToHome')}</span>
            </Link>
            <button
              onClick={handleBack}
              className="btn-secondary w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-semibold active:scale-[0.98]"
            >
              <ArrowLeft size={18} className="rtl-mirror" />
              <span>{t('common.goBack')}</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default NotFoundPage;
