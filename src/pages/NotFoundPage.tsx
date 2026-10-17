import { Link } from 'react-router-dom';
import { PageMeta } from '@/components/ui/PageMeta';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Home, ArrowLeft } from 'lucide-react';

export function NotFoundPage() {
  return (
    <>
      <PageMeta
        title="404 — Page Not Found"
        description="The page you are looking for does not exist on Boardly."
      />
      <div className="pt-32 pb-24 boardly-container page-enter min-h-[60vh] flex items-center justify-center">
        <Card className="max-w-lg w-full text-center p-8 sm:p-12 space-y-6">
          <Badge color="red">Error 404</Badge>

          <div>
            <h1
              className="text-6xl sm:text-7xl font-extrabold text-[var(--red)] font-doto tracking-tight"
              style={{ fontFamily: 'var(--font-dot)' }}
            >
              404
            </h1>
            <h2
              className="text-2xl sm:text-3xl font-bold text-[var(--text)] mt-3"
              style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}
            >
              Page Not Found
            </h2>
            <p className="text-sm text-[var(--muted)] mt-2 leading-relaxed">
              The link you followed may be broken, or the page may have been moved or removed.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/"
              className="btn-red w-full sm:w-auto flex items-center justify-center gap-2"
              style={{ height: '52px', minWidth: '160px' }}
            >
              <Home size={18} />
              <span>Back to Home</span>
            </Link>
            <button
              onClick={() => window.history.back()}
              className="btn-outline w-full sm:w-auto flex items-center justify-center gap-2"
              style={{ height: '52px', minWidth: '140px' }}
            >
              <ArrowLeft size={18} />
              <span>Go Back</span>
            </button>
          </div>
        </Card>
      </div>
    </>
  );
}

export default NotFoundPage;
