import React, { useState, useEffect, useId, useRef, useCallback, Suspense, lazy } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FileText,
  Download,
  Upload,
  Sparkles,
  Calendar,
  Layers,
  Search,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Plus,
  Loader2,
  ExternalLink,
  BookOpen,
  Filter,
  X,
  FileCheck,
  CheckSquare,
  Square,
  Check,
  Eye,
  Maximize2,
  Image as ImageIcon,
  FileDown,
  StickyNote,
  Highlighter,
  MessageSquarePlus,
  PenTool,
  Bookmark,
  ShieldCheck,
  Activity,
  Wrench,
  RefreshCw,
  GraduationCap,
} from 'lucide-react';
import { triggerHaptic, HAPTIC_PATTERNS } from '../lib/haptics';
import { ResourceCategory, ResourceItem } from '../types';
import { SegmentedControl } from './SegmentedControl';
import { exportPdfPageToImage, downloadDataUrlAsFile, openExternalPdfBrowser, downloadPdfDocument } from '../lib/pdfExport';
import { validatePdfFile } from '../lib/pdfValidator';
import {
  runLibraryIntegrityScan,
  LibraryIntegrityReport,
  IntegrityCheckItem,
} from '../lib/pdfIntegrityChecker';
import { ResourceCard } from './ResourceCard';
import {
  StudyStickyNote,
  StudyHighlight,
  getStudyNotesForResource,
  saveStudyNotesForResource,
  getStudyHighlightsForResource,
  saveStudyHighlightsForResource
} from '../lib/studyAnnotations';
import {
  User,
  StudentProfile,
  fetchResourcesFromSupabase,
  uploadResourceToHub,
  deleteResourceFromHub,
  isAdminEmail
} from '../lib/supabase';

const InlinePdfViewer = lazy(() => import('./InlinePdfViewer').then(m => ({ default: m.InlinePdfViewer })));
const UploadResourceDrawer = lazy(() => import('./UploadResourceDrawer').then(m => ({ default: m.UploadResourceDrawer })));

export const CLASS_TABS = [
  'All Classes',
  'Class 9',
  'Class 10',
  'Class 11',
  'Class 12',
  'MDCAT',
  'TCAT'
] as const;

/**
 * Extracts and normalizes the student's authorized class labels
 */
export function getStudentAllowedClasses(profile: StudentProfile | null | undefined, isAdmin: boolean): string[] {
  if (isAdmin) {
    return ['Class 9', 'Class 10', 'Class 11', 'Class 12', 'MDCAT', 'TCAT'];
  }
  if (!profile) return ['Class 11'];

  const allowed = new Set<string>();

  // 1. Check assigned_classes array (e.g. ['Class 9 Medical', 'Class 9', 'MDCAT'])
  if (Array.isArray(profile.assigned_classes) && profile.assigned_classes.length > 0) {
    profile.assigned_classes.forEach(c => {
      const cStr = String(c).trim().toUpperCase();
      if (cStr.includes('MDCAT')) allowed.add('MDCAT');
      else if (cStr.includes('TCAT') || cStr.includes('UET') || cStr.includes('ECAT')) allowed.add('TCAT');
      else if (cStr.includes('9') || cStr.includes('NINTH')) allowed.add('Class 9');
      else if (cStr.includes('10') || cStr.includes('TENTH') || cStr.includes('MATRIC')) allowed.add('Class 10');
      else if (cStr.includes('11') || cStr.includes('FIRST') || cStr.includes('FSC 1')) allowed.add('Class 11');
      else if (cStr.includes('12') || cStr.includes('SECOND') || cStr.includes('FSC 2')) allowed.add('Class 12');
    });
  }

  // 2. Check grade & stream & package_name & subscribed_plans
  const gStr = (profile.grade || '').trim().toUpperCase();
  const sStr = (profile.stream || '').trim().toUpperCase();
  const pStr = (profile.package_name || '').trim().toUpperCase();
  const plansStr = Array.isArray(profile.subscribed_plans) ? profile.subscribed_plans.join(' ').toUpperCase() : '';

  const combined = `${gStr} ${sStr} ${pStr} ${plansStr}`;
  if (combined.includes('MDCAT')) allowed.add('MDCAT');
  if (combined.includes('TCAT') || combined.includes('UET') || combined.includes('ECAT')) allowed.add('TCAT');
  if (gStr.includes('9') || gStr.includes('NINTH') || combined.includes('CLASS 9') || combined.includes('GRADE 9')) allowed.add('Class 9');
  if (gStr.includes('10') || gStr.includes('TENTH') || combined.includes('CLASS 10') || combined.includes('GRADE 10')) allowed.add('Class 10');
  if (gStr.includes('11') || gStr.includes('FIRST YEAR') || gStr.includes('FSC 1') || combined.includes('CLASS 11') || combined.includes('GRADE 11')) allowed.add('Class 11');
  if (gStr.includes('12') || gStr.includes('SECOND YEAR') || gStr.includes('FSC 2') || combined.includes('CLASS 12') || combined.includes('GRADE 12')) allowed.add('Class 12');

  // 3. Fallback if set is empty
  if (allowed.size === 0) {
    if (gStr.includes('9')) allowed.add('Class 9');
    else if (gStr.includes('10')) allowed.add('Class 10');
    else if (gStr.includes('11')) allowed.add('Class 11');
    else if (gStr.includes('12')) allowed.add('Class 12');
    else allowed.add('Class 11');
  }

  return Array.from(allowed);
}

/**
 * Checks if a specific resource is authorized for a student's assigned class & track
 */
export function isResourceAllowed(
  resource: ResourceItem,
  allowedClasses: string[],
  userProfile: StudentProfile | null | undefined,
  isAdmin: boolean
): boolean {
  if (isAdmin) return true;
  if (!resource) return false;

  const resClass = (resource.class || '').trim();
  // Universal resources
  if (resClass.toLowerCase() === 'all' || resClass.toLowerCase() === 'all classes' || resClass.toLowerCase() === 'general') {
    return true;
  }

  // Check if resource class matches any allowed class
  const classMatches = allowedClasses.some(ac => {
    const normAc = ac.toLowerCase().replace(/\s+/g, '');
    const normRc = resClass.toLowerCase().replace(/\s+/g, '');
    return normRc.includes(normAc) || normAc.includes(normRc);
  });

  if (!classMatches) {
    return false;
  }

  // Stream-specific filtering (e.g. Medical students don't see pure Computer Science papers, CS students don't see Biology papers)
  const sStr = (userProfile?.stream || '').trim().toLowerCase();
  const resSubject = (resource.subject || '').trim().toLowerCase();

  const isMedical = sStr.includes('med') || sStr.includes('bio');
  const isCS = sStr.includes('comp') || sStr.includes('ics') || sStr.includes('cs');
  const isEng = sStr.includes('eng') && !sStr.includes('english');

  if (isMedical && resSubject === 'computer science') {
    return false;
  }
  if (isCS && resSubject === 'biology') {
    return false;
  }
  if (isEng && resSubject === 'biology') {
    return false;
  }

  return true;
}

const SUBJECT_COLOR_MAP: Record<string, { bg: string; text: string; border: string }> = {
  Physics: { bg: 'bg-blue-500/15', text: 'text-blue-300', border: 'border-blue-400/30' },
  Chemistry: { bg: 'bg-emerald-500/15', text: 'text-emerald-300', border: 'border-emerald-400/30' },
  Biology: { bg: 'bg-rose-500/15', text: 'text-rose-300', border: 'border-rose-400/30' },
  Mathematics: { bg: 'bg-amber-500/15', text: 'text-amber-300', border: 'border-amber-400/30' },
  English: { bg: 'bg-indigo-500/15', text: 'text-indigo-300', border: 'border-indigo-400/30' },
  'Computer Science': { bg: 'bg-purple-500/15', text: 'text-purple-300', border: 'border-purple-400/30' },
  'Logical Reasoning': { bg: 'bg-pink-500/15', text: 'text-pink-300', border: 'border-pink-400/30' },
};

function getSubjectBadge(subject: string) {
  const norm = Object.keys(SUBJECT_COLOR_MAP).find(k => subject.toLowerCase().includes(k.toLowerCase()));
  if (norm && SUBJECT_COLOR_MAP[norm]) {
    return SUBJECT_COLOR_MAP[norm];
  }
  return { bg: 'bg-sky-500/15', text: 'text-sky-300', border: 'border-sky-400/30' };
}

function formatDate(isoString: string): string {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return 'Recently';
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  } catch {
    return 'Recently';
  }
}

interface ResourcesHubProps {
  currentUser?: User | null;
  userProfile?: StudentProfile | null;
  isAdmin?: boolean;
}

