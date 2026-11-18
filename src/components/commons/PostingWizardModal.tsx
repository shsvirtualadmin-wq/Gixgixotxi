import React, { useEffect, useRef, useState } from 'react';
import {
  X,
  Upload,
  Check,
  AlertCircle,
  Loader2,
  FileText,
  Archive,
  CheckCircle2,
  Calculator,
  HelpCircle,
  Link2,
  MessageSquare,
  Plus,
  Trash2,
  Globe,
  EyeOff,
} from 'lucide-react';
import { createCommonsPost } from '@/services/commonsService';
import { uploadCommonsAttachment } from '@/services/commonsUploadService';
import type { CommonsPost, CommonsPostType, CommonsFileAttachment } from '@/types/commons';

export type WizardPostType =
  | 'notes'
  | 'past_paper'
  | 'solved_paper'
  | 'formula_sheet'
  | 'question'
  | 'doubt'
  | 'resource_link'
  | 'discussion'
  | CommonsPostType;

export type WizardBoardType =
  | 'Sindh Board'
  | 'Punjab Board'
  | 'Federal Board'
  | 'KPK Board'
  | 'Balochistan Board'
  | 'Aga Khan Board'
  | 'Cambridge'
  | 'MDCAT / ECAT'
  | string;

export type WizardClassLevel =
  | 'Class 9'
  | 'Class 10'
  | 'Class 11'
  | 'Class 12'
  | 'O Level'
  | 'A Level'
  | 'Entrance Test'
  | string;

export interface PostingWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (data: {
    type: WizardPostType;
    board: WizardBoardType;
    classLevel: WizardClassLevel;
    subject: string;
    title: string;
    description: string;
    tags: string[];
    files: File[];
    isAnonymous: boolean;
  }) => Promise<void>;
  onPostCreated?: (post: CommonsPost) => void;
  currentUser?: {
    uid: string;
    email?: string | null;
    displayName?: string | null;
    photoURL?: string | null;
    equippedAvatar?: string | null;
    frame?: string | null;
    avatarUrl?: string | null;
    role?: string | null;
    customRole?: string | null;
  };
  initialType?: WizardPostType;
  initialAnonymous?: boolean;
  initialStep?: 1 | 2;
  triggerUploadOnMount?: boolean;
}

const MATERIAL_TYPES: {
  id: WizardPostType;
  label: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  {
    id: 'notes',
    label: 'Notes',
    desc: 'Handwritten or typed chapter notes and study summaries',
    icon: FileText,
  },
  {
    id: 'past_paper',
    label: 'Past Paper',
    desc: 'Previous years official board or university exam papers',
    icon: Archive,
  },
  {
    id: 'solved_paper',
    label: 'Solved Paper',
    desc: 'Step-by-step solutions and marking schemes for exams',
    icon: CheckCircle2,
  },
  {
    id: 'formula_sheet',
    label: 'Formula Sheet',
    desc: 'Quick equations, reactions, and revision cheat sheets',
    icon: Calculator,
  },
  {
    id: 'question',
    label: 'Doubt / Question',
    desc: 'Ask the community for help solving a tough concept',
    icon: HelpCircle,
  },
  {
    id: 'resource_link',
    label: 'Resource Link',
    desc: 'Share helpful study websites, playlists, or drives',
    icon: Link2,
  },
  {
    id: 'discussion',
    label: 'Discussion',
    desc: 'Start an academic study discussion or exam strategy thread',
    icon: MessageSquare,
  },
];

const BOARDS: WizardBoardType[] = [
  'Sindh Board',
  'Punjab Board',
  'Federal Board',
  'KPK Board',
  'Balochistan Board',
  'Aga Khan Board',
  'Cambridge',
  'MDCAT / ECAT',
];

const CLASSES: WizardClassLevel[] = [
  'Class 9',
  'Class 10',
  'Class 11',
  'Class 12',
  'O Level',
  'A Level',
  'Entrance Test',
];

const SUBJECTS = [
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'Computer Science',
  'English',
  'Urdu',
  'Islamiat',
  'Pakistan Studies',
  'Accounting',
  'Economics',
  'General',
];

const MAX_FILES = 5;
const MAX_TAGS = 8;
const MAX_FILE_BYTES = 10 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
]);

