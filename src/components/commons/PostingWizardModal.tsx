import { useState, useRef } from 'react';
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
  HelpCircle,
  Eye,
  EyeOff,
  Sparkles,
  Shield,
  Layers,
  MessageSquare,
} from 'lucide-react';
import { COMMONS_POST_TYPES, COMMONS_POST_TYPES_LIST, type CommonsPostType, type CommonsFileAttachment } from '@/types/commons';
import { createCommonsPost, isExecutableFile } from '@/services/commonsService';

interface PostingWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostCreated: (postId: string) => void;
  currentUser: {
    uid: string;
    email?: string | null;
    displayName?: string | null;
    photoURL?: string | null;
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
  // Step 1: Material Type selection
  // Step 2: Title, Description, Uploads, Tags with [Filter] option, Consent & Publish
  const [currentStep, setCurrentStep] = useState<1 | 2>(initialStep || 1);

  // Form State
  const [selectedType, setSelectedType] = useState<CommonsPostType>(initialType || 'notes');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState<CommonsFileAttachment[]>([]);

  // Custom Tags
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  // Consent & Identity Checkboxes
  const [consentAcademic, setConsentAcademic] = useState(true);
  const [isAnonymous, setIsAnonymous] = useState<boolean>(initialAnonymous || false);

  // Status & Error
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (initialType) setSelectedType(initialType);
      if (typeof initialAnonymous === 'boolean') setIsAnonymous(initialAnonymous);
      if (initialStep) setCurrentStep(initialStep);
      setErrorMsg(null);
      if (triggerUploadOnMount) {
        setTimeout(() => {
          fileInputRef.current?.click();
        }, 150);
      }
    }
  }, [isOpen, initialType, initialAnonymous, initialStep, triggerUploadOnMount]);

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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedList = e.target.files;
    if (!selectedList || selectedList.length === 0) return;

    setErrorMsg(null);
    if (files.length + selectedList.length > 5) {
      setErrorMsg('You can attach a maximum of 5 files per post.');
      return;
    }

    const newAttachments: CommonsFileAttachment[] = [];

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

      const previewUrl = URL.createObjectURL(file);
      newAttachments.push({
        name: file.name,
        size: file.size,
        type: file.type || 'application/octet-stream',
        url: previewUrl,
      });
    }

    setFiles([...files, ...newAttachments]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
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

    setIsSubmitting(true);
    try {
      const newPostId = await createCommonsPost({
        currentUser,
        type: selectedType,
        title: title.trim(),
        description: description.trim(),
        tags,
        files,
        isAnonymous,
      });

      onPostCreated(newPostId);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to publish post.';
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-raised">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-accent animate-pulse" />
            <h2 className="text-sm sm:text-base font-bold tracking-tight text-primary">
              Share Study Resource
            </h2>
            <span className="text-[11px] font-mono text-muted bg-surface-muted border border-border px-2 py-0.5 rounded-full">
              Step {currentStep} of 2
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-muted hover:text-primary rounded-lg hover:bg-surface-muted transition-colors cursor-pointer"
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
              STEP 1: ASK ONLY FOR THE TYPE OF MATERIAL BEING SHARED
             ══════════════════════════════════════════════════════════════════ */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-primary">
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
                            className={`text-xs font-bold uppercase tracking-wide ${
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
              STEP 2: TITLE, DESCRIPTION, ATTACHMENTS,
                      TAGS & [FILTER] OPTION RIGHT IN THE SAME PLACE,
                      CONSENT CHECKBOX(ES), THEN PUBLISH BUTTON
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
                    Attach Files (PDF, Images, Docs)
                  </label>
                  <span className="text-[11px] text-muted">
                    {files.length}/5 files (25 MB max each)
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
                    accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.ppt,.pptx,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Upload size={20} className="mx-auto text-muted group-hover:text-accent transition-colors" />
                  <p className="text-xs text-primary mt-1.5 font-medium">
                    Click to select files from your device
                  </p>
                  <p className="text-[11px] text-muted mt-0.5">
                    PDF, PNG, JPG, DOCX, PPTX (No executable files)
                  </p>
                </div>

                {/* Uploaded File Chips */}
                {files.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    {files.map((file, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 rounded-lg bg-surface border border-border text-xs"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <FileText size={14} className="text-accent shrink-0" />
                          <span className="truncate text-primary">{file.name}</span>
                          <span className="text-[11px] text-muted shrink-0">
                            ({(file.size / 1024 / 1024).toFixed(1)} MB)
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveFile(idx)}
                          className="text-muted hover:text-accent p-1 transition-colors cursor-pointer"
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
                      placeholder="+ Add custom tag (e.g. #physics, #shortcuts) — Enter"
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
                      <span className="text-xs font-bold text-primary">Post publicly</span>
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
                      <span className="text-xs font-bold text-primary">Post anonymously</span>
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

              {/* Below that: Publish Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handlePublish}
                  disabled={isSubmitting || !title.trim() || !description.trim() || !consentAcademic}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm bg-accent hover:opacity-90 disabled:bg-surface-muted disabled:text-muted disabled:cursor-not-allowed text-on-accent shadow-xs transition-all active:scale-[0.99] cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Publishing to Commons...</span>
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