export const ResourcesHub: React.FC<ResourcesHubProps> = ({
  currentUser,
  userProfile,
  isAdmin: propIsAdmin = false,
}) => {
  const fileInputId = useId();
  const isAdmin = propIsAdmin || isAdminEmail(currentUser?.email);

  // Compute allowed classes for current user
  const allowedClasses = React.useMemo(() => {
    return getStudentAllowedClasses(userProfile, isAdmin);
  }, [userProfile, isAdmin]);

  // Compute available class filter tabs
  const availableClassTabs = React.useMemo(() => {
    if (isAdmin) {
      return [...CLASS_TABS];
    }
    if (allowedClasses.length > 1) {
      return ['All My Classes', ...allowedClasses];
    }
    return allowedClasses.length > 0 ? allowedClasses : ['Class 11'];
  }, [isAdmin, allowedClasses]);

  // Active Category State
  const [activeCategory, setActiveCategory] = useState<ResourceCategory>('past_paper');

  // Resource Data State
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState<string>('');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>(() => {
    if (isAdmin) return 'All Classes';
    if (allowedClasses.length > 1) return 'All My Classes';
    return allowedClasses[0] || 'Class 9';
  });

  // Debounce search input (300ms) to prevent expensive re-filters and re-renders on every keystroke
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset pagination display limit when filters change
  useEffect(() => {
    setDisplayLimit(16);
  }, [activeCategory, selectedClassFilter, debouncedSearchQuery]);

  // Ensure selectedClassFilter stays valid if profile or role changes
  useEffect(() => {
    if (isAdmin) {
      if (!CLASS_TABS.includes(selectedClassFilter as any)) {
        setSelectedClassFilter('All Classes');
      }
    } else {
      if (!availableClassTabs.includes(selectedClassFilter)) {
        setSelectedClassFilter(availableClassTabs[0] || 'Class 9');
      }
    }
  }, [isAdmin, availableClassTabs, selectedClassFilter]);

  // Admin Upload Modal / Inline State with persistence across re-renders and remounts
  const [showUploadForm, setShowUploadFormState] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('boardly_hub_upload_open') === 'true';
    } catch {
      return false;
    }
  });

  const setShowUploadForm = useCallback((valOrUpdater: boolean | ((prev: boolean) => boolean)) => {
    setShowUploadFormState(prev => {
      const nextVal = typeof valOrUpdater === 'function' ? valOrUpdater(prev) : valOrUpdater;
      try {
        if (nextVal) {
          sessionStorage.setItem('boardly_hub_upload_open', 'true');
        } else {
          sessionStorage.removeItem('boardly_hub_upload_open');
        }
      } catch {}
      return nextVal;
    });
  }, []);
  const [uploadInitialData, setUploadInitialData] = useState<{ title?: string; subject?: string; targetClass?: string; errorMsg?: string } | null>(null);
  
  // Custom Delete Confirmation Modal State
  const [resourceToDelete, setResourceToDelete] = useState<ResourceItem | null>(null);
  const [isDeletingResource, setIsDeletingResource] = useState<boolean>(false);
  const [deleteResourceError, setDeleteResourceError] = useState<string | null>(null);

  // Multi-Select / Bulk Delete State
  const [selectedResourceIds, setSelectedResourceIds] = useState<string[]>([]);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState<boolean>(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState<boolean>(false);
  const [bulkDeleteError, setBulkDeleteError] = useState<string | null>(null);

  // PDF In-App Preview Modal State
  const [previewResource, setPreviewResource] = useState<ResourceItem | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState<boolean>(true);
  const [displayLimit, setDisplayLimit] = useState<number>(16);
  const [previewSearchQuery, setPreviewSearchQuery] = useState<string>('');
  const [isExportingPng, setIsExportingPng] = useState<boolean>(false);
  const [exportSuccessMsg, setExportSuccessMsg] = useState<string | null>(null);
  const [exportErrorMsg, setExportErrorMsg] = useState<string | null>(null);
  const [exportPageNumber, setExportPageNumber] = useState<number>(1);
  const [previewTotalPages, setPreviewTotalPages] = useState<number>(1);
  const [showExportMenu, setShowExportMenu] = useState<boolean>(false);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);

  // Study Annotations State (Sticky Notes & Highlights)
  const [studyNotes, setStudyNotes] = useState<StudyStickyNote[]>([]);
  const [studyHighlights, setStudyHighlights] = useState<StudyHighlight[]>([]);
  const [activeStudyTool, setActiveStudyTool] = useState<'none' | 'sticky' | 'highlight'>('none');
  const [selectedStickyColor, setSelectedStickyColor] = useState<StudyStickyNote['color']>('yellow');
  const [selectedHighlightColor, setSelectedHighlightColor] = useState<StudyHighlight['color']>('yellow');
  const [newStickyText, setNewStickyText] = useState<string>('');
  const [newHighlightText, setNewHighlightText] = useState<string>('');
  const [newHighlightNote, setNewHighlightNote] = useState<string>('');
  const [showAddHighlightModal, setShowAddHighlightModal] = useState<boolean>(false);
  const [showNotesDrawer, setShowNotesDrawer] = useState<boolean>(false);

  // Background Storage Integrity Scanner State
  const [showIntegrityModal, setShowIntegrityModal] = useState<boolean>(false);
  const [isScanningIntegrity, setIsScanningIntegrity] = useState<boolean>(false);
  const [integrityReport, setIntegrityReport] = useState<LibraryIntegrityReport | null>(null);
  const [scanProgress, setScanProgress] = useState<{ current: number; total: number; currentItemName?: string }>({ current: 0, total: 0 });
  const [isDeletingCorrupted, setIsDeletingCorrupted] = useState<boolean>(false);
  const [corruptedActionMsg, setCorruptedActionMsg] = useState<string | null>(null);

  // Load Resources from backend/Supabase (Real database items only)
  const loadResources = async () => {
    setIsLoading(true);
    try {
      const items = await fetchResourcesFromSupabase(
        undefined,
        undefined,
        currentUser?.email || userProfile?.email,
        userProfile
      );

      let deletedIds: string[] = [];
      try {
        deletedIds = JSON.parse(localStorage.getItem('boardly_deleted_resources') || '[]');
      } catch {}

      if (Array.isArray(items)) {
        const realItems = items.filter(r => !deletedIds.includes(r.id));
        setResources(realItems);
      } else {
        setResources([]);
      }
    } catch (err) {
      console.warn('Could not load database resources:', err);
      setResources([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadResources();
  }, [userProfile?.grade, userProfile?.stream, userProfile?.assigned_classes]);

  // Filter resources strictly by student authorization, category, class tab, and search query
  const filteredResources = React.useMemo(() => {
    return resources.filter(res => {
      // 1. Category filter
      if (res.category !== activeCategory) return false;

      // 2. Strict Class & Track Authorization Filter
      if (!isResourceAllowed(res, allowedClasses, userProfile, isAdmin)) {
        return false;
      }

      // 3. Tab Filter
      if (isAdmin) {
        if (selectedClassFilter !== 'All' && selectedClassFilter !== 'All Classes') {
          const target = selectedClassFilter.toLowerCase();
          const resClass = (res.class || '').toLowerCase();
          if (!resClass.includes(target) && resClass !== 'all' && resClass !== 'all classes') {
            return false;
          }
        }
      } else {
        if (selectedClassFilter !== 'All My Classes' && selectedClassFilter !== 'All' && selectedClassFilter !== 'All Classes') {
          const target = selectedClassFilter.toLowerCase();
          const resClass = (res.class || '').toLowerCase();
          if (!resClass.includes(target) && resClass !== 'all' && resClass !== 'all classes') {
            return false;
          }
        }
      }

      // 4. Search Filter
      if (debouncedSearchQuery.trim()) {
        const q = debouncedSearchQuery.toLowerCase().trim();
        const matchTitle = res.title.toLowerCase().includes(q);
        const matchSubj = res.subject.toLowerCase().includes(q);
        const matchClass = (res.class || '').toLowerCase().includes(q);
        if (!matchTitle && !matchSubj && !matchClass) return false;
      }

      return true;
    });
  }, [resources, activeCategory, selectedClassFilter, allowedClasses, userProfile, isAdmin, debouncedSearchQuery]);

  // Container ref for resource list
  const listContainerRef = useRef<HTMLDivElement | null>(null);

  // Handler for class filter tab click that guarantees zero scroll jump and instant in-memory filtering
  const handleSelectClassFilter = useCallback((tab: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    triggerHaptic(HAPTIC_PATTERNS.light);
    setSelectedClassFilter(tab);
  }, []);

  // Handler for category tab switch with haptics and event stabilization
  const handleSelectCategory = useCallback((cat: ResourceCategory, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    triggerHaptic(HAPTIC_PATTERNS.light);
    setActiveCategory(cat);
  }, []);

  // Launch background library integrity scan
  const handleStartIntegrityScan = async () => {
    if (resources.length === 0) return;
    setIsScanningIntegrity(true);
    setCorruptedActionMsg(null);
    setScanProgress({ current: 0, total: resources.length, currentItemName: 'Initializing scan...' });
    triggerHaptic(HAPTIC_PATTERNS.medium);

    try {
      const report = await runLibraryIntegrityScan(resources, {
        concurrency: 3,
        onProgress: (scanned, total, current) => {
          setScanProgress({ current: scanned, total, currentItemName: current.title });
        },
      });
      setIntegrityReport(report);
      triggerHaptic(report.corruptedCount > 0 ? HAPTIC_PATTERNS.error : HAPTIC_PATTERNS.success);
    } catch (err: any) {
      console.error('Integrity scan error:', err);
      setCorruptedActionMsg('Integrity scan failed to complete. Please try again.');
    } finally {
      setIsScanningIntegrity(false);
    }
  };

  // Delete a corrupted resource found by integrity scanner
  const handleDeleteCorruptedItem = async (item: IntegrityCheckItem) => {
    setIsDeletingCorrupted(true);
    setCorruptedActionMsg(null);
    triggerHaptic(HAPTIC_PATTERNS.light);

    try {
      const res = await deleteResourceFromHub(item.id, currentUser?.email || 'shsvirtualadmin@gmail.com');
      if (res.success) {
        try {
          const deleted: string[] = JSON.parse(localStorage.getItem('boardly_deleted_resources') || '[]');
          if (!deleted.includes(item.id)) {
            deleted.push(item.id);
            localStorage.setItem('boardly_deleted_resources', JSON.stringify(deleted));
          }
        } catch {}
        setResources(prev => prev.filter(r => r.id !== item.id));
        if (integrityReport) {
          const updatedItems = integrityReport.items.filter(i => i.id !== item.id);
          const updatedCorrupted = integrityReport.corruptedItems.filter(i => i.id !== item.id);
          setIntegrityReport({
            ...integrityReport,
            totalScanned: updatedItems.length,
            corruptedCount: updatedCorrupted.length,
            items: updatedItems,
            corruptedItems: updatedCorrupted,
          });
        }
        triggerHaptic(HAPTIC_PATTERNS.success);
        setCorruptedActionMsg(`Successfully removed corrupted file "${item.title}".`);
      } else {
        throw new Error(res.error || 'Failed to remove corrupted file.');
      }
    } catch (err: any) {
      setCorruptedActionMsg(err?.message || 'Failed to remove corrupted file.');
      triggerHaptic(HAPTIC_PATTERNS.error);
    } finally {
      setIsDeletingCorrupted(false);
    }
  };

  // Delete all corrupted files found during integrity scan
  const handleDeleteAllCorrupted = async () => {
    if (!integrityReport || integrityReport.corruptedItems.length === 0) return;
    setIsDeletingCorrupted(true);
    setCorruptedActionMsg(null);
    triggerHaptic(HAPTIC_PATTERNS.medium);

    const idsToDelete = integrityReport.corruptedItems.map(i => i.id);
    const email = currentUser?.email || 'shsvirtualadmin@gmail.com';

    try {
      await Promise.allSettled(idsToDelete.map(id => deleteResourceFromHub(id, email)));

      try {
        const deleted: string[] = JSON.parse(localStorage.getItem('boardly_deleted_resources') || '[]');
        const updatedDeleted = Array.from(new Set([...deleted, ...idsToDelete]));
        localStorage.setItem('boardly_deleted_resources', JSON.stringify(updatedDeleted));
      } catch {}

      setResources(prev => prev.filter(r => !idsToDelete.includes(r.id)));
      setIntegrityReport(prev => {
        if (!prev) return null;
        const remainingItems = prev.items.filter(i => !idsToDelete.includes(i.id));
        return {
          ...prev,
          totalScanned: remainingItems.length,
          corruptedCount: 0,
          corruptedItems: [],
          items: remainingItems,
        };
      });

      triggerHaptic(HAPTIC_PATTERNS.success);
      setCorruptedActionMsg(`Cleaned up ${idsToDelete.length} corrupted file(s) from storage.`);
    } catch (err: any) {
      setCorruptedActionMsg(err?.message || 'Failed to remove all corrupted files.');
      triggerHaptic(HAPTIC_PATTERNS.error);
    } finally {
      setIsDeletingCorrupted(false);
    }
  };

  // Pre-fill upload drawer to replace a corrupted file
  const handleReplaceCorruptedItem = (item: IntegrityCheckItem) => {
    setShowIntegrityModal(false);
    if (item.category === 'past_paper' || item.category === 'mcq_drill') {
      setActiveCategory(item.category);
    }
    setUploadInitialData({
      title: item.title || '',
      subject: item.subject,
      targetClass: item.targetClass,
      errorMsg: 'Select a fresh, clean PDF file to replace the corrupted storage item.'
    });
    setShowUploadForm(true);
  };

  // Open Delete Confirmation Modal
  const handleOpenDeleteModal = useCallback((item: ResourceItem, e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic(HAPTIC_PATTERNS.light);
    setResourceToDelete(item);
    setDeleteResourceError(null);
  }, []);

  // Toggle selection for a single resource item
  const handleToggleSelectResource = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic(HAPTIC_PATTERNS.light);
    setSelectedResourceIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  }, []);

  // Toggle Select All for currently visible/filtered resources
  const handleToggleSelectAll = useCallback(() => {
    triggerHaptic(HAPTIC_PATTERNS.light);
    const visibleIds = filteredResources.map(r => r.id);
    const allSelected = visibleIds.length > 0 && visibleIds.every(id => selectedResourceIds.includes(id));
    if (allSelected) {
      setSelectedResourceIds(prev => prev.filter(id => !visibleIds.includes(id)));
    } else {
      setSelectedResourceIds(prev => Array.from(new Set([...prev, ...visibleIds])));
    }
  }, [filteredResources, selectedResourceIds]);

  // Clear all selections
  const handleClearSelection = useCallback(() => {
    triggerHaptic(HAPTIC_PATTERNS.light);
    setSelectedResourceIds([]);
  }, []);

  // Open Bulk Delete Confirmation Modal
  const handleOpenBulkDeleteModal = useCallback(() => {
    if (selectedResourceIds.length === 0) return;
    triggerHaptic(HAPTIC_PATTERNS.light);
    setBulkDeleteError(null);
    setShowBulkDeleteModal(true);
  }, [selectedResourceIds.length]);

  // Execute Batch Deletion upon bulk modal confirmation
  const handleConfirmBulkDelete = async () => {
    if (selectedResourceIds.length === 0) return;

    setIsBulkDeleting(true);
    setBulkDeleteError(null);
    triggerHaptic(HAPTIC_PATTERNS.light);

    const idsToDelete = [...selectedResourceIds];
    const email = currentUser?.email || 'shsvirtualadmin@gmail.com';

    try {
      // Execute all deletes in parallel
      const results = await Promise.allSettled(
        idsToDelete.map(id => deleteResourceFromHub(id, email))
      );

      const successfulIds: string[] = [];
      let failureCount = 0;

      results.forEach((res, index) => {
        const id = idsToDelete[index];
        if (res.status === 'fulfilled' && res.value.success) {
          successfulIds.push(id);
        } else {
          failureCount++;
        }
      });

      if (successfulIds.length > 0) {
        try {
          const deleted: string[] = JSON.parse(localStorage.getItem('boardly_deleted_resources') || '[]');
          const updatedDeleted = Array.from(new Set([...deleted, ...successfulIds]));
          localStorage.setItem('boardly_deleted_resources', JSON.stringify(updatedDeleted));
        } catch {}

        // Immediately remove successful deletes from UI state without page refresh
        setResources(prev => prev.filter(r => !successfulIds.includes(r.id)));
        setSelectedResourceIds(prev => prev.filter(id => !successfulIds.includes(id)));
      }

      if (failureCount === 0) {
        triggerHaptic(HAPTIC_PATTERNS.success);
        setShowBulkDeleteModal(false);
      } else {
        setBulkDeleteError(
          `Deleted ${successfulIds.length} items, but failed to delete ${failureCount} items. Please try again.`
        );
        triggerHaptic(HAPTIC_PATTERNS.error);
      }
    } catch (err: any) {
      setBulkDeleteError(err?.message || 'Bulk deletion failed. Please try again.');
      triggerHaptic(HAPTIC_PATTERNS.error);
    } finally {
      setIsBulkDeleting(false);
    }
  };

  // Execute deletion upon single modal confirmation
  const handleConfirmDeleteResource = async () => {
    if (!resourceToDelete) return;

    const id = resourceToDelete.id;
    setIsDeletingResource(true);
    setDeleteResourceError(null);
    triggerHaptic(HAPTIC_PATTERNS.light);

    try {
      const res = await deleteResourceFromHub(id, currentUser?.email || 'shsvirtualadmin@gmail.com');
      if (res.success) {
        try {
          const deleted: string[] = JSON.parse(localStorage.getItem('boardly_deleted_resources') || '[]');
          if (!deleted.includes(id)) {
            deleted.push(id);
            localStorage.setItem('boardly_deleted_resources', JSON.stringify(deleted));
          }
        } catch {}
        // Immediately remove from UI state without needing page refresh
        setResources(prev => prev.filter(r => r.id !== id));
        setSelectedResourceIds(prev => prev.filter(item => item !== id));
        triggerHaptic(HAPTIC_PATTERNS.success);
        setResourceToDelete(null);
      } else {
        setDeleteResourceError(res.error || 'Could not delete resource. Please try again.');
        triggerHaptic(HAPTIC_PATTERNS.error);
      }
    } catch (err: any) {
      setDeleteResourceError(err?.message || 'Delete operation failed.');
      triggerHaptic(HAPTIC_PATTERNS.error);
    } finally {
      setIsDeletingResource(false);
    }
  };

  // Handle Document In-App Preview Modal
  const handleOpenPreview = useCallback((resItem: ResourceItem, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    triggerHaptic(HAPTIC_PATTERNS.light);
    setIsPreviewLoading(true);
    setPreviewSearchQuery('');
    setExportSuccessMsg(null);
    setExportErrorMsg(null);
    setExportPageNumber(1);
    setShowExportMenu(false);
    setActiveStudyTool('none');
    setShowNotesDrawer(false);
    setShowAddHighlightModal(false);

    // Load saved study notes and highlights for this resource
    const savedNotes = getStudyNotesForResource(resItem.id);
    const savedHighlights = getStudyHighlightsForResource(resItem.id);
    setStudyNotes(savedNotes);
    setStudyHighlights(savedHighlights);

    setPreviewResource(resItem);
  }, []);

  const handleClosePreview = useCallback(() => {
    setPreviewResource(null);
    setIsPreviewLoading(false);
    setPreviewSearchQuery('');
    setExportSuccessMsg(null);
    setExportErrorMsg(null);
    setShowExportMenu(false);
    setActiveStudyTool('none');
    setShowNotesDrawer(false);
    setShowAddHighlightModal(false);
  }, []);

  // Add a new study sticky note
  const handleAddStickyNote = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!previewResource || activeStudyTool !== 'sticky') return;

    const target = e.currentTarget;
    const rect = target.getBoundingClientRect();
    const xPercent = Math.max(5, Math.min(85, ((e.clientX - rect.left) / rect.width) * 100));
    const yPercent = Math.max(5, Math.min(85, ((e.clientY - rect.top) / rect.height) * 100));

    const newNote: StudyStickyNote = {
      id: 'sticky_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      resourceId: previewResource.id,
      pageNumber: exportPageNumber,
      text: 'New study note...',
      color: selectedStickyColor,
      xPercent,
      yPercent,
      createdAt: new Date().toISOString(),
    };

    const updated = [...studyNotes, newNote];
    setStudyNotes(updated);
    saveStudyNotesForResource(previewResource.id, updated);
    triggerHaptic(HAPTIC_PATTERNS.success);
    setExportSuccessMsg('Sticky note pinned to page ' + exportPageNumber);
    setTimeout(() => setExportSuccessMsg(null), 3000);
  };

  // Update a study sticky note text
  const handleUpdateStickyText = (noteId: string, text: string) => {
    if (!previewResource) return;
    const updated = studyNotes.map(n => (n.id === noteId ? { ...n, text } : n));
    setStudyNotes(updated);
    saveStudyNotesForResource(previewResource.id, updated);
  };

  // Delete a study sticky note
  const handleDeleteStickyNote = (noteId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!previewResource) return;
    const updated = studyNotes.filter(n => n.id !== noteId);
    setStudyNotes(updated);
    saveStudyNotesForResource(previewResource.id, updated);
    triggerHaptic(HAPTIC_PATTERNS.light);
  };

  // Add a study highlight / quote
  const handleSaveHighlight = () => {
    if (!previewResource || !newHighlightText.trim()) return;

    const newHighlight: StudyHighlight = {
      id: 'highlight_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      resourceId: previewResource.id,
      pageNumber: exportPageNumber,
      selectedText: newHighlightText.trim(),
      note: newHighlightNote.trim() || undefined,
      color: selectedHighlightColor,
      createdAt: new Date().toISOString(),
    };

    const updated = [...studyHighlights, newHighlight];
    setStudyHighlights(updated);
    saveStudyHighlightsForResource(previewResource.id, updated);

    setNewHighlightText('');
    setNewHighlightNote('');
    setShowAddHighlightModal(false);
    triggerHaptic(HAPTIC_PATTERNS.success);
    setExportSuccessMsg('Study highlight saved to page ' + exportPageNumber);
    setTimeout(() => setExportSuccessMsg(null), 3000);
  };

  // Delete a study highlight
  const handleDeleteHighlight = (highlightId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!previewResource) return;
    const updated = studyHighlights.filter(h => h.id !== highlightId);
    setStudyHighlights(updated);
    saveStudyHighlightsForResource(previewResource.id, updated);
    triggerHaptic(HAPTIC_PATTERNS.light);
  };

  // Handle Exporting Current PDF Page as High-Resolution PNG
  const handleExportPageToPng = async (pageToExport = exportPageNumber) => {
    if (!previewResource || !previewResource.file_url) return;

    setIsExportingPng(true);
    setExportErrorMsg(null);
    setExportSuccessMsg(null);
    triggerHaptic(HAPTIC_PATTERNS.light);

    try {
      const sanitizedName = previewResource.title.replace(/[^a-zA-Z0-9.-]/g, '_');
      const { dataUrl, totalPages } = await exportPdfPageToImage(
        previewResource.file_url,
        pageToExport,
        2.5 // crisp 2.5x high-definition rendering
      );

      downloadDataUrlAsFile(dataUrl, `${sanitizedName}_Page_${pageToExport}.png`);
      triggerHaptic(HAPTIC_PATTERNS.success);
      setExportSuccessMsg(`Page ${pageToExport} of ${totalPages} exported as high-res PNG`);
      setTimeout(() => setExportSuccessMsg(null), 4000);
      setShowExportMenu(false);
    } catch (err: any) {
      console.error('Export PNG failed:', err);
      // Fallback: trigger standard direct file download if canvas extraction failed
      setExportErrorMsg(err?.message || 'High-res image generation failed. You can still download the full PDF.');
      triggerHaptic(HAPTIC_PATTERNS.error);
    } finally {
      setIsExportingPng(false);
    }
  };

  // Handle Real Document File Download (Blob + URL.createObjectURL native download manager trigger)
  const handleDownload = useCallback(async (resItem: ResourceItem) => {
    if (!resItem.file_url) return;
    triggerHaptic(HAPTIC_PATTERNS.light);
    setIsDownloading(true);
    setExportErrorMsg(null);
    setExportSuccessMsg(`Starting download for "${resItem.title}"...`);

    try {
      await downloadPdfDocument(resItem.file_url, resItem.title);
      triggerHaptic(HAPTIC_PATTERNS.success);
      setExportSuccessMsg(`Downloaded "${resItem.title}.pdf"`);
      setTimeout(() => setExportSuccessMsg(null), 3500);
    } catch (err: any) {
      console.error('Download failed:', err);
      setExportErrorMsg(err?.message || 'Download failed. Please try again.');
      triggerHaptic(HAPTIC_PATTERNS.error);
    } finally {
      setIsDownloading(false);
    }
  }, []);

  return (
    <section
      id="resources-hub-section"
      className="bg-white text-slate-900 rounded-3xl p-5 sm:p-7 border border-slate-200 shadow-sm relative overflow-hidden flex flex-col gap-5"
    >
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-[radial-gradient(circle,rgba(30,90,255,0.04)_0%,transparent_70%)] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-[radial-gradient(circle,rgba(99,102,241,0.03)_0%,transparent_70%)] pointer-events-none" />

      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10 border-b border-slate-200 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-black text-[#1E5AFF] uppercase tracking-wider">
            <BookOpen className="w-4 h-4 text-[#1E5AFF]" />
            <span>Digital Library &amp; Archives</span>
          </div>
          <h2 className="font-['Space_Grotesk'] text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <span>Resources Hub</span>
            <span className="text-xs font-bold bg-blue-50 text-[#1E5AFF] border border-blue-200 px-2.5 py-0.5 rounded-full">
              Cloud Library
            </span>
          </h2>
          <p className="text-slate-600 text-xs sm:text-sm font-normal">
            Official solved past papers, model answers, and topical MCQ practice drill sheets.
          </p>
        </div>

        {/* Admin Action Buttons */}
        {isAdmin && (
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <button
              type="button"
              onClick={() => {
                triggerHaptic(HAPTIC_PATTERNS.light);
                setShowIntegrityModal(true);
                if (!integrityReport && !isScanningIntegrity) {
                  handleStartIntegrityScan();
                }
              }}
              className="inline-flex items-center justify-center gap-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 font-bold text-xs sm:text-sm py-2.5 px-3.5 rounded-2xl transition-all active:scale-95 border border-slate-200 cursor-pointer shadow-xs"
              title="Scan entire PDF library for corrupted files or invalid structures"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Verify Storage Integrity</span>
            </button>

            <button
              type="button"
              id="upload-past-paper-btn"
              onClick={() => {
                triggerHaptic(HAPTIC_PATTERNS.light);
                setShowUploadForm(true);
              }}
              className="inline-flex items-center justify-center gap-2 bg-[#1E5AFF] hover:bg-[#1546CC] text-white font-extrabold text-xs sm:text-sm py-2.5 px-4 rounded-2xl transition-all active:scale-95 shadow-md shadow-blue-500/20 cursor-pointer border border-blue-600/30"
            >
              <Upload className="w-4 h-4" />
              <span>Upload {activeCategory === 'past_paper' ? 'Past Paper' : 'MCQs Drill'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Admin Upload Modal Popup (Instantly centered overlay, no layout reflow) */}
      {isAdmin && showUploadForm && (
        <UploadResourceDrawer
          activeCategory={activeCategory}
          currentUser={currentUser}
          initialData={uploadInitialData}
          onClose={() => {
            setShowUploadForm(false);
            setUploadInitialData(null);
          }}
          onSuccess={(newResource) => {
            setResources(prev => [newResource, ...prev]);
          }}
        />
      )}

      {/* CATEGORY TOGGLE SLIDER SWITCH & FILTER CONTROLS */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
        {/* Category Tab Bar (Past Papers & MCQs Drills ONLY - No stray pills or empty slots) */}
        <div
          id="resources-category-segmented-control"
          className="inline-flex items-center p-1 bg-slate-100 border border-slate-200 rounded-2xl sm:rounded-full shrink-0 shadow-xs"
        >
          <button
            type="button"
            id="tab-past-papers"
            onClick={() => handleSelectCategory('past_paper')}
            className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl sm:rounded-full text-xs sm:text-sm font-extrabold transition-all cursor-pointer select-none ${
              activeCategory === 'past_paper'
                ? 'bg-[#1E5AFF] text-white shadow-md shadow-blue-500/25'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <FileText className="w-4 h-4 shrink-0" />
            <span>Past Papers</span>
          </button>

          <button
            type="button"
            id="tab-mcq-drills"
            onClick={() => handleSelectCategory('mcq_drill')}
            className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl sm:rounded-full text-xs sm:text-sm font-extrabold transition-all cursor-pointer select-none ${
              activeCategory === 'mcq_drill'
                ? 'bg-[#1E5AFF] text-white shadow-md shadow-blue-500/25'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <Layers className="w-4 h-4 shrink-0" />
            <span>MCQs Drills</span>
          </button>
        </div>

        {/* Filter Controls (Search + Class Pill Filters / Single-Class Badge) */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1 lg:justify-end">
          {/* Quick Search */}
          <div className="relative flex-1 sm:max-w-xs min-w-[180px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search PDFs..."
              className="w-full bg-slate-50 border border-slate-200 focus:border-[#1E5AFF] text-slate-900 placeholder:text-slate-400 text-xs rounded-2xl pl-8 pr-7 py-2.5 outline-none transition-colors shadow-xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Class Filter: If multiple classes, show clean class pills */}
          {availableClassTabs.length > 1 ? (
            <div
              id="resources-class-filter-segmented"
              className="inline-flex items-center p-1 bg-slate-100 border border-slate-200 rounded-2xl sm:rounded-full overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden max-w-full shadow-inner gap-1"
            >
              {availableClassTabs.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => handleSelectClassFilter(tab)}
                  className={`inline-flex items-center justify-center px-3 py-1.5 rounded-xl sm:rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    selectedClassFilter === tab
                      ? 'bg-[#1E5AFF] text-white font-black shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 shadow-xs shrink-0 whitespace-nowrap">
              <GraduationCap className="w-4 h-4 text-[#1E5AFF]" />
              <span>Showing: <strong className="text-slate-900 font-extrabold">{availableClassTabs[0] || selectedClassFilter}</strong></span>
            </div>
          )}
        </div>
      </div>

      {/* BULK ACTION TOOLBAR (Select All & Batch Actions) */}
      {(isAdmin || selectedResourceIds.length > 0) && filteredResources.length > 0 && (
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 pt-0.5">
          <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
            <button
              type="button"
              id="resources-select-all-btn"
              onClick={handleToggleSelectAll}
              className={`inline-flex items-center justify-center gap-2 bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 font-bold text-xs sm:text-sm py-2.5 px-3.5 rounded-2xl transition-all active:scale-95 border border-slate-200 cursor-pointer shadow-xs select-none shrink-0 ${
                filteredResources.length > 0 &&
                filteredResources.every(r => selectedResourceIds.includes(r.id))
                  ? 'bg-blue-50 border-blue-300 text-[#1E5AFF] shadow-blue-500/10'
                  : ''
              }`}
            >
              {filteredResources.length > 0 &&
              filteredResources.every(r => selectedResourceIds.includes(r.id)) ? (
                <>
                  <CheckSquare className="w-4 h-4 text-[#1E5AFF]" />
                  <span>Deselect All</span>
                </>
              ) : (
                <>
                  <Square className="w-4 h-4 text-emerald-600" />
                  <span>Select All ({filteredResources.length})</span>
                </>
              )}
            </button>

            {selectedResourceIds.length > 0 && (
              <span className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-600 shadow-xs">
                <span className="inline-block w-2 h-2 rounded-full bg-[#1E5AFF] animate-pulse" />
                <span className="text-slate-900 font-bold">{selectedResourceIds.length}</span> selected
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {selectedResourceIds.length > 0 && (
              <>
                <button
                  type="button"
                  id="resources-clear-selection-btn"
                  onClick={handleClearSelection}
                  className="inline-flex items-center justify-center px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-200 transition-all cursor-pointer select-none active:scale-95 shadow-xs"
                >
                  Clear Selection
                </button>

                {isAdmin && (
                  <button
                    type="button"
                    id="resources-bulk-delete-btn"
                    onClick={handleOpenBulkDeleteModal}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-extrabold bg-rose-600 hover:bg-rose-700 text-white border border-rose-500/40 shadow-md shadow-rose-900/20 transition-all active:scale-95 cursor-pointer animate-fadeIn"
                  >
                    <Trash2 className="w-3.5 h-3.5 shrink-0" />
                    <span>Delete Selected ({selectedResourceIds.length})</span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* RESOURCE LIST SECTION WITH INSTANT CLIENT-SIDE FILTERING & CSS CONTAINMENT */}
      <div
        ref={listContainerRef}
        style={{ contain: 'layout style' }}
        className="relative z-10 min-h-[220px]"
      >
        {isLoading ? (
          <div
            className="bg-slate-50 border border-slate-200 rounded-2xl p-8 text-center flex flex-col items-center justify-center gap-3 animate-fadeIn"
          >
            <Loader2 className="w-7 h-7 text-[#1E5AFF] animate-spin" />
            <p className="text-xs text-slate-600 font-medium">
              Loading {activeCategory === 'past_paper' ? 'past papers' : 'MCQs drills'}...
            </p>
          </div>
        ) : filteredResources.length > 0 ? (
          <div className="space-y-4">
            <div
              style={{ contain: 'layout style' }}
              className="grid grid-cols-1 md:grid-cols-2 gap-3.5"
            >
              {filteredResources.slice(0, displayLimit).map(item => (
                <ResourceCard
                  key={item.id}
                  item={item}
                  isSelected={selectedResourceIds.includes(item.id)}
                  isAdmin={isAdmin}
                  onToggleSelect={handleToggleSelectResource}
                  onOpenDeleteModal={handleOpenDeleteModal}
                  onOpenPreview={handleOpenPreview}
                  onDownload={handleDownload}
                />
              ))}
            </div>

            {/* Progressive Load More Button for large resource sets */}
            {filteredResources.length > displayLimit && (
              <div className="pt-2 flex justify-center">
                <button
                  type="button"
                  onClick={() => setDisplayLimit(prev => prev + 16)}
                  className="px-5 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer shadow-xs active:scale-95 flex items-center gap-2"
                >
                  <span>Show More Resources ({filteredResources.length - displayLimit} remaining)</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          /* EMPTY STATE EXACT MATCH */
          <div
            className="bg-slate-50 border border-slate-200 rounded-2xl p-8 sm:p-10 text-center flex flex-col items-center justify-center gap-3 animate-fadeIn"
          >
            <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#1E5AFF]">
              <FileText className="w-6 h-6" />
            </div>
            <div className="space-y-1 max-w-md">
              <p className="font-['Space_Grotesk'] font-bold text-sm sm:text-base text-slate-900">
                No {activeCategory === 'past_paper' ? 'Past Papers' : 'MCQs Drills'} uploaded yet for this class — check back soon!
              </p>
              <p className="text-xs text-slate-500">
                Our academic team regularly uploads official FBISE, MDCAT, and TCAT documents.
              </p>
            </div>
            {isAdmin && (
              <button
                type="button"
                onClick={() => setShowUploadForm(true)}
                className="mt-2 inline-flex items-center gap-1.5 bg-[#1E5AFF] hover:bg-[#1546CC] text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-sm cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Upload First {activeCategory === 'past_paper' ? 'Past Paper' : 'MCQs Drill'}</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* CUSTOM STYLED DELETE CONFIRMATION MODAL (SINGLE ITEM) */}
      <AnimatePresence>
        {resourceToDelete && (
          <div
            id="delete-resource-modal-overlay"
            className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fadeIn overflow-y-auto"
            onClick={() => {
              if (!isDeletingResource) {
                setResourceToDelete(null);
                setDeleteResourceError(null);
              }
            }}
          >
            <motion.div
              id="delete-resource-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="delete-resource-modal-title"
              initial={{ opacity: 0, scale: 0.94, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 12 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              onClick={e => e.stopPropagation()}
              className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl max-w-md w-full max-w-[95vw] sm:max-w-md p-5 sm:p-6 shadow-2xl space-y-4 text-slate-900 relative overflow-hidden box-border my-auto"
            >
              {/* Top destructive accent bar */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-rose-600 via-rose-500 to-rose-600" />

              {/* Modal Header */}
              <div className="flex items-start justify-between gap-2 pt-1 border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0">
                    <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 id="delete-resource-modal-title" className="font-['Space_Grotesk'] font-bold text-base sm:text-lg text-slate-900 truncate">
                      Delete Resource
                    </h3>
                    <p className="text-[11px] text-slate-500 truncate">
                      Admin Resource Management
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  id="close-delete-resource-modal-btn"
                  disabled={isDeletingResource}
                  onClick={() => {
                    setResourceToDelete(null);
                    setDeleteResourceError(null);
                  }}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-40 shrink-0"
                  aria-label="Close modal"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="space-y-3.5 pt-0.5">
                <p className="text-xs sm:text-sm font-semibold text-slate-700 leading-relaxed">
                  Are you sure you want to delete this resource?
                </p>

                {/* Resource Summary Card */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                  <div className="flex items-start gap-2.5">
                    <div className="p-2 rounded-lg bg-blue-50 text-[#1E5AFF] border border-blue-200 shrink-0 mt-0.5">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-['Space_Grotesk'] font-bold text-xs sm:text-sm text-slate-900 line-clamp-2 leading-snug">
                        {resourceToDelete.title}
                      </h4>
                      <div className="flex flex-wrap items-center gap-1.5 pt-1.5 text-[10px] sm:text-[11px] text-slate-500">
                        <span className="bg-white px-2 py-0.5 rounded border border-slate-200 font-semibold text-slate-700">
                          {resourceToDelete.subject}
                        </span>
                        {resourceToDelete.class && (
                          <span className="bg-white px-2 py-0.5 rounded border border-slate-200 font-semibold text-slate-700">
                            {resourceToDelete.class}
                          </span>
                        )}
                        {resourceToDelete.category && (
                          <span className="text-[10px] uppercase font-bold text-[#1E5AFF] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                            {resourceToDelete.category === 'past_paper' ? 'Past Paper' : 'MCQs Drill'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-rose-50 border border-rose-200 rounded-xl p-2.5 text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                  <span>This action cannot be undone and will immediately remove this resource.</span>
                </div>

                {deleteResourceError && (
                  <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl p-3 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                    <span>{deleteResourceError}</span>
                  </div>
                )}
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  id="cancel-delete-resource-btn"
                  disabled={isDeletingResource}
                  onClick={() => {
                    setResourceToDelete(null);
                    setDeleteResourceError(null);
                  }}
                  className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition-all cursor-pointer disabled:opacity-40 active:scale-95"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  id="confirm-delete-resource-btn"
                  disabled={isDeletingResource}
                  onClick={handleConfirmDeleteResource}
                  className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold bg-rose-600 hover:bg-rose-700 text-white transition-all cursor-pointer flex items-center justify-center gap-2 shadow-md shadow-rose-900/20 active:scale-95 disabled:opacity-50"
                >
                  {isDeletingResource ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 shrink-0" />
                      <span>Delete</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CUSTOM STYLED BATCH DELETE CONFIRMATION MODAL */}
      <AnimatePresence>
        {showBulkDeleteModal && selectedResourceIds.length > 0 && (
          <div
            id="bulk-delete-resource-modal-overlay"
            className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fadeIn overflow-y-auto"
            onClick={() => {
              if (!isBulkDeleting) {
                setShowBulkDeleteModal(false);
                setBulkDeleteError(null);
              }
            }}
          >
            <motion.div
              id="bulk-delete-resource-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="bulk-delete-modal-title"
              initial={{ opacity: 0, scale: 0.94, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 12 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              onClick={e => e.stopPropagation()}
              className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl max-w-md w-full max-w-[95vw] sm:max-w-md p-5 sm:p-6 shadow-2xl space-y-4 text-slate-900 relative overflow-hidden box-border my-auto"
            >
              {/* Top destructive accent bar */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-rose-600 via-rose-500 to-rose-600" />

              {/* Modal Header */}
              <div className="flex items-start justify-between gap-2 pt-1 border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0">
                    <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 id="bulk-delete-modal-title" className="font-['Space_Grotesk'] font-bold text-base sm:text-lg text-slate-900 truncate">
                      Batch Delete Resources
                    </h3>
                    <p className="text-[11px] text-slate-500 truncate">
                      Admin Resource Management
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  id="close-bulk-delete-modal-btn"
                  disabled={isBulkDeleting}
                  onClick={() => {
                    setShowBulkDeleteModal(false);
                    setBulkDeleteError(null);
                  }}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-40 shrink-0"
                  aria-label="Close modal"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="space-y-3.5 pt-0.5">
                <p className="text-xs sm:text-sm font-semibold text-slate-700 leading-relaxed">
                  Are you sure you want to delete <span className="text-rose-600 font-bold">{selectedResourceIds.length} {selectedResourceIds.length === 1 ? 'resource' : 'resources'}</span>?
                </p>

                {/* Selected List Summary */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 max-h-36 overflow-y-auto space-y-1.5 [scrollbar-width:thin]">
                  {resources
                    .filter(r => selectedResourceIds.includes(r.id))
                    .map(item => (
                      <div key={item.id} className="flex items-center gap-2 text-xs text-slate-700 py-1 border-b border-slate-200 last:border-0">
                        <FileText className="w-3.5 h-3.5 text-[#1E5AFF] shrink-0" />
                        <span className="truncate flex-1 font-medium">{item.title}</span>
                        <span className="text-[10px] bg-white px-1.5 py-0.5 rounded text-slate-600 border border-slate-200 shrink-0">
                          {item.subject}
                        </span>
                      </div>
                    ))}
                </div>

                <div className="bg-rose-50 border border-rose-200 rounded-xl p-2.5 text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                  <span>This batch action cannot be undone. All selected items will be deleted permanently.</span>
                </div>

                {bulkDeleteError && (
                  <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl p-3 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                    <span>{bulkDeleteError}</span>
                  </div>
                )}
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  id="cancel-bulk-delete-btn"
                  disabled={isBulkDeleting}
                  onClick={() => {
                    setShowBulkDeleteModal(false);
                    setBulkDeleteError(null);
                  }}
                  className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition-all cursor-pointer disabled:opacity-40 active:scale-95"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  id="confirm-bulk-delete-btn"
                  disabled={isBulkDeleting}
                  onClick={handleConfirmBulkDelete}
                  className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold bg-rose-600 hover:bg-rose-700 text-white transition-all cursor-pointer flex items-center justify-center gap-2 shadow-md shadow-rose-900/20 active:scale-95 disabled:opacity-50"
                >
                  {isBulkDeleting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                      <span>Deleting {selectedResourceIds.length} items...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 shrink-0" />
                      <span>Delete Selected ({selectedResourceIds.length})</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* IN-APP PDF PREVIEW MODAL / DRAWER */}
      <AnimatePresence>
        {previewResource && (
          <div
            id="pdf-preview-modal-backdrop"
            className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-950/60 backdrop-blur-sm"
            onClick={handleClosePreview}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              onClick={e => e.stopPropagation()}
              className="bg-white border border-slate-200 rounded-2xl w-full max-w-5xl h-[92vh] max-h-[850px] shadow-2xl flex flex-col overflow-hidden relative text-slate-900"
            >
              {/* Modal Header: Clear 2-line layout with generous spacing and zero overlap */}
              <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-white border-b border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 shrink-0 shadow-xs">
                {/* Left Side: Icon + Title on Line 1 & Metadata Badges on Line 2 */}
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  <div className="p-2.5 bg-blue-50 border border-blue-100 rounded-xl text-blue-600 shrink-0 shadow-xs">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1 flex flex-col justify-center gap-1">
                    {/* Line 1: Title */}
                    <h3 className="font-['Space_Grotesk'] font-bold text-sm sm:text-base text-slate-900 truncate tracking-tight" title={previewResource.title}>
                      {previewResource.title}
                    </h3>
                    {/* Line 2: Metadata row */}
                    <div className="flex items-center flex-wrap gap-1.5 sm:gap-2 text-xs">
                      <span className="inline-flex items-center bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded-md border border-blue-200 text-[11px] whitespace-nowrap">
                        {previewResource.subject}
                      </span>
                      {previewResource.class && (
                        <span className="inline-flex items-center bg-slate-100 text-slate-700 font-medium px-2 py-0.5 rounded-md border border-slate-200 text-[11px] whitespace-nowrap">
                          {previewResource.class}
                        </span>
                      )}
                      {previewResource.file_size && (
                        <span className="inline-flex items-center text-slate-500 text-[11px] font-medium whitespace-nowrap">
                          {previewResource.file_size}
                        </span>
                      )}
                      {previewTotalPages > 0 && (
                        <span className="inline-flex items-center text-slate-400 text-[11px] font-medium whitespace-nowrap">
                          • {previewTotalPages} {previewTotalPages === 1 ? 'Page' : 'Pages'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Side: Action Icons Row with clean spacing and wrapping prevention */}
                <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 flex-wrap lg:flex-nowrap justify-start lg:justify-end">
                  {/* Study Sticky Note Tool Toggle */}
                  <button
                    type="button"
                    id="toggle-sticky-tool-btn"
                    onClick={() => {
                      triggerHaptic(HAPTIC_PATTERNS.light);
                      setActiveStudyTool(prev => prev === 'sticky' ? 'none' : 'sticky');
                      if (activeStudyTool !== 'sticky') {
                        setExportSuccessMsg('Click anywhere on the document canvas to drop a sticky note');
                        setTimeout(() => setExportSuccessMsg(null), 3500);
                      }
                    }}
                    className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                      activeStudyTool === 'sticky'
                        ? 'bg-amber-400 text-slate-950 border-amber-500 shadow-sm'
                        : 'bg-amber-50 text-amber-900 hover:bg-amber-100 border-amber-300'
                    }`}
                    title="Add Study Sticky Notes"
                  >
                    <StickyNote className="w-3.5 h-3.5 text-amber-700" />
                    <span className="whitespace-nowrap">Sticky Note</span>
                  </button>

                  {/* Highlight Tool Button */}
                  <button
                    type="button"
                    id="open-add-highlight-btn"
                    onClick={() => {
                      triggerHaptic(HAPTIC_PATTERNS.light);
                      setShowAddHighlightModal(true);
                    }}
                    className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-emerald-50 text-emerald-900 hover:bg-emerald-100 border border-emerald-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
                    title="Add Study Highlight or Key Concept"
                  >
                    <Highlighter className="w-3.5 h-3.5 text-emerald-700" />
                    <span className="whitespace-nowrap">Highlight</span>
                  </button>

                  {/* Study Notes & Highlights Drawer Toggle */}
                  <button
                    type="button"
                    id="toggle-notes-drawer-btn"
                    onClick={() => {
                      triggerHaptic(HAPTIC_PATTERNS.light);
                      setShowNotesDrawer(prev => !prev);
                    }}
                    className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                      showNotesDrawer
                        ? 'bg-blue-600 text-white border-blue-700 shadow-sm'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-300'
                    }`}
                    title="View Saved Notes and Highlights"
                  >
                    <Bookmark className={`w-3.5 h-3.5 ${showNotesDrawer ? 'text-white' : 'text-blue-600'}`} />
                    <span className="whitespace-nowrap">Notes ({studyNotes.length + studyHighlights.length})</span>
                  </button>

                  {/* Export Page as High-Res PNG Button */}
                  <button
                    type="button"
                    id="preview-modal-export-png-btn"
                    disabled={isExportingPng || !previewResource.file_url}
                    onClick={() => handleExportPageToPng(exportPageNumber)}
                    className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer active:scale-95 disabled:opacity-50"
                    title="Export current page as high-resolution PNG image"
                  >
                    {isExportingPng ? (
                      <Loader2 className="w-3.5 h-3.5 text-blue-600 animate-spin" />
                    ) : (
                      <ImageIcon className="w-3.5 h-3.5 text-slate-600" />
                    )}
                    <span className="whitespace-nowrap">{isExportingPng ? 'Exporting...' : 'Export PNG'}</span>
                  </button>

                  {/* Direct PDF Download Button with App Blue Accent */}
                  <button
                    type="button"
                    id="preview-modal-download-btn"
                    disabled={isDownloading || !previewResource.file_url}
                    onClick={() => handleDownload(previewResource)}
                    className="flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer active:scale-95 border border-blue-700 disabled:opacity-60"
                    title="Download complete PDF document to device"
                  >
                    {isDownloading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Download className="w-3.5 h-3.5" />
                    )}
                    <span className="whitespace-nowrap">{isDownloading ? 'Downloading...' : 'Download'}</span>
                  </button>

                  {/* Open in External Browser Button */}
                  <button
                    type="button"
                    id="preview-modal-open-external-btn"
                    onClick={() => {
                      triggerHaptic(HAPTIC_PATTERNS.light);
                      openExternalPdfBrowser(previewResource.file_url);
                    }}
                    className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer active:scale-95"
                    title="Open PDF directly in your system default external browser (Chrome / Safari / Edge)"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
                    <span className="whitespace-nowrap">Open in Browser</span>
                  </button>

                  {/* Close Preview Button */}
                  <button
                    type="button"
                    id="close-pdf-preview-btn"
                    onClick={handleClosePreview}
                    className="p-1.5 sm:p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-300 transition-all cursor-pointer flex items-center justify-center"
                    title="Close Preview"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Sub-Header: Search Bar & Page Selector on Crisp Light Canvas */}
              <div className="px-4 sm:px-6 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 shrink-0">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    triggerHaptic(HAPTIC_PATTERNS.light);
                  }}
                  className="relative flex-1 max-w-md flex items-center"
                >
                  <Search className="w-4 h-4 text-blue-600 absolute left-3 pointer-events-none" />
                  <input
                    type="text"
                    id="pdf-preview-search-input"
                    value={previewSearchQuery}
                    onChange={(e) => setPreviewSearchQuery(e.target.value)}
                    placeholder="Search document topics or keywords..."
                    className="w-full pl-9 pr-8 py-1.5 bg-white border border-slate-300 focus:border-blue-600 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none transition-colors shadow-xs"
                  />
                  {previewSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setPreviewSearchQuery('')}
                      className="absolute right-2.5 text-slate-400 hover:text-slate-700 p-0.5"
                      title="Clear document search"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </form>

                <div className="flex items-center justify-between sm:justify-end gap-3 text-[11px] text-slate-600">
                  {/* PNG Page Export Selector */}
                  <div className="flex items-center gap-1.5 bg-white border border-slate-300 px-2 py-1 rounded-lg shadow-xs">
                    <span className="text-slate-600 font-medium">Page for PNG:</span>
                    <input
                      type="number"
                      min={1}
                      max={previewTotalPages || 999}
                      value={exportPageNumber}
                      onChange={(e) => setExportPageNumber(Math.max(1, parseInt(e.target.value, 10) || 1))}
                      className="w-10 bg-transparent text-center font-bold text-blue-700 border-b border-blue-600 focus:outline-none"
                    />
                    <button
                      type="button"
                      disabled={isExportingPng}
                      onClick={() => handleExportPageToPng(exportPageNumber)}
                      className="text-blue-600 hover:text-blue-800 font-bold px-1 cursor-pointer disabled:opacity-50"
                    >
                      Save
                    </button>
                  </div>

                  <span className="hidden lg:inline text-slate-500">
                    {previewSearchQuery ? (
                      <span className="text-blue-700 font-medium">
                        Highlighting <strong>"{previewSearchQuery}"</strong>
                      </span>
                    ) : (
                      'Vector High-DPI Canvas Rendering'
                    )}
                  </span>
                </div>
              </div>

              {/* Toast Feedback for PNG Export Status */}
              {exportSuccessMsg && (
                <div className="bg-emerald-50 border-b border-emerald-200 px-4 py-1.5 text-xs text-emerald-800 flex items-center justify-between gap-2 shrink-0">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{exportSuccessMsg}</span>
                  </div>
                  <button type="button" onClick={() => setExportSuccessMsg(null)} className="text-emerald-700 hover:text-emerald-900">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {exportErrorMsg && (
                <div className="bg-rose-50 border-b border-rose-200 px-4 py-1.5 text-xs text-rose-800 flex items-center justify-between gap-2 shrink-0">
                  <div className="flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                    <span>{exportErrorMsg}</span>
                  </div>
                  <button type="button" onClick={() => setExportErrorMsg(null)} className="text-rose-700 hover:text-rose-900">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Modal PDF Viewer Body with Inline Vector PDF Viewer & Notes Drawer */}
              <div className="relative flex-1 w-full h-full bg-slate-100 overflow-hidden flex flex-row">
                {/* Main Inline Canvas PDF Viewer */}
                <div
                  className="relative flex-1 h-full w-full bg-slate-100 overflow-hidden flex flex-col"
                  onClick={activeStudyTool === 'sticky' ? handleAddStickyNote : undefined}
                  style={{ cursor: activeStudyTool === 'sticky' ? 'crosshair' : 'default' }}
                >
                  {/* Sticky Tool Prompt Banner when active */}
                  {activeStudyTool === 'sticky' && (
                    <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 bg-amber-400 text-slate-950 px-4 py-1.5 rounded-full text-xs font-bold shadow-md flex items-center gap-2 pointer-events-none animate-pulse">
                      <StickyNote className="w-3.5 h-3.5" />
                      <span>Click anywhere on the document canvas to drop a note on Page {exportPageNumber}</span>
                    </div>
                  )}

                  {/* Inline PDF Viewer Component (Fast Canvas Rendering with Page Navigation & Zoom) */}
                  <InlinePdfViewer
                    fileUrl={previewResource.file_url}
                    title={previewResource.title}
                    currentPage={exportPageNumber}
                    searchQuery={previewSearchQuery}
                    onPdfLoaded={(pages) => {
                      setPreviewTotalPages(pages);
                      setIsPreviewLoading(false);
                    }}
                    onPageChange={(page, total) => {
                      setExportPageNumber(page);
                      setPreviewTotalPages(total);
                    }}
                  >
                    {/* Render Study Sticky Notes on Top of PDF Canvas */}
                      {studyNotes
                        .filter(n => n.pageNumber === exportPageNumber)
                        .map((note) => (
                          <div
                            key={note.id}
                            onClick={(e) => e.stopPropagation()}
                            style={{
                              left: `${note.xPercent}%`,
                              top: `${note.yPercent}%`,
                            }}
                            className={`absolute z-20 w-48 sm:w-56 p-2.5 rounded-xl shadow-xl border text-xs transition-all ${
                              note.color === 'yellow'
                                ? 'bg-amber-50/95 border-amber-300 text-amber-950 shadow-amber-900/10'
                                : note.color === 'pink'
                                ? 'bg-pink-50/95 border-pink-300 text-pink-950 shadow-pink-900/10'
                                : note.color === 'green'
                                ? 'bg-emerald-50/95 border-emerald-300 text-emerald-950 shadow-emerald-900/10'
                                : note.color === 'blue'
                                ? 'bg-sky-50/95 border-sky-300 text-sky-950 shadow-sky-900/10'
                                : 'bg-orange-50/95 border-orange-300 text-orange-950 shadow-orange-900/10'
                            }`}
                          >
                            {/* Note Header */}
                            <div className="flex items-center justify-between gap-1 pb-1 mb-1 border-b border-black/10">
                              <span className="font-bold flex items-center gap-1 text-[10px] uppercase tracking-wider opacity-75">
                                <StickyNote className="w-3 h-3 text-amber-700" />
                                <span>Study Note (Pg {note.pageNumber})</span>
                              </span>
                              <button
                                type="button"
                                onClick={(e) => handleDeleteStickyNote(note.id, e)}
                                className="p-0.5 rounded hover:bg-black/10 opacity-70 hover:opacity-100 cursor-pointer"
                                title="Remove Note"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                            {/* Note Textarea */}
                            <textarea
                              value={note.text}
                              onChange={(e) => handleUpdateStickyText(note.id, e.target.value)}
                              placeholder="Type personal study note..."
                              rows={3}
                              className="w-full bg-transparent resize-none focus:outline-none font-medium leading-relaxed text-slate-900"
                            />
                          </div>
                        ))}
                  </InlinePdfViewer>
                </div>

                {/* Study Notes & Highlights Sidebar Drawer in Light Theme */}
                <AnimatePresence>
                  {showNotesDrawer && (
                    <motion.div
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ width: 320, opacity: 1 }}
                      exit={{ width: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="h-full bg-white border-l border-slate-200 flex flex-col shrink-0 z-30 overflow-hidden shadow-2xl text-slate-900"
                    >
                      {/* Drawer Header */}
                      <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-2">
                          <Bookmark className="w-4 h-4 text-blue-600" />
                          <span className="font-['Space_Grotesk'] font-bold text-xs text-slate-900">Study Notes & Highlights</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowNotesDrawer(false)}
                          className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Drawer Content */}
                      <div className="flex-1 overflow-y-auto p-3 space-y-4">
                        {/* Section: Text Highlights */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                              <Highlighter className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Highlights ({studyHighlights.length})</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => setShowAddHighlightModal(true)}
                              className="text-[11px] text-blue-600 hover:text-blue-800 font-bold"
                            >
                              + Add New
                            </button>
                          </div>

                          {studyHighlights.length === 0 ? (
                            <p className="text-[11px] text-slate-500 italic p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-center">
                              No study highlights added yet. Click "+ Add New" or the Highlight button in the top bar.
                            </p>
                          ) : (
                            studyHighlights.map((hl) => (
                              <div
                                key={hl.id}
                                className={`p-2.5 rounded-xl border text-xs space-y-1.5 relative group shadow-xs ${
                                  hl.color === 'yellow'
                                    ? 'bg-amber-50 border-amber-200 text-amber-950'
                                    : hl.color === 'green'
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                                    : hl.color === 'pink'
                                    ? 'bg-pink-50 border-pink-200 text-pink-950'
                                    : hl.color === 'cyan'
                                    ? 'bg-cyan-50 border-cyan-200 text-cyan-950'
                                    : 'bg-purple-50 border-purple-200 text-purple-950'
                                }`}
                              >
                                <div className="flex items-center justify-between text-[10px] text-slate-500">
                                  <span className="font-semibold">Page {hl.pageNumber}</span>
                                  <button
                                    type="button"
                                    onClick={(e) => handleDeleteHighlight(hl.id, e)}
                                    className="text-rose-500 hover:text-rose-700 p-0.5"
                                    title="Delete Highlight"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                                <div className="font-semibold text-slate-900 italic border-l-2 border-blue-600 pl-2 py-0.5">
                                  "{hl.selectedText}"
                                </div>
                                {hl.note && (
                                  <div className="text-[11px] text-slate-700 pt-0.5">
                                    <span className="font-bold text-blue-700">Note: </span>
                                    {hl.note}
                                  </div>
                                )}
                              </div>
                            ))
                          )}
                        </div>

                        {/* Section: Sticky Notes */}
                        <div className="space-y-2 pt-2 border-t border-slate-200">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                              <StickyNote className="w-3.5 h-3.5 text-amber-700" />
                              <span>Pinned Sticky Notes ({studyNotes.length})</span>
                            </span>
                          </div>

                          {studyNotes.length === 0 ? (
                            <p className="text-[11px] text-slate-500 italic p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-center">
                              No sticky notes placed. Click "Sticky Note" in the top bar to drop pins on pages.
                            </p>
                          ) : (
                            studyNotes.map((note) => (
                              <div
                                key={note.id}
                                className="p-2.5 rounded-xl border bg-amber-50 border-amber-200 text-xs space-y-1 shadow-xs"
                              >
                                <div className="flex items-center justify-between text-[10px] text-amber-900">
                                  <span className="font-semibold">Page {note.pageNumber}</span>
                                  <button
                                    type="button"
                                    onClick={(e) => handleDeleteStickyNote(note.id, e)}
                                    className="text-rose-500 hover:text-rose-700 p-0.5"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                                <textarea
                                  value={note.text}
                                  onChange={(e) => handleUpdateStickyText(note.id, e.target.value)}
                                  rows={2}
                                  className="w-full bg-white p-1.5 rounded-lg border border-amber-300 text-slate-900 text-xs resize-none focus:outline-none focus:border-amber-500"
                                />
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Add Highlight Modal Dialog in Light Theme */}
              <AnimatePresence>
                {showAddHighlightModal && (
                  <div
                    className="absolute inset-0 z-40 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4"
                    onClick={() => setShowAddHighlightModal(false)}
                  >
                    <motion.div
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.95, opacity: 0 }}
                      onClick={(e) => e.stopPropagation()}
                      className="bg-white border border-slate-200 rounded-2xl p-5 w-full max-w-md shadow-2xl space-y-4 text-slate-900"
                    >
                      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                        <div className="flex items-center gap-2">
                          <Highlighter className="w-4 h-4 text-emerald-600" />
                          <h4 className="font-['Space_Grotesk'] font-bold text-sm text-slate-900">Add Study Highlight</h4>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowAddHighlightModal(false)}
                          className="text-slate-400 hover:text-slate-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="space-y-3 text-xs">
                        <div>
                          <label className="block text-slate-700 font-bold mb-1">
                            Key Text / Quote / Formula:
                          </label>
                          <textarea
                            value={newHighlightText}
                            onChange={(e) => setNewHighlightText(e.target.value)}
                            placeholder="Paste or write important key concept or exam point..."
                            rows={3}
                            className="w-full p-2.5 bg-slate-50 border border-slate-300 focus:border-blue-600 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-700 font-bold mb-1">
                            Your Personal Study Note / Explanation (Optional):
                          </label>
                          <input
                            type="text"
                            value={newHighlightNote}
                            onChange={(e) => setNewHighlightNote(e.target.value)}
                            placeholder="e.g. Frequently asked in FBISE Past Papers"
                            className="w-full p-2.5 bg-slate-50 border border-slate-300 focus:border-blue-600 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none"
                          />
                        </div>

                        {/* Highlight Color Picker */}
                        <div>
                          <label className="block text-slate-700 font-bold mb-1.5">Highlight Color:</label>
                          <div className="flex items-center gap-2">
                            {(['yellow', 'green', 'pink', 'cyan', 'purple'] as const).map((color) => (
                              <button
                                key={color}
                                type="button"
                                onClick={() => setSelectedHighlightColor(color)}
                                className={`w-7 h-7 rounded-full transition-transform cursor-pointer border-2 ${
                                  selectedHighlightColor === color ? 'scale-110 border-slate-900' : 'border-transparent opacity-80'
                                } ${
                                  color === 'yellow'
                                    ? 'bg-amber-300'
                                    : color === 'green'
                                    ? 'bg-emerald-300'
                                    : color === 'pink'
                                    ? 'bg-pink-300'
                                    : color === 'cyan'
                                    ? 'bg-cyan-300'
                                    : 'bg-purple-300'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                        <button
                          type="button"
                          onClick={() => setShowAddHighlightModal(false)}
                          className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          disabled={!newHighlightText.trim()}
                          onClick={handleSaveHighlight}
                          className="px-4 py-2 rounded-xl text-xs font-extrabold bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Save Highlight</span>
                        </button>
                      </div>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>

              {/* Mobile Footer Bar on Light Theme */}
              <div className="sm:hidden p-3 bg-white border-t border-slate-200 flex items-center justify-between gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleClosePreview}
                  className="flex-1 py-2 px-2.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300"
                >
                  Close
                </button>
                <button
                  type="button"
                  disabled={isExportingPng}
                  onClick={() => handleExportPageToPng(exportPageNumber)}
                  className="flex-1 py-2 px-2.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-800 border border-slate-300 flex items-center justify-center gap-1"
                >
                  <ImageIcon className="w-3 h-3" />
                  <span>{isExportingPng ? 'Exporting...' : 'PNG'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDownload(previewResource)}
                  className="flex-1 py-2 px-2.5 rounded-xl text-xs font-extrabold bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-1 shadow-sm"
                >
                  <Download className="w-3 h-3" />
                  <span>PDF</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Storage Integrity Scanner Modal */}
      <AnimatePresence>
        {showIntegrityModal && (
          <div
            className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
            onClick={() => {
              if (!isScanningIntegrity) {
                setShowIntegrityModal(false);
              }
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white text-slate-900 border border-slate-200 rounded-3xl p-5 sm:p-7 w-full max-w-2xl shadow-2xl space-y-5 my-auto max-h-[90vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="flex items-start justify-between gap-3 border-b border-slate-200 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#1E5AFF] shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-['Space_Grotesk'] text-lg sm:text-xl font-extrabold text-slate-900 flex items-center gap-2">
                      <span>Storage &amp; PDF Integrity Auditor</span>
                    </h3>
                    <p className="text-xs text-slate-500">
                      Verifies %PDF- magic bytes and structural rendering validity across all storage files.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={isScanningIntegrity}
                  onClick={() => setShowIntegrityModal(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-30 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Action Banner / Notification */}
              {corruptedActionMsg && (
                <div className="p-3 bg-blue-50 border border-blue-200 text-blue-800 rounded-xl text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#1E5AFF] shrink-0" />
                  <span>{corruptedActionMsg}</span>
                </div>
              )}

              {/* Active Scan Progress */}
              {isScanningIntegrity && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 font-bold text-[#1E5AFF]">
                      <Loader2 className="w-4 h-4 animate-spin text-[#1E5AFF]" />
                      <span>Auditing Documents...</span>
                    </div>
                    <span className="text-slate-500 font-mono text-[11px]">
                      {scanProgress.current} / {scanProgress.total} (
                      {scanProgress.total > 0
                        ? Math.round((scanProgress.current / scanProgress.total) * 100)
                        : 0}
                      %)
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-linear-to-r from-blue-500 to-indigo-500 transition-all duration-200"
                      style={{
                        width: `${
                          scanProgress.total > 0
                            ? (scanProgress.current / scanProgress.total) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>

                  {scanProgress.currentItemName && (
                    <p className="text-[11px] text-slate-500 truncate">
                      Testing:{' '}
                      <span className="text-slate-800 font-medium">{scanProgress.currentItemName}</span>
                    </p>
                  )}
                </div>
              )}

              {/* Report Summary Cards */}
              {integrityReport && !isScanningIntegrity && (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-center space-y-1">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                        Total Scanned
                      </span>
                      <span className="text-xl sm:text-2xl font-extrabold text-slate-900 font-mono">
                        {integrityReport.totalScanned}
                      </span>
                    </div>
                    <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-1">
                      <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">
                        Healthy
                      </span>
                      <span className="text-xl sm:text-2xl font-extrabold text-emerald-700 font-mono">
                        {integrityReport.healthyCount}
                      </span>
                    </div>
                    <div
                      className={`p-3.5 rounded-2xl text-center space-y-1 border ${
                        integrityReport.corruptedCount > 0
                          ? 'bg-rose-50 border-rose-200 text-rose-700'
                          : 'bg-slate-50 border-slate-200 text-slate-500'
                      }`}
                    >
                      <span className="text-[11px] font-bold uppercase tracking-wider block">
                        Corrupted
                      </span>
                      <span className="text-xl sm:text-2xl font-extrabold font-mono">
                        {integrityReport.corruptedCount}
                      </span>
                    </div>
                  </div>

                  {/* Corrupted Files List */}
                  {integrityReport.corruptedCount > 0 ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-extrabold text-rose-600 uppercase tracking-wider flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>Corrupted Files Requiring Action ({integrityReport.corruptedCount})</span>
                        </h4>
                        <button
                          type="button"
                          disabled={isDeletingCorrupted}
                          onClick={handleDeleteAllCorrupted}
                          className="text-[11px] font-bold text-rose-600 hover:text-rose-700 hover:underline inline-flex items-center gap-1 cursor-pointer disabled:opacity-50"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Delete All Corrupted</span>
                        </button>
                      </div>

                      <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                        {integrityReport.corruptedItems.map((item) => (
                          <div
                            key={item.id}
                            className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl space-y-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                          >
                            <div className="space-y-1 min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-sm text-slate-900 truncate">
                                  {item.title}
                                </span>
                                {item.targetClass && (
                                  <span className="text-[10px] font-semibold bg-white text-rose-700 px-2 py-0.5 rounded-md border border-rose-200">
                                    {item.targetClass}
                                  </span>
                                )}
                                {item.subject && (
                                  <span className="text-[10px] font-semibold bg-white text-slate-700 px-2 py-0.5 rounded-md border border-slate-200">
                                    {item.subject}
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-rose-700 leading-relaxed font-mono">
                                {item.errorDetails || 'Invalid PDF structure / corrupted magic bytes'}
                              </p>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleReplaceCorruptedItem(item)}
                                className="px-3 py-1.5 bg-[#1E5AFF] hover:bg-[#1546CC] text-white rounded-xl text-xs font-bold transition-all shadow-xs inline-flex items-center gap-1 cursor-pointer"
                                title="Open upload drawer with pre-filled title to upload a clean copy"
                              >
                                <Upload className="w-3 h-3" />
                                <span>Replace</span>
                              </button>
                              <button
                                type="button"
                                disabled={isDeletingCorrupted}
                                onClick={() => handleDeleteCorruptedItem(item)}
                                className="p-2 bg-rose-100 hover:bg-rose-600 text-rose-700 hover:text-white rounded-xl text-xs font-bold border border-rose-200 transition-all cursor-pointer disabled:opacity-50"
                                title="Delete corrupted file permanently from database & storage"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-1.5">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <h4 className="text-sm font-bold text-emerald-800">
                        100% Storage Integrity Verified
                      </h4>
                      <p className="text-xs text-slate-600">
                        All {integrityReport.totalScanned} PDF documents have valid %PDF- headers and
                        can be rendered without corruption.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Modal Footer Controls */}
              <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  disabled={isScanningIntegrity}
                  onClick={handleStartIntegrityScan}
                  className="px-4 py-2 bg-[#1E5AFF] hover:bg-[#1546CC] text-white font-extrabold text-xs rounded-xl shadow-sm transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isScanningIntegrity ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Scanning...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Run Full Storage Scan</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  disabled={isScanningIntegrity}
                  onClick={() => setShowIntegrityModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all border border-slate-300 cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
};