function isAllowedUploadFile(file: File): boolean {
  if (ALLOWED_MIME_TYPES.has(file.type)) return true;
  const lower = file.name.toLowerCase();
  return (
    lower.endsWith('.pdf') ||
    lower.endsWith('.png') ||
    lower.endsWith('.jpg') ||
    lower.endsWith('.jpeg') ||
    lower.endsWith('.webp')
  );
}

export const PostingWizardModal: React.FC<PostingWizardModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  onPostCreated,
  currentUser,
  initialType,
  initialAnonymous,
  initialStep,
}) => {
  const [step, setStep] = useState<1 | 2>(initialStep || 1);
  const [type, setType] = useState<WizardPostType>(initialType || 'notes');
  const [board, setBoard] = useState<WizardBoardType>('Federal Board');
  const [classLevel, setClassLevel] = useState<WizardClassLevel>('Class 11');
  const [subject, setSubject] = useState<string>('Physics');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tagsList, setTagsList] = useState<string[]>([]);
  const [tagDraft, setTagDraft] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<Record<string, string>>({});
  const [fileProgress, setFileProgress] = useState<Record<string, number>>({});
  const [isAnonymous, setIsAnonymous] = useState(Boolean(initialAnonymous));
  const [agreedToRules, setAgreedToRules] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [publishedSuccess, setPublishedSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Lock body scroll & set data-modal-open while open
  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.body.setAttribute('data-modal-open', 'true');

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.removeAttribute('data-modal-open');
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, isSubmitting, onClose]);

  // Reset form when opened fresh
  useEffect(() => {
    if (isOpen) {
      setError(null);
      setPublishedSuccess(false);
      if (initialType) setType(initialType);
      if (typeof initialAnonymous === 'boolean') setIsAnonymous(initialAnonymous);
      if (initialStep) setStep(initialStep);
    }
  }, [isOpen, initialType, initialAnonymous, initialStep]);

  if (!isOpen) return null;

  const selectedTypeObj =
    MATERIAL_TYPES.find((t) => t.id === type) || MATERIAL_TYPES[0];

  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    setError(null);
    const incoming = Array.from(e.target.files) as File[];
    const validFiles: File[] = [];

    for (const file of incoming) {
      if (files.length + validFiles.length >= MAX_FILES) {
        setError(`You can attach up to ${MAX_FILES} files per resource.`);
        break;
      }
      if (!isAllowedUploadFile(file)) {
        setError(
          `"${file.name}" is not supported. Only PDF, JPG, PNG, and WEBP are allowed.`
        );
        continue;
      }
      if (file.size > MAX_FILE_BYTES) {
        setError(`"${file.name}" exceeds the 10 MB per-file limit.`);
        continue;
      }
      validFiles.push(file);

      const fileKey = `${file.name}_${file.size}`;
      setFileProgress((prev) => ({ ...prev, [fileKey]: 100 }));
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = () => {
          setFilePreviews((prev) => ({
            ...prev,
            [fileKey]: String(reader.result || ''),
          }));
        };
        reader.readAsDataURL(file);
      }
    }

    if (validFiles.length > 0) {
      setFiles((prev) => [...prev, ...validFiles].slice(0, MAX_FILES));
    }
    e.target.value = '';
  };

  const removeFileAt = (index: number) => {
    setFiles((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleAddTag = () => {
    const clean = tagDraft
      .trim()
      .replace(/^#+/, '')
      .replace(/[^a-zA-Z0-9_-]/g, '')
      .slice(0, 24);
    if (!clean) return;
    if (tagsList.length >= MAX_TAGS) return;
    if (!tagsList.includes(clean.toLowerCase())) {
      setTagsList((prev) => [...prev, clean.toLowerCase()]);
    }
    setTagDraft('');
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddTag();
    } else if (e.key === 'Backspace' && !tagDraft && tagsList.length > 0) {
      setTagsList((prev) => prev.slice(0, -1));
    }
  };

  const canPublish =
    title.trim().length >= 3 &&
    description.trim().length >= 3 &&
    agreedToRules &&
    !isSubmitting;

  const handlePublish = async () => {
    if (!canPublish) {
      if (!title.trim() || !description.trim()) {
        setError('Please enter both a title and a description.');
      } else if (!agreedToRules) {
        setError('Please accept the community guidelines before publishing.');
      }
      return;
    }

    setIsSubmitting(true);
    setError(null);

    // Show per-file progress animation during upload
    const nextProg: Record<string, number> = {};
    for (const f of files) {
      nextProg[`${f.name}_${f.size}`] = 65;
    }
    setFileProgress((prev) => ({ ...prev, ...nextProg }));

    try {
      if (onSubmit) {
        await onSubmit({
          type,
          board,
          classLevel,
          subject,
          title: title.trim(),
          description: description.trim(),
          tags: tagsList,
          files,
          isAnonymous,
        });
      } else {
        const postId = `post_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        const uploadedAttachments: CommonsFileAttachment[] = [];
        for (const f of files) {
          const fileKey = `${f.name}_${f.size}`;
          const uploaded = await uploadCommonsAttachment({
            file: f,
            postId,
            uid: currentUser?.uid,
            onProgress: (pct) => {
              setFileProgress((prev) => ({ ...prev, [fileKey]: pct }));
            },
          });
          uploadedAttachments.push(uploaded);
        }
        const created = await createCommonsPost({
          postId,
          currentUser,
          type: (type === 'question' ? 'doubt' : type) as CommonsPostType,
          title: title.trim(),
          description: description.trim(),
          subject,
          target: `${board} · ${classLevel}`,
          tags: tagsList,
          files: uploadedAttachments,
          isAnonymous,
        });
        onPostCreated?.(created.post);
      }

      const doneProg: Record<string, number> = {};
      for (const f of files) {
        doneProg[`${f.name}_${f.size}`] = 100;
      }
      setFileProgress((prev) => ({ ...prev, ...doneProg }));
      setPublishedSuccess(true);

      setTimeout(() => {
        setPublishedSuccess(false);
        setStep(1);
        setTitle('');
        setDescription('');
        setTagsList([]);
        setFiles([]);
        setAgreedToRules(false);
        onClose();
      }, 1100);
    } catch (err: any) {
      setError(err?.message || 'Failed to publish resource. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      data-modal-layer="true"
      role="dialog"
      aria-modal="true"
      aria-label="Share Study Resource"
      className="boardly-modal-backdrop fixed inset-0 flex items-end sm:items-center justify-center p-0 sm:p-4"
    >
      {/* Click outside to close */}
      <div
        className="fixed inset-0"
        onClick={() => !isSubmitting && onClose()}
        aria-hidden="true"
      />

      {/* iOS Bottom Sheet (radius 40 on mobile, grabber, glass, Fixed Header + Scrolling Body + Sticky Footer) */}
      <div className="boardly-glass-card relative z-10 w-full sm:max-w-xl h-[94dvh] sm:h-auto sm:max-h-[90dvh] rounded-t-[40px] sm:rounded-[36px] flex flex-col overflow-hidden text-[var(--text)] shadow-[0_-18px_60px_rgba(0,0,0,0.35)] dark:shadow-[0_-18px_60px_rgba(0,0,0,0.85)]">
        {/* Grabber Handle */}
        <div className="pt-2.5 pb-1 flex justify-center shrink-0">
          <div className="w-11 h-1.5 rounded-full bg-[var(--border-strong)]" />
        </div>

        {/* FIXED HEADER: Red dot, Doto title, "Step N of 2" chip, Close button */}
        <header className="px-5 pt-2 pb-3.5 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-2.5 h-2.5 rounded-full bg-[#D71921] shadow-[0_0_10px_#D71921] shrink-0" />
            <h2 className="font-doto-title text-[14px] sm:text-[15px] tracking-[0.12em] text-[var(--text)] truncate">
              SHARE STUDY RESOURCE
            </h2>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text)] font-inter-num">
              Step {step} of 2
            </span>
            <button
              type="button"
              onClick={() => !isSubmitting && onClose()}
              aria-label="Close modal"
              className="press-scale w-11 h-11 rounded-full bg-[var(--surface-2)] hover:bg-[var(--border)] border border-[var(--border)] flex items-center justify-center text-[var(--text)] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Thin Progress Line (50% on Step 1, 100% on Step 2) */}
        <div className="w-full h-[2px] bg-[var(--border)] shrink-0 overflow-hidden">
          <div
            className="h-full bg-[#D71921] shadow-[0_0_10px_#D71921] transition-all duration-300"
            style={{ width: step === 1 ? '50%' : '100%' }}
          />
        </div>

        {/* Success Overlay Toast / Check Pop */}
        {publishedSuccess && (
          <div className="absolute inset-0 z-30 bg-[var(--surface)]/95 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-emerald-500 dark:text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.4)] animate-bounce">
              <Check className="w-8 h-8 stroke-[3]" />
            </div>
            <h3 className="mt-4 font-doto-title text-lg tracking-[0.14em] text-[var(--text)]">
              PUBLISHED
            </h3>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              Your study resource is now live for the community.
            </p>
          </div>
        )}

        {/* SCROLLING BODY */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5 overscroll-contain">
          {error && (
            <div className="p-3.5 rounded-2xl bg-[#D71921]/15 border border-[#D71921]/40 text-[#D71921] dark:text-red-200 text-xs font-semibold flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-[#D71921] shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {step === 1 ? (
            <div className="space-y-3">
              <p className="text-[15px] font-bold text-[var(--text)]">
                What type of material are you sharing?
              </p>

              {/* 7 Options in One Grouped List */}
              <div className="space-y-2.5">
                {MATERIAL_TYPES.map((item) => {
                  const IconComp = item.icon;
                  const selected = type === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setType(item.id)}
                      className={`press-scale w-full text-left rounded-[22px] p-3.5 flex items-center justify-between gap-3.5 transition-all cursor-pointer ${
                        selected
                          ? 'bg-[#D71921]/15 border-2 border-[#D71921] shadow-[0_0_24px_rgba(215,25,33,0.28)]'
                          : 'bg-[var(--surface-2)] hover:bg-[var(--border)]/40 border border-[var(--border)]'
                      }`}
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div
                          className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border ${
                            selected
                              ? 'bg-[#D71921] text-white border-white/30'
                              : 'bg-[var(--surface)] text-[var(--text-secondary)] border-[var(--border)]'
                          }`}
                        >
                          <IconComp className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-[15px] font-bold text-[var(--text)] truncate">
                            {item.label}
                          </div>
                          <div className="text-[12px] text-[var(--text-secondary)] truncate mt-0.5">
                            {item.desc}
                          </div>
                        </div>
                      </div>

                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border ${
                          selected
                            ? 'bg-[#D71921] border-[#D71921] text-white'
                            : 'border-[var(--border-strong)] bg-transparent'
                        }`}
                      >
                        {selected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* "Material type: NOTES [Change]" chip */}
              <div className="flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)]">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-doto-title text-[11px] tracking-[0.12em] text-[var(--text-secondary)]">
                    MATERIAL TYPE:
                  </span>
                  <span className="font-doto-title text-[12px] tracking-[0.14em] text-[#D71921] dark:text-[#ff6b72] uppercase truncate">
                    {selectedTypeObj.label}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="min-h-[36px] px-3 rounded-full text-xs font-bold text-[var(--text)] bg-[var(--surface)] hover:bg-[var(--border)] border border-[var(--border)] cursor-pointer"
                >
                  Change
                </button>
              </div>

              {/* Board / Class / Subject selectors */}
              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block font-doto-title text-[9px] tracking-[0.12em] text-[var(--text-secondary)] mb-1">
                    SUBJECT
                  </label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full min-h-[44px] px-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-xs font-semibold text-[var(--text)] outline-none"
                  >
                    {SUBJECTS.map((s) => (
                      <option key={s} value={s} className="bg-[var(--surface)] text-[var(--text)]">
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-doto-title text-[9px] tracking-[0.12em] text-[var(--text-secondary)] mb-1">
                    BOARD
                  </label>
                  <select
                    value={board}
                    onChange={(e) => setBoard(e.target.value as BoardType)}
                    className="w-full min-h-[44px] px-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-xs font-semibold text-[var(--text)] outline-none"
                  >
                    {BOARDS.map((b) => (
                      <option key={b} value={b} className="bg-[var(--surface)] text-[var(--text)]">
                        {b}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-doto-title text-[9px] tracking-[0.12em] text-[var(--text-secondary)] mb-1">
                    CLASS
                  </label>
                  <select
                    value={classLevel}
                    onChange={(e) => setClassLevel(e.target.value as ClassLevel)}
                    className="w-full min-h-[44px] px-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-xs font-semibold text-[var(--text)] outline-none"
                  >
                    {CLASSES.map((c) => (
                      <option key={c} value={c} className="bg-[var(--surface)] text-[var(--text)]">
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Floating Label Title Input with Required Marker */}
              <div className="search-pill-wrapper relative rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] px-4 pt-5 pb-2.5 transition-all">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                  Title <span className="text-[#D71921]">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Chapter 4 Rotational & Circular Motion Notes"
                  maxLength={140}
                  required
                  className="w-full mt-0.5 text-[14px] font-medium text-[var(--text)] placeholder:text-[var(--text-muted)]"
                />
              </div>

              {/* Floating Label Description Input with Required Marker */}
              <div className="search-pill-wrapper relative rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] px-4 pt-5 pb-3 transition-all">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                  Description <span className="text-[#D71921]">*</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Describe what chapters, key topics, or solved questions are included..."
                  required
                  className="w-full mt-1 bg-transparent border-0 outline-none text-[14px] text-[var(--text)] placeholder:text-[var(--text-muted)] resize-none"
                />
              </div>

              {/* Attach Files Drop Zone (dashed, dot texture, "0/5 files", thumbnails with remove buttons, per-file upload progress) */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-doto-title text-[11px] tracking-[0.14em] text-[var(--text)]">
                    ATTACH FILES
                  </span>
                  <span className="text-xs font-semibold font-inter-num text-[var(--text-secondary)]">
                    {files.length}/{MAX_FILES} files
                  </span>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp"
                  onChange={handleFilesSelected}
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={files.length >= MAX_FILES}
                  className="w-full rounded-[24px] p-5 border border-dashed border-[var(--border-strong)] hover:border-[#D71921]/70 bg-[var(--surface-2)] hover:bg-[var(--border)]/30 flex flex-col items-center justify-center text-center gap-2 transition-all cursor-pointer relative overflow-hidden"
                  style={{
                    backgroundImage:
                      'radial-gradient(currentColor 1px, transparent 1px)',
                    backgroundSize: '12px 12px',
                  }}
                >
                  <div className="w-11 h-11 rounded-full bg-[#D71921]/18 border border-[#D71921]/40 flex items-center justify-center text-[#D71921]">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div className="text-sm font-bold text-[var(--text)]">
                    Tap to select photos or documents
                  </div>
                  <div className="text-xs text-[var(--text-secondary)]">
                    PDF, PNG, JPG, WEBP up to 10 MB each
                  </div>
                </button>

                {/* File Thumbnails & Per-File Upload Progress */}
                {files.length > 0 && (
                  <div className="space-y-2 pt-1">
                    {files.map((file, idx) => {
                      const fileKey = `${file.name}_${file.size}`;
                      const thumbUrl = filePreviews[fileKey];
                      const progress = fileProgress[fileKey] ?? 100;
                      const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
                      return (
                        <div
                          key={`${fileKey}_${idx}`}
                          className="rounded-2xl p-2.5 bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            {thumbUrl ? (
                              <img
                                src={thumbUrl}
                                alt={file.name}
                                className="w-11 h-11 rounded-xl object-cover border border-[var(--border)] shrink-0"
                              />
                            ) : (
                              <div className="w-11 h-11 rounded-xl bg-[#D71921]/15 border border-[#D71921]/35 flex items-center justify-center text-[#D71921] dark:text-[#ff6b72] shrink-0">
                                <FileText className="w-5 h-5" />
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <div className="text-xs font-bold text-[var(--text)] truncate">
                                {file.name}
                              </div>
                              <div className="text-[11px] text-[var(--text-secondary)] font-inter-num">
                                {sizeMb} MB · {progress}%
                              </div>
                              <div className="mt-1 w-full h-1 rounded-full bg-[var(--border)] overflow-hidden">
                                <div
                                  className="h-full bg-[#D71921] transition-all duration-300"
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => removeFileAt(idx)}
                            aria-label={`Remove ${file.name}`}
                            className="w-10 h-10 rounded-full hover:bg-red-500/20 text-[var(--text-secondary)] hover:text-[#D71921] dark:hover:text-[#ff6b72] flex items-center justify-center shrink-0 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Tags as Chips with an Add Input ("0/8") */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-doto-title text-[11px] tracking-[0.14em] text-[var(--text)]">
                    TAGS
                  </span>
                  <span className="text-xs font-semibold font-inter-num text-[var(--text-secondary)]">
                    {tagsList.length}/{MAX_TAGS}
                  </span>
                </div>

                <div className="rounded-2xl p-2.5 bg-[var(--surface-2)] border border-[var(--border)] space-y-2">
                  {tagsList.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {tagsList.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#D71921]/15 border border-[#D71921]/40 text-[#D71921] dark:text-white"
                        >
                          #{tag}
                          <button
                            type="button"
                            onClick={() =>
                              setTagsList((prev) => prev.filter((t) => t !== tag))
                            }
                            aria-label={`Remove tag ${tag}`}
                            className="hover:opacity-75 cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  {tagsList.length < MAX_TAGS && (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={tagDraft}
                        onChange={(e) => setTagDraft(e.target.value)}
                        onKeyDown={handleTagKeyDown}
                        placeholder="Add a tag (e.g., physics, ch4) and press Enter"
                        className="flex-1 text-xs text-[var(--text)] placeholder:text-[var(--text-muted)] px-2 py-1.5"
                      />
                      <button
                        type="button"
                        onClick={handleAddTag}
                        disabled={!tagDraft.trim()}
                        className="min-h-[36px] px-3 rounded-full text-xs font-bold bg-[var(--surface)] hover:bg-[var(--border)] text-[var(--text)] border border-[var(--border)] disabled:opacity-40 inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Post Visibility as an iOS Segmented Control (Public / Anonymous) with explanation underneath */}
              <div className="space-y-2">
                <span className="block font-doto-title text-[11px] tracking-[0.14em] text-[var(--text)]">
                  POST VISIBILITY
                </span>
                <div className="relative p-1 rounded-full bg-[var(--surface-2)] border border-[var(--border)] grid grid-cols-2 h-12">
                  <button
                    type="button"
                    onClick={() => setIsAnonymous(false)}
                    className={`rounded-full text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      !isAnonymous
                        ? 'bg-[#D71921] text-white shadow-[0_4px_14px_rgba(215,25,33,0.45)]'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text)]'
                    }`}
                  >
                    <Globe className="w-3.5 h-3.5" />
                    Public
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAnonymous(true)}
                    className={`rounded-full text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      isAnonymous
                        ? 'bg-[#D71921] text-white shadow-[0_4px_14px_rgba(215,25,33,0.45)]'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text)]'
                    }`}
                  >
                    <EyeOff className="w-3.5 h-3.5" />
                    Anonymous
                  </button>
                </div>
                <p className="text-xs text-[var(--text-secondary)] px-1">
                  {isAnonymous
                    ? 'Your name and profile are hidden from other students on this resource.'
                    : 'Shows your profile name, avatar, and academic badge to the community.'}
                </p>
              </div>

              {/* Guidelines Checkbox (44px target) */}
              <label className="min-h-[44px] p-3 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={agreedToRules}
                  onChange={(e) => setAgreedToRules(e.target.checked)}
                  className="w-5 h-5 rounded accent-[#D71921] shrink-0 cursor-pointer"
                />
                <span className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  I confirm this study material follows Boardly community guidelines and
                  contains no spam or copyrighted exam leaks.
                </span>
              </label>
            </div>
          )}
        </div>

        {/* STICKY FOOTER above safe area holding the main action ("Continue" / "Publish Resource") */}
        <footer className="px-5 pt-3 pb-[calc(16px+env(safe-area-inset-bottom,0px))] bg-[var(--surface)]/95 backdrop-blur-xl border-t border-[var(--border)] shrink-0">
          {step === 1 ? (
            <button
              type="button"
              onClick={() => setStep(2)}
              className="boardly-red-pill press-scale w-full h-[52px] rounded-full text-sm font-bold tracking-wide flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Continue</span>
            </button>
          ) : (
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setStep(1)}
                disabled={isSubmitting}
                className="boardly-glass-pill press-scale h-[52px] px-5 rounded-full text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text)] cursor-pointer"
              >
                Back
              </button>
              <button
                type="button"
                disabled={!canPublish}
                onClick={() => void handlePublish()}
                className="boardly-red-pill press-scale flex-1 h-[52px] rounded-full text-sm font-bold tracking-wide flex items-center justify-center gap-2 disabled:opacity-40 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Publishing...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>Publish Resource</span>
                  </>
                )}
              </button>
            </div>
          )}
        </footer>
      </div>
    </div>
  );
};
