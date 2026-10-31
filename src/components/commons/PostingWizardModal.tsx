import { useState, useEffect, useRef } from 'react';
import {
  X,
  ChevronRight,
  ChevronLeft,
  Upload,
  AlertCircle,
  CheckCircle2,
  FileText,
  Trash2,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { BubbleLoader } from '@/components/ui/BubbleLoader';
import { compressPhoto } from '@/utils/imageCompression';
import {
  COMMONS_POST_TYPES,
  COMMONS_POST_TYPES_LIST,
  type CommonsPost,
  type CommonsPostType,
  type CommonsFileAttachment,
} from '@/types/commons';
import {
  createCommonsPost,
  checkPostingRateLimit,
  DAILY_POST_LIMIT,
  isExecutableFile,
} from '@/services/commonsService';
import {
  uploadCommonsAttachment,
  cleanupUploadedAttachment,
  rollbackUploadedPostFiles,
  ensureAuthenticatedUser,
  isAllowedCommonsFile,
  validateCommonsFile,
  CommonsUploadError,
} from '@/services/commonsUploadService';
import { sanitizeStudentDisplayName } from '@/utils/privacy';

function withTimeout<T>(promise: Promise<T>, ms: number, timeoutMessage: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(timeoutMessage));
    }, ms);
    promise
      .then((val) => {
        clearTimeout(timer);
        resolve(val);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

const ALLOWED_EXTENSIONS = [
  '.pdf',
  '.png',
  '.jpg',
  '.jpeg',
  '.webp',
  '.gif',
  '.doc',
  '.docx',
  '.ppt',
  '.pptx',
  '.txt',
];
const MAX_ATTACHMENT_BYTES = 25 * 1024 * 1024; // 25 MB

interface StagedAttachment {
  id: string;
  file: File;
  originalFile: File;
  name: string;
  size: number;
  type: string;
  previewUrl: string;
  isImage: boolean;
  status: 'compressing' | 'staged' | 'uploading' | 'uploaded' | 'error';
  progress: number;
  uploadedUrl?: string;
  r2Key?: string;
  downloadUrl?: string;
  fallbackId?: string;
  totalChunks?: number;
  errorMessage?: string;
}

interface PostingWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostCreated: (postId: string, optimisticPost?: CommonsPost) => void;
  currentUser: {
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
  initialType?: CommonsPostType;
  initialAnonymous?: boolean;
  initialStep?: 1 | 2;
  triggerUploadOnMount?: 'photo' | 'file' | null;
}

export function PostingWizardModal({
  isOpen,
  onClose,
  onPostCreated,
  currentUser,
  initialType,
  initialAnonymous,
  initialStep,
  triggerUploadOnMount,
}: PostingWizardModalProps) {
  const [currentStep, setCurrentStep] = useState<1 | 2>(initialStep || 1);

  // Form State
  const [selectedType, setSelectedType] = useState<CommonsPostType>(initialType || 'notes');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [stagedFiles, setStagedFiles] = useState<StagedAttachment[]>([]);
  const stagedFilesRef = useRef<StagedAttachment[]>([]);
  stagedFilesRef.current = stagedFiles;
  const activeUploadsRef = useRef<Map<string, Promise<CommonsFileAttachment>>>(new Map());
  const draftPostIdRef = useRef<string>(
    `post_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
  );

  // Custom Tags
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  // Consent & Identity Checkboxes
  const [consentAcademic, setConsentAcademic] = useState(true);
  const [isAnonymous, setIsAnonymous] = useState<boolean>(initialAnonymous || false);

  // Status & Error
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      draftPostIdRef.current = `post_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
      if (initialType) setSelectedType(initialType);
      if (typeof initialAnonymous === 'boolean') setIsAnonymous(initialAnonymous);
      if (initialStep) setCurrentStep(initialStep);
      setErrorMsg(null);
      setUploadStatus(null);
      if (triggerUploadOnMount) {
        setTimeout(() => {
          fileInputRef.current?.click();
        }, 150);
      }
    }
  }, [isOpen, initialType, initialAnonymous, initialStep, triggerUploadOnMount]);

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      stagedFilesRef.current.forEach((f) => {
        if (f.previewUrl?.startsWith('blob:')) {
          URL.revokeObjectURL(f.previewUrl);
        }
      });
    };
  }, []);

  if (!isOpen) return null;

  const formatFileSize = (bytes: number): string => {
    if (!bytes || bytes < 1024) return `${bytes || 0} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleAddTag = () => {
    const trimmed = tagInput.trim().replace(/^#/, '').toLowerCase();
    if (trimmed && !tags.includes(trimmed) && tags.length < 8) {
      setTags([...tags, trimmed]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedList = e.target.files;
    if (!selectedList || selectedList.length === 0) return;

    setErrorMsg(null);
    const filesArray = Array.from(selectedList);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    if (stagedFiles.length + filesArray.length > 5) {
      setErrorMsg(
        `You can attach a maximum of 5 files per post (currently ${stagedFiles.length}/5 attached).`
      );
      return;
    }

    const validationErrors: string[] = [];
    const validEntries: StagedAttachment[] = [];

    for (let i = 0; i < filesArray.length; i++) {
      const file = filesArray[i];
      const lowerName = file.name.toLowerCase();

      // 1. Block executable files
      if (isExecutableFile(file.name)) {
        const msg = `Blocked file "${file.name}": executable and script files are strictly prohibited.`;
        console.error('[PostingWizard] File validation failed:', {
          step: 'file_picker_validation',
          code: 'UNSUPPORTED_TYPE',
          fileName: file.name,
          fileSize: file.size,
        });
        validationErrors.push(msg);
        continue;
      }

      // 2. Check supported extensions
      const hasSupportedExt = ALLOWED_EXTENSIONS.some((ext) => lowerName.endsWith(ext));
      const isSupportedMime =
        file.type.startsWith('image/') ||
        file.type === 'application/pdf' ||
        file.type.includes('word') ||
        file.type.includes('presentation') ||
        file.type.includes('powerpoint') ||
        file.type === 'text/plain';

      if (!hasSupportedExt && !isSupportedMime) {
        const msg = `Unsupported file format for "${file.name}". Allowed formats: PNG, JPG, WEBP, GIF, PDF, DOC, DOCX, PPT, PPTX, TXT.`;
        console.error('[PostingWizard] File validation failed:', {
          step: 'file_picker_validation',
          code: 'UNSUPPORTED_TYPE',
          fileName: file.name,
          fileType: file.type,
        });
        validationErrors.push(msg);
        continue;
      }

      // 3. Check empty file
      if (file.size === 0) {
        const msg = `File "${file.name}" is empty (0 bytes).`;
        console.error('[PostingWizard] File validation failed:', {
          step: 'file_picker_validation',
          code: 'EMPTY_FILE',
          fileName: file.name,
        });
        validationErrors.push(msg);
        continue;
      }

      // 4. Max 25 MB
      if (file.size > MAX_ATTACHMENT_BYTES) {
        const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
        const msg = `File "${file.name}" (${sizeMb} MB) exceeds the 25 MB maximum size limit.`;
        console.error('[PostingWizard] File validation failed:', {
          step: 'file_picker_validation',
          code: 'FILE_TOO_LARGE',
          fileName: file.name,
          fileSize: file.size,
        });
        validationErrors.push(msg);
        continue;
      }

      const isImage =
        file.type.startsWith('image/') || /\.(png|jpe?g|webp|gif)$/i.test(file.name);
      const shouldCompress = isImage && !/\.gif$/i.test(file.name) && file.type !== 'image/gif';

      const id = `staged_${Date.now()}_${i}_${Math.random().toString(36).slice(2, 7)}`;
      const previewUrl = URL.createObjectURL(file);

      const entry: StagedAttachment = {
        id,
        file,
        originalFile: file,
        name: file.name,
        size: file.size,
        type: file.type || (isImage ? 'image/jpeg' : 'application/octet-stream'),
        previewUrl,
        isImage,
        status: shouldCompress ? 'compressing' : 'staged',
        progress: 0,
      };

      validEntries.push(entry);

      // Run compression non-blockingly in the background with fallback to original file.
      // Do NOT upload to Storage/Firestore until the post is validated and allowed in handlePublish.
      if (shouldCompress) {
        void compressPhoto(file, { maxDimension: 1600, quality: 0.82, timeoutMs: 4000 })
          .then((compressed) => {
            const updatedEntry: StagedAttachment = {
              ...entry,
              file: compressed,
              size: compressed.size,
              type: compressed.type || entry.type,
              status: 'staged',
            };
            setStagedFiles((prev) =>
              prev.map((item) => (item.id === id ? updatedEntry : item))
            );
          })
          .catch((err) => {
            console.warn(`[PostingWizard] Non-blocking compression fallback for "${file.name}":`, err);
            const fallbackEntry: StagedAttachment = {
              ...entry,
              file,
              status: 'staged',
            };
            setStagedFiles((prev) =>
              prev.map((item) => (item.id === id ? fallbackEntry : item))
            );
          });
      }
    }

    if (validationErrors.length > 0) {
      setErrorMsg(validationErrors.join(' '));
    }

    if (validEntries.length > 0) {
      setStagedFiles((prev) => [...prev, ...validEntries]);
    }
  };

  const handleRemoveFile = (index: number) => {
    const target = stagedFiles[index];
    if (target) {
      activeUploadsRef.current.delete(target.id);
      if (target.previewUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(target.previewUrl);
      }
      if (target.uploadedUrl || target.fallbackId) {
        void cleanupUploadedAttachment(
          {
            url: target.uploadedUrl,
            fallbackId: target.fallbackId,
            totalChunks: target.totalChunks,
          },
          currentUser?.uid
        );
      }
    }
    setStagedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadSingleAttachmentItem = async (
    item: StagedAttachment,
    indexLabel?: string
  ): Promise<CommonsFileAttachment> => {
    // Check latest state in ref in case background upload already finished
    const latest = stagedFilesRef.current.find((f) => f.id === item.id) || item;
    if (latest.status === 'uploaded' && latest.uploadedUrl) {
      return {
        name: latest.name,
        size: latest.size,
        type: latest.type,
        url: latest.uploadedUrl,
      };
    }

    // Reuse any in-flight upload promise for this item
    const existingPromise = activeUploadsRef.current.get(item.id);
    if (existingPromise) {
      return existingPromise;
    }

    const uploadPromise = (async (): Promise<CommonsFileAttachment> => {
    // If still compressing, wait briefly (max 1.5s) or use original file immediately
    let fileToUpload = latest.file || latest.originalFile;
    if (latest.status === 'compressing') {
      try {
        fileToUpload = await compressPhoto(latest.originalFile, {
          maxDimension: 1600,
          quality: 0.82,
          timeoutMs: 1500,
        });
      } catch {
        fileToUpload = latest.originalFile;
      }
    }

    setStagedFiles((prev) =>
      prev.map((f) =>
        f.id === item.id
          ? {
              ...f,
              file: fileToUpload,
              size: fileToUpload.size,
              status: 'uploading',
              progress: 1,
              errorMessage: undefined,
            }
          : f
      )
    );

    try {
      const result = await uploadCommonsAttachment({
        file: fileToUpload,
        postId: draftPostIdRef.current,
        displayName: item.name,
        userId: currentUser.uid,
        isImage: item.isImage,
        inactivityTimeoutMs: 30000,
        maxAttempts: 3,
        onProgress: (pct) => {
          setStagedFiles((prev) =>
            prev.map((f) =>
              f.id === item.id ? { ...f, status: 'uploading', progress: pct } : f
            )
          );
          if (indexLabel) {
            setUploadStatus(`${indexLabel} (${pct}%)...`);
          }
        },
        onRetry: (attempt, maxAttempts) => {
          if (indexLabel) {
            setUploadStatus(`${indexLabel} — retrying (attempt ${attempt}/${maxAttempts})...`);
          }
        },
      });

      setStagedFiles((prev) =>
        prev.map((f) =>
          f.id === item.id
            ? {
                ...f,
                status: 'uploaded',
                progress: 100,
                uploadedUrl: result.url,
                r2Key: result.r2Key,
                downloadUrl: result.downloadUrl,
                fallbackId: result.fallbackId,
                totalChunks: result.totalChunks,
                errorMessage: undefined,
              }
            : f
        )
      );

      return {
        name: item.name,
        size: result.size,
        type: result.type,
        url: result.url,
        r2Key: result.r2Key,
        downloadUrl: result.downloadUrl,
      };
    } catch (err: any) {
      const specificMsg =
        err instanceof CommonsUploadError
          ? err.message
          : err?.message || `Failed to upload "${item.name}".`;

      setStagedFiles((prev) =>
        prev.map((f) =>
          f.id === item.id
            ? {
                ...f,
                status: 'error',
                progress: 0,
                errorMessage: specificMsg,
              }
            : f
        )
      );

      throw err;
    } finally {
      activeUploadsRef.current.delete(item.id);
    }
    })();

    activeUploadsRef.current.set(item.id, uploadPromise);
    return uploadPromise;
  };

  const handleRetryFile = async (itemId: string) => {
    const target = stagedFilesRef.current.find((f) => f.id === itemId);
    if (!target || !currentUser?.uid) return;

    setErrorMsg(null);
    activeUploadsRef.current.delete(itemId);
    try {
      await uploadSingleAttachmentItem({
        ...target,
        status: 'staged',
        progress: 0,
        errorMessage: undefined,
      });
    } catch (err: any) {
      setErrorMsg(
        err?.message || `Upload failed for "${target.name}". Please check the error on the file and try again.`
      );
    }
  };

  const handlePublish = async () => {
    setErrorMsg(null);

    const trimmedTitle = title.trim();
    const trimmedDesc = description.trim();

    if (!trimmedTitle) {
      setErrorMsg('Please enter a clear title for your resource.');
      return;
    }
    if (trimmedTitle.length > 200) {
      setErrorMsg('Title cannot exceed 200 characters.');
      return;
    }
    if (!trimmedDesc) {
      setErrorMsg('Please enter a short description to help peers find and understand this material.');
      return;
    }
    if (trimmedDesc.length > 20000) {
      setErrorMsg('Description cannot exceed 20,000 characters.');
      return;
    }
    if (!consentAcademic) {
      setErrorMsg('You must agree to the academic integrity and community guidelines consent.');
      return;
    }

    if (!currentUser?.uid) {
      setErrorMsg('Session expired or not signed in: Please sign in to publish a resource.');
      return;
    }

    const currentFiles = [...stagedFilesRef.current];
    if (currentFiles.length > 5) {
      setErrorMsg('Maximum 5 files are allowed per post.');
      return;
    }

    for (const f of currentFiles) {
      const check = validateCommonsFile(f.file || f.name, f.type, f.size);
      if (!check.valid) {
        setErrorMsg(check.reason || 'Unsupported file type');
        return;
      }
    }

    setIsSubmitting(true);
    setUploadStatus('Verifying session & permissions...');

    const uploadedR2Keys: string[] = [];
    const postId = draftPostIdRef.current;

    try {
      // 1. Verify active Firebase Auth session & refresh token before uploading any file
      await ensureAuthenticatedUser(currentUser.uid, false);

      // 2. Verify daily posting rate limit BEFORE uploading files so disallowed posts never create orphan files
      const rateLimit = await checkPostingRateLimit(currentUser.uid);
      if (!rateLimit.allowed) {
        throw new Error(
          `Daily posting limit reached (${DAILY_POST_LIMIT} posts/day). Please try again tomorrow.`
        );
      }

      const finalAttachments: CommonsFileAttachment[] = [];

      // 3. Upload staged files to R2 under posts/{postId}/{random-id}-{safe-filename}
      for (let i = 0; i < currentFiles.length; i++) {
        const item = currentFiles[i];
        const label = `Uploading file ${i + 1} of ${currentFiles.length}`;
        setUploadStatus(`${label}...`);
        const uploadedAttachment = await uploadSingleAttachmentItem(item, label);
        finalAttachments.push(uploadedAttachment);
        if (uploadedAttachment.r2Key) {
          uploadedR2Keys.push(uploadedAttachment.r2Key);
        }
      }

      setUploadStatus('Publishing post...');

      // 4. Save post metadata + R2 file list in Cloudflare D1
      const { postId: createdPostId, post: createdPost } = await withTimeout(
        createCommonsPost({
          postId,
          author: currentUser,
          currentUser,
          type: selectedType,
          title: trimmedTitle,
          description: trimmedDesc,
          tags: tags.slice(0, 8),
          files: finalAttachments.slice(0, 5),
          isAnonymous,
        }),
        25000,
        'Upload failed, try again'
      );

      onPostCreated(createdPostId, createdPost);
      onClose();
    } catch (err: any) {
      // Roll back any uploaded R2 files if multi-file upload or D1 insert failed
      if (uploadedR2Keys.length > 0) {
        await rollbackUploadedPostFiles(uploadedR2Keys, postId);
        setStagedFiles((prev) =>
          prev.map((f) => ({
            ...f,
            status: 'staged',
            progress: 0,
            uploadedUrl: undefined,
            r2Key: undefined,
            downloadUrl: undefined,
          }))
        );
      }

      console.error('[PostingWizard] Publish failed:', {
        postId,
        step: err instanceof CommonsUploadError ? err.step : 'create_commons_post',
        code: err instanceof CommonsUploadError ? err.code : err?.code || 'PUBLISH_ERROR',
        message: err?.message,
        error: err,
      });

      const friendlyMsg =
        err instanceof CommonsUploadError
          ? err.userMessage
          : err instanceof Error
          ? err.message
          : 'Upload failed, try again';

      setErrorMsg(friendlyMsg);
    } finally {
      setIsSubmitting(false);
      setUploadStatus(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 overflow-y-auto font-sans">
      <div className="relative w-full max-w-2xl glass-panel allow-backdrop-blur rounded-[28px] overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--glass-border)]">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-accent animate-pulse" />
            <h2 className="text-sm sm:text-base font-bold tracking-tight text-primary font-dot">
              Share Study Resource
            </h2>
            <span className="text-[11px] font-dot font-bold text-muted glass-pill px-2.5 py-0.5 rounded-full">
              Step {currentStep} of 2
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-muted hover:text-primary rounded-lg hover:bg-surface-muted transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Step Indicator Bar */}
        <div className="h-1 w-full bg-surface-muted">
          <div
            className="h-full bg-accent transition-all duration-300"
            style={{ width: currentStep === 1 ? '50%' : '100%' }}
          />
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 max-h-[80vh] overflow-y-auto space-y-5">
          {errorMsg && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-tag-danger-bg border border-tag-danger-text/30 text-tag-danger-text text-xs">
              <AlertCircle size={16} className="text-accent shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              STEP 1: MATERIAL TYPE SELECTION
             ══════════════════════════════════════════════════════════════════ */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-primary font-sans">
                  What type of material are you sharing?
                </h3>
                <p className="text-xs text-muted mt-1">
                  Select the category that best describes your study contribution:
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                {(Array.isArray(COMMONS_POST_TYPES_LIST)
                  ? COMMONS_POST_TYPES_LIST
                  : Array.isArray(COMMONS_POST_TYPES)
                  ? (COMMONS_POST_TYPES as any)
                  : COMMONS_POST_TYPES && typeof COMMONS_POST_TYPES === 'object'
                  ? Object.values(COMMONS_POST_TYPES)
                  : []
                ).map((typeMeta: any) => {
                  const isSelected = selectedType === typeMeta.type;
                  return (
                    <button
                      key={typeMeta.type}
                      type="button"
                      onClick={() => setSelectedType(typeMeta.type)}
                      className={`flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'border-accent bg-accent-soft shadow-xs'
                          : 'border-border bg-surface hover:border-border-strong hover:bg-surface-muted'
                      }`}
                    >
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                          isSelected ? 'bg-accent text-on-accent' : 'bg-surface-muted text-secondary'
                        }`}
                      >
                        <FileText size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span
                            className={`text-xs font-bold uppercase tracking-wide font-sans ${
                              isSelected ? 'text-accent' : 'text-primary'
                            }`}
                          >
                            {typeMeta.label}
                          </span>
                          {isSelected && <CheckCircle2 size={15} className="text-accent" />}
                        </div>
                        <p className="text-[11px] text-muted mt-0.5 leading-relaxed">
                          {typeMeta.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Step 1 Footer Action */}
              <div className="pt-3 border-t border-border flex justify-end">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent hover:opacity-90 text-on-accent font-bold text-xs tracking-wide shadow-xs transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                >
                  <span>Continue to Details</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              STEP 2: TITLE, DESCRIPTION, ATTACHMENTS, TAGS, VISIBILITY & PUBLISH
             ══════════════════════════════════════════════════════════════════ */}
          {currentStep === 2 && (
            <div className="space-y-4">
              {/* Back to Step 1 Switcher */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-surface-muted border border-border">
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-muted">Material Type:</span>
                  <span className="font-semibold uppercase text-accent bg-accent-soft px-2 py-0.5 rounded border border-accent/30 text-[11px]">
                    {selectedType.replace('_', ' ')}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="text-xs text-muted hover:text-primary flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <ChevronLeft size={14} />
                  <span>Change type</span>
                </button>
              </div>

              {/* 1. Title Input */}
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-secondary">
                  Title <span className="text-accent">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Complete Differentiation & Limits Handwritten Notes"
                  className="w-full text-xs sm:text-sm bg-surface border border-border rounded-xl p-3 text-primary placeholder:text-muted focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-colors"
                />
              </div>

              {/* 2. Description Input */}
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-secondary">
                  Description <span className="text-accent">*</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Summarize key topics covered, problem breakdowns, shortcuts..."
                  className="w-full text-xs sm:text-sm bg-surface border border-border rounded-xl p-3 text-primary placeholder:text-muted focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-colors resize-none"
                />
              </div>

              {/* 3. Attachments */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase tracking-wider text-secondary">
                    Attach Files (Images, PDF, Notes)
                  </label>
                  <span className="text-[11px] text-muted">
                    {stagedFiles.length}/5 files
                  </span>
                </div>

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-border hover:border-border-strong bg-surface-muted/60 rounded-xl p-4 text-center cursor-pointer transition-colors group"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".pdf,.png,.jpg,.jpeg,.webp,.gif,.doc,.docx,.ppt,.pptx,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Upload size={20} className="mx-auto text-muted group-hover:text-accent transition-colors" />
                  <p className="text-xs text-primary mt-1.5 font-medium">
                    Click to select photos or documents
                  </p>
                  <p className="text-[11px] text-muted mt-0.5">
                    PNG, JPG, WEBP, GIF (auto-compressed), PDF, DOCX (up to 25 MB)
                  </p>
                </div>

                {/* Staged Files List with previews, progress bar, error message & Retry button */}
                {stagedFiles.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    {stagedFiles.map((file, idx) => (
                      <div
                        key={file.id || idx}
                        className={`p-2.5 rounded-lg bg-surface border text-xs transition-colors ${
                          file.status === 'error'
                            ? 'border-tag-danger-text/50 bg-tag-danger-bg/20'
                            : 'border-border'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            {file.isImage ? (
                              <div className="w-8 h-8 rounded-md overflow-hidden bg-surface-muted shrink-0 border border-border">
                                <img
                                  src={file.previewUrl}
                                  alt={file.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ) : (
                              <FileText size={16} className="text-accent shrink-0 ml-1" />
                            )}
                            <span className="truncate text-primary font-medium">{file.name}</span>
                            <span className="text-[11px] text-muted shrink-0">
                              ({formatFileSize(file.size)})
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {file.status === 'compressing' && (
                              <div className="w-32">
                                <BubbleLoader
                                  variant="inline"
                                  customMessages={['Optimizing file...']}
                                />
                              </div>
                            )}
                            {file.status === 'uploading' && (
                              <div className="w-32">
                                <BubbleLoader
                                  variant="inline"
                                  progress={file.progress}
                                  customMessages={['Uploading file...']}
                                />
                              </div>
                            )}
                            {file.status === 'uploaded' && (
                              <span
                                className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-500 px-1.5 py-0.5 rounded bg-emerald-500/10"
                                title="Uploaded and ready"
                              >
                                <CheckCircle2 size={12} />
                                <span>Ready</span>
                              </span>
                            )}
                            {file.status === 'error' && (
                              <button
                                type="button"
                                onClick={() => handleRetryFile(file.id)}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold bg-accent text-on-accent hover:opacity-90 transition-opacity cursor-pointer"
                                title="Retry uploading this file"
                              >
                                <RefreshCw size={11} />
                                <span>Retry</span>
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleRemoveFile(idx)}
                              className="text-muted hover:text-accent p-1 transition-colors cursor-pointer"
                              aria-label="Remove attachment"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>

                        {/* Real upload progress bar */}
                        {(file.status === 'uploading' || file.status === 'compressing') && (
                          <div className="mt-2 h-1.5 w-full rounded-full bg-surface-muted overflow-hidden">
                            <div
                              className="h-full bg-accent transition-all duration-150 rounded-full"
                              style={{
                                width:
                                  file.status === 'compressing'
                                    ? '15%'
                                    : `${Math.max(4, Math.min(100, file.progress))}%`,
                              }}
                            />
                          </div>
                        )}

                        {/* Per-file specific error message */}
                        {file.status === 'error' && file.errorMessage && (
                          <div className="mt-1.5 flex items-start gap-1.5 text-[11px] text-tag-danger-text leading-snug">
                            <AlertCircle size={12} className="shrink-0 mt-0.5 text-accent" />
                            <span>{file.errorMessage}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 4. TAGS (CUSTOM TOPIC / SUBJECT TAGS) */}
              <div className="space-y-2 pt-1 border-t border-border">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase tracking-wider text-secondary flex items-center gap-2">
                    <span>Tags (Optional)</span>
                  </label>
                  <span className="text-[11px] text-muted font-mono">
                    {tags.length}/8 tags
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 p-2.5 rounded-xl border border-border bg-surface min-h-[46px]">
                  {tags.map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono bg-surface-muted border border-border text-secondary"
                    >
                      <span>#{t}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(t)}
                        className="text-muted hover:text-accent ml-0.5 cursor-pointer"
                      >
                        ×
                      </button>
                    </span>
                  ))}

                  <div className="flex items-center gap-1 flex-1 min-w-[140px]">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddTag();
                        }
                      }}
                      placeholder="+ Add tag (e.g. #physics) — Enter"
                      className="w-full text-xs bg-transparent text-primary placeholder:text-muted focus:outline-none px-1"
                    />
                    {tagInput.trim() && (
                      <button
                        type="button"
                        onClick={handleAddTag}
                        className="text-[10px] font-mono text-accent px-1.5 py-0.5 rounded bg-surface-muted border border-border shrink-0 cursor-pointer"
                      >
                        Add
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* VISIBILITY OPTION (PUBLIC OR ANONYMOUS) */}
              <div className="space-y-2 pt-3 border-t border-border">
                <label className="text-xs font-semibold text-primary block">Post visibility</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsAnonymous(false)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      !isAnonymous
                        ? 'border-accent bg-accent-soft shadow-xs'
                        : 'border-border bg-surface hover:border-border-strong hover:bg-surface-muted'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div
                        className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                          !isAnonymous ? 'border-accent bg-accent' : 'border-border'
                        }`}
                      >
                        {!isAnonymous && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                      <span className="text-xs font-bold text-primary font-sans">Post publicly</span>
                    </div>
                    <p className="text-[11px] text-muted pl-5.5 leading-snug">
                      Public posts show your name and appear on your profile.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsAnonymous(true)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      isAnonymous
                        ? 'border-accent bg-accent-soft shadow-xs'
                        : 'border-border bg-surface hover:border-border-strong hover:bg-surface-muted'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div
                        className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                          isAnonymous ? 'border-accent bg-accent' : 'border-border'
                        }`}
                      >
                        {isAnonymous && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                      <span className="text-xs font-bold text-primary font-sans">Post anonymously</span>
                    </div>
                    <p className="text-[11px] text-muted pl-5.5 leading-snug">
                      Anonymous posts show no name and never appear on your profile.
                    </p>
                  </button>
                </div>
              </div>

              {/* CONSENT CHECKBOX & PUBLISH */}
              <div className="pt-2">
                <label className="flex items-start gap-2.5 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={consentAcademic}
                    onChange={(e) => setConsentAcademic(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-border bg-surface text-accent focus:ring-accent focus:ring-offset-0 cursor-pointer accent-red-600"
                  />
                  <span className="text-xs text-secondary leading-snug">
                    I confirm this material complies with Boardly Community Guidelines, is intended for peer academic learning, and does not contain unauthorized exam leaks.
                  </span>
                </label>
              </div>

              {/* Publish Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handlePublish}
                  disabled={isSubmitting || !title.trim() || !description.trim() || !consentAcademic}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm bg-accent hover:opacity-90 disabled:bg-surface-muted disabled:text-muted disabled:cursor-not-allowed text-on-accent shadow-xs transition-all active:scale-[0.99] cursor-pointer"
                >
                  {isSubmitting ? (
                    <BubbleLoader
                      variant="inline"
                      customMessages={[uploadStatus || 'Posting to Commons...']}
                    />
                  ) : (
                    <>
                      <Sparkles size={16} />
                      <span>Publish Resource</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PostingWizardModal;
