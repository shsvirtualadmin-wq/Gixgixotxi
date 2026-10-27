import { useState, useEffect, useRef } from 'react';
import {
  X,
  ChevronRight,
  ChevronLeft,
  Upload,
  AlertCircle,
  CheckCircle2,
  FileText,
  File,
  Image as ImageIcon,
  Trash2,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import { compressPhoto } from '@/utils/imageCompression';
import {
  COMMONS_POST_TYPES,
  COMMONS_POST_TYPES_LIST,
  type CommonsPost,
  type CommonsPostType,
  type CommonsFileAttachment,
} from '@/types/commons';
import { createCommonsPost, isExecutableFile } from '@/services/commonsService';
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

interface StagedAttachment {
  file?: File;
  name: string;
  size: number;
  type: string;
  previewUrl: string;
  isImage: boolean;
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
      stagedFiles.forEach((f) => {
        if (f.previewUrl?.startsWith('blob:')) {
          URL.revokeObjectURL(f.previewUrl);
        }
      });
    };
  }, [stagedFiles]);

  if (!isOpen) return null;

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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedList = e.target.files;
    if (!selectedList || selectedList.length === 0) return;

    setErrorMsg(null);
    if (stagedFiles.length + selectedList.length > 5) {
      setErrorMsg('You can attach a maximum of 5 files per post.');
      return;
    }

    const newlyAdded: StagedAttachment[] = [];

    for (let i = 0; i < selectedList.length; i++) {
      const file = selectedList[i];

      // Block executable files
      if (isExecutableFile(file.name)) {
        setErrorMsg(`Blocked file "${file.name}". Executables & script files are strictly prohibited.`);
        return;
      }

      // Max 25 MB
      if (file.size > 25 * 1024 * 1024) {
        setErrorMsg(`File "${file.name}" exceeds the 25 MB maximum size limit.`);
        return;
      }

      const isImage =
        file.type.startsWith('image/') ||
        /\.(png|jpe?g|webp|gif)$/i.test(file.name);

      let processedFile = file;
      if (isImage) {
        // Compress photo client-side before staging (max 1600px, quality 0.8)
        try {
          processedFile = await compressPhoto(file, { maxDimension: 1600, quality: 0.8 });
        } catch (err) {
          console.warn('[PostingWizard] Compression fallback:', err);
          processedFile = file;
        }
      }

      const previewUrl = URL.createObjectURL(processedFile);
      newlyAdded.push({
        file: processedFile,
        name: processedFile.name,
        size: processedFile.size,
        type: processedFile.type || (isImage ? 'image/jpeg' : 'application/octet-stream'),
        previewUrl,
        isImage,
      });
    }

    setStagedFiles((prev) => [...prev, ...newlyAdded]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveFile = (index: number) => {
    const target = stagedFiles[index];
    if (target?.previewUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(target.previewUrl);
    }
    setStagedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handlePublish = async () => {
    setErrorMsg(null);

    if (!title.trim()) {
      setErrorMsg('Please enter a clear title for your resource.');
      return;
    }
    if (!description.trim()) {
      setErrorMsg('Please enter a short description to help peers find and understand this material.');
      return;
    }
    if (!consentAcademic) {
      setErrorMsg('You must agree to the academic integrity and community guidelines consent.');
      return;
    }

    if (!currentUser?.uid) {
      setErrorMsg('You must be signed in to create a post.');
      return;
    }

    setIsSubmitting(true);
    setUploadStatus('Uploading attachments...');

    try {
      const finalAttachments: CommonsFileAttachment[] = [];

      // 1. Upload files to Firebase Storage first and await download URLs (with 20s timeout per file)
      for (let i = 0; i < stagedFiles.length; i++) {
        const item = stagedFiles[i];
        if (item.file) {
          setUploadStatus(`Uploading file ${i + 1} of ${stagedFiles.length}...`);

          const cleanFileName = item.file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
          // Images go into users/{uid}/posts/{timestamp}_{filename}
          // Documents go into commons/{uid}/{timestamp}_{filename}
          const storagePath = item.isImage
            ? `users/${currentUser.uid}/posts/${Date.now()}_${cleanFileName}`
            : `commons/${currentUser.uid}/${Date.now()}_${cleanFileName}`;

          const fileRef = ref(storage, storagePath);
          const uploadSnapshot = await withTimeout(
            uploadBytes(fileRef, item.file, {
              contentType: item.file.type || (item.isImage ? 'image/jpeg' : 'application/octet-stream'),
            }),
            20000,
            `Uploading "${item.name}" timed out. Please check your internet connection and try again.`
          );

          const downloadUrl = await withTimeout(
            getDownloadURL(uploadSnapshot.ref),
            15000,
            `Fetching download link for "${item.name}" timed out. Please try again.`
          );

          finalAttachments.push({
            name: item.name,
            size: item.size,
            type: item.type,
            url: downloadUrl,
          });
        }
      }

      setUploadStatus('Publishing post...');

      // 2. Create post document with persistent download URLs (with 18s timeout)
      const newPostId = await withTimeout(
        createCommonsPost({
          currentUser,
          type: selectedType,
          title: title.trim(),
          description: description.trim(),
          tags,
          files: finalAttachments,
          isAnonymous,
        }),
        18000,
        'Publishing timed out due to a slow connection. Please check your network and try again.'
      );

      const cleanAuthorName = isAnonymous
        ? 'Anonymous'
        : sanitizeStudentDisplayName(currentUser.displayName, currentUser.uid);

      const optimisticPost: CommonsPost = {
        id: newPostId,
        type: selectedType,
        title: title.trim(),
        description: description.trim(),
        subject: '',
        chapter: '',
        target: '',
        tags: tags.map((t) => t.trim().toLowerCase()).filter(Boolean),
        files: finalAttachments,
        isAnonymous: Boolean(isAnonymous),
        authorUid: isAnonymous ? null : currentUser.uid,
        authorName: cleanAuthorName,
        authorAvatar: isAnonymous
          ? null
          : currentUser.equippedAvatar || currentUser.avatarUrl || currentUser.photoURL || null,
        authorFrame: isAnonymous ? null : currentUser.frame || null,
        authorEquippedAvatar: isAnonymous ? null : currentUser.equippedAvatar || null,
        authorPhotoURL: isAnonymous ? null : currentUser.photoURL || null,
        authorRole: isAnonymous ? null : currentUser.role || 'Student',
        authorCustomRole: isAnonymous ? null : currentUser.customRole || null,
        upvotes: 0,
        commentCount: 0,
        saveCount: 0,
        reportCount: 0,
        isHidden: false,
        searchKeywords: [],
        createdAt: { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 },
        updatedAt: { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 },
      };

      onPostCreated(newPostId, optimisticPost);
      onClose();
    } catch (err: unknown) {
      console.error('[PostingWizard] publish error:', err);
      const rawMsg = err instanceof Error ? err.message : 'Failed to publish post.';
      const friendlyMsg = rawMsg.includes('permission-denied') || rawMsg.includes('Missing or insufficient permissions')
        ? 'Permission denied while publishing your post. Please refresh and try again.'
        : rawMsg;
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

                {/* Staged Files List with previews */}
                {stagedFiles.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    {stagedFiles.map((file, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 rounded-lg bg-surface border border-border text-xs"
                      >
                        <div className="flex items-center gap-2.5 truncate">
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
                            ({(file.size / 1024).toFixed(0)} KB)
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveFile(idx)}
                          className="text-muted hover:text-accent p-1 transition-colors cursor-pointer"
                          aria-label="Remove attachment"
                        >
                          <Trash2 size={13} />
                        </button>
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
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>{uploadStatus || 'Publishing to Commons...'}</span>
                    </>
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
