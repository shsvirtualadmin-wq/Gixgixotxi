import React, { useState, useEffect, useMemo } from 'react';
import {
  Compass,
  MapPin,
  Calendar,
  Calculator,
  Search,
  ExternalLink,
  Target,
  ArrowRight,
  GraduationCap,
} from 'lucide-react';
import { db, logFirestoreError } from '../../lib/firebase';
import { collection, query, limit, getDocs } from 'firebase/firestore';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Skeleton } from '../ui/Skeleton';
import { EmptyState } from '../ui/EmptyState';
import { ErrorState } from '../ui/ErrorState';
import { UNIVERSITIES, University } from '../../data/universities';

interface UniversityExplorerViewProps {
  onCalculateMerit: (uniId: string) => void;
  onStartDrill: (subject?: string) => void;
}

export const UniversityExplorerView: React.FC<UniversityExplorerViewProps> = ({
  onCalculateMerit,
  onStartDrill,
}) => {
  const [unis, setUnis] = useState<University[]>(UNIVERSITIES);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTag, setSelectedTag] = useState<string>('All');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorInfo, setErrorInfo] = useState<{ message: string; path?: string } | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchUnis = async () => {
      setIsLoading(true);
      setErrorInfo(null);
      const path = 'universities';

      try {
        const snap = await getDocs(query(collection(db, 'universities'), limit(50)));
        if (!snap.empty && isMounted) {
          const loaded: University[] = snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as any),
          }));
          setUnis(loaded);
        }
      } catch (err: any) {
        logFirestoreError(path, err, 'uni_explorer_fetch');
        if (isMounted) {
          setErrorInfo({
            message: err?.message || 'Could not fetch universities registry from Firestore.',
            path,
          });
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchUnis();
    return () => {
      isMounted = false;
    };
  }, []);

  const filteredUnis = useMemo(() => {
    return unis.filter((u) => {
      const matchSearch =
        !searchQuery.trim() ||
        u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.shortName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.city && u.city.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchTag =
        selectedTag === 'All' ||
        (selectedTag === 'Engineering' && (u.shortName === 'FAST' || u.shortName === 'NUST' || u.shortName === 'GIKI' || u.shortName === 'UET' || u.shortName === 'PIEAS' || u.shortName === 'NED')) ||
        (selectedTag === 'Medical' && (u.shortName === 'MDCAT' || u.shortName === 'NUMS' || u.shortName === 'AKU' || u.fullName.includes('Medical'))) ||
        (selectedTag === 'Business' && (u.shortName === 'LUMS' || u.shortName === 'IBA'));

      return matchSearch && matchTag;
    });
  }, [unis, searchQuery, selectedTag]);

  return (
    <div className="space-y-6 text-left font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--text)] tracking-tight font-display">
            Pakistani Universities Explorer
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1">
            Entrance criteria, testing dates, campus locations, and programs across Pakistan.
          </p>
        </div>
      </div>

      {errorInfo && (
        <ErrorState
          title="Could not load universities registry"
          error={errorInfo.message}
          path={errorInfo.path}
        />
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {['All', 'Engineering', 'Medical', 'Business'].map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => setSelectedTag(tag)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedTag === tag
                  ? 'bg-[var(--brand)] text-white shadow-md shadow-blue-600/30'
                  : 'bg-white/5 text-[var(--text-muted)] hover:text-white hover:bg-white/10'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-3 text-[var(--text-faint)]" />
          <input
            type="text"
            placeholder="Search university name, city, test..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-9 pr-3 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:ring-2 focus:ring-[var(--brand)]"
          />
        </div>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} variant="rectangular" height={220} className="rounded-3xl" />
          ))}
        </div>
      )}

      {!isLoading && filteredUnis.length === 0 && (
        <EmptyState
          title="No universities found"
          description="Try adjusting your search criteria or stream filters."
          action={{
            label: 'Clear Search',
            onClick: () => {
              setSearchQuery('');
              setSelectedTag('All');
            },
          }}
        />
      )}

      {/* Universities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredUnis.map((uni) => (
          <Card
            key={uni.id}
            variant="glass"
            className="p-5 flex flex-col justify-between space-y-4 hover:border-white/20 transition-all text-left"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-[var(--brand)]/15 border border-[var(--brand)]/30 text-[var(--brand-2)]">
                  {uni.shortName}
                </span>
                <span className="text-xs text-[var(--text-faint)] flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {uni.city || 'Pakistan'}
                </span>
              </div>

              <div>
                <h3 className="text-base font-bold text-white leading-snug">
                  {uni.fullName}
                </h3>
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  Entry Test: <span className="text-white font-medium">{uni.testName || 'Entrance Exam'}</span>
                </p>
              </div>

              {uni.programs && uni.programs.length > 0 && (
                <div className="space-y-1">
                  <span className="text-[10px] text-[var(--text-faint)] font-bold uppercase tracking-wider block">
                    Key Programs
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {uni.programs.slice(0, 4).map((prog) => (
                      <span
                        key={prog}
                        className="px-2 py-0.5 rounded-md bg-white/5 border border-white/8 text-[11px] text-[var(--text-muted)]"
                      >
                        {prog}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-white/8 flex items-center justify-between gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onCalculateMerit(uni.id)}
                leftIcon={<Calculator className="w-3.5 h-3.5" />}
                className="text-xs flex-1 justify-center"
              >
                Merit Meter
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => onStartDrill('Mathematics')}
                rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                className="text-xs flex-1 justify-center"
              >
                Drill Past Papers
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
