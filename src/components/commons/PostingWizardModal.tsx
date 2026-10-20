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
  Filter,
  MessageSquare,
} from 'lucide-react';
import { COMMONS_POST_TYPES, type CommonsPostType, type CommonsFileAttachment } from '@/types/commons';
import { SYLLABUS_MAP, COMMONS_TARGET_OPTIONS, getAllChaptersForSubject } from '@/constants/syllabusMap';
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
}

export function PostingWizardModal({
  isOpen,
  onClose,
  onPostCreated,
  currentUser,
}: PostingWizardModalProps) {
  // Step 1: Material Type selection
  // Step 2: Title, Description, Uploads, Tags with [Filter] option, Consent & Publish
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);

  // Form State
  const [selectedType, setSelectedType] = useState<CommonsPostType>('notes');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState<CommonsFileAttachment[]>([]);

  // Filter option state (inside tags area)
  const [filterOpen, setFilterOpen] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState<string>('mathematics');
  const [selectedChapter, setSelectedChapter] = useState<string>('Differentiation & Derivatives');
  const [selectedTarget, setSelectedTarget] = useState<string>('FAST-NUCES');

  // Custom Tags
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  // Consent & Identity Checkboxes
  const [consentAcademic, setConsentAcademic] = useState(true);
  const [isAnonymous, setIsAnonymous] = useState<boolean>(false);

  // Status & Error
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const availableChapters = getAllChaptersForSubject(selectedSubject);

  const handleSubjectChange = (newSub: string) => {
    setSelectedSubject(newSub);
    const firstCh = getAllChaptersForSubject(newSub)[0];
    if (firstCh) setSelectedChapter(firstCh.name);
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
        subject: selectedSubject,
        chapter: selectedChapter,
        target: selectedTarget,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-[#0c0c0e] border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800 bg-[#111114]">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse" />
            <h2 className="text-sm sm:text-base font-extrabold font-mono tracking-tight text-neutral-100">
              SHARE STUDY RESOURCE
            </h2>
            <span className="text-[11px] font-mono text-neutral-400 bg-neutral-900 border border-neutral-800 px-2 py-0.5 rounded-full">
              Step {currentStep} of 2
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Step Indicator Bar */}
        <div className="h-1 w-full bg-neutral-900">
          <div
            className="h-full bg-red-600 transition-all duration-300"
            style={{ width: currentStep === 1 ? '50%' : '100%' }}
          />
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 max-h-[80vh] overflow-y-auto space-y-5">
          {errorMsg && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-red-950/40 border border-red-800/80 text-red-200 text-xs">
              <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              STEP 1: ASK ONLY FOR THE TYPE OF MATERIAL BEING SHARED
             ══════════════════════════════════════════════════════════════════ */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-neutral-100 font-mono">
                  What type of material are you sharing?
                </h3>
                <p className="text-xs text-neutral-400 mt-1">
                  Select the category that best describes your study contribution:
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                {COMMONS_POST_TYPES.map((typeMeta) => {
                  const isSelected = selectedType === typeMeta.type;
                  return (
                    <button
                      key={typeMeta.type}
                      type="button"
                      onClick={() => setSelectedType(typeMeta.type)}
                      className={`flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'border-red-600 bg-red-950/20 shadow-md shadow-red-950/30'
                          : 'border-neutral-800/90 bg-neutral-900/50 hover:border-neutral-700 hover:bg-neutral-900'
                      }`}
                    >
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                          isSelected ? 'bg-red-600 text-white' : 'bg-neutral-800 text-neutral-400'
                        }`}
                      >
                        <FileText size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span
                            className={`text-xs font-bold font-mono uppercase tracking-wide ${
                              isSelected ? 'text-red-400' : 'text-neutral-200'
                            }`}
                          >
                            {typeMeta.label}
                          </span>
                          {isSelected && <CheckCircle2 size={15} className="text-red-500" />}
                        </div>
                        <p className="text-[11px] text-neutral-400 mt-0.5 leading-relaxed">
                          {typeMeta.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Step 1 Footer Action */}
              <div className="pt-3 border-t border-neutral-800/80 flex justify-end">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs font-mono tracking-wide shadow-lg shadow-red-950/40 transition-all hover:scale-[1.02] active:scale-[0.98]"
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
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-neutral-900/60 border border-neutral-800">
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-neutral-400">Material Type:</span>
                  <span className="font-mono font-bold uppercase text-red-400 bg-red-950/60 px-2 py-0.5 rounded border border-red-800/60">
                    {selectedType.replace('_', ' ')}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="text-xs text-neutral-400 hover:text-white flex items-center gap-1 font-mono transition-colors"
                >
                  <ChevronLeft size={14} />
                  <span>Change type</span>
                </button>
              </div>

              {/* 1. Title Input */}
              <div className="space-y-1">
                <label className="text-xs font-mono uppercase tracking-wider text-neutral-300 font-semibold">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Complete Differentiation & Limits Handwritten Notes"
                  className="w-full text-xs sm:text-sm bg-[#09090b] border border-neutral-800 rounded-xl p-3 text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-red-600 transition-colors"
                />
              </div>

              {/* 2. Description Input */}
              <div className="space-y-1">
                <label className="text-xs font-mono uppercase tracking-wider text-neutral-300 font-semibold">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Summarize key topics covered, exam relevance, shortcut tricks..."
                  className="w-full text-xs sm:text-sm bg-[#09090b] border border-neutral-800 rounded-xl p-3 text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-red-600 transition-colors resize-none"
                />
              </div>

              {/* 3. Attachments */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-mono uppercase tracking-wider text-neutral-300 font-semibold">
                    Attach Files (PDF, Images, Docs)
                  </label>
                  <span className="text-[11px] text-neutral-400 font-mono">
                    {files.length}/5 files (25 MB max each)
                  </span>
                </div>

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-neutral-800 hover:border-neutral-700 bg-[#09090b]/80 rounded-xl p-4 text-center cursor-pointer transition-colors group"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.ppt,.pptx,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Upload size={20} className="mx-auto text-neutral-500 group-hover:text-red-500 transition-colors" />
                  <p className="text-xs text-neutral-300 mt-1.5 font-medium">
                    Click to select files from your device
                  </p>
                  <p className="text-[11px] text-neutral-500 mt-0.5">
                    PDF, PNG, JPG, DOCX, PPTX (No executable files)
                  </p>
                </div>

                {/* Uploaded File Chips */}
                {files.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    {files.map((file, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 rounded-lg bg-neutral-900 border border-neutral-800 text-xs"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <FileText size={14} className="text-red-400 shrink-0" />
                          <span className="truncate text-neutral-200">{file.name}</span>
                          <span className="text-[11px] text-neutral-500 shrink-0">
                            ({(file.size / 1024 / 1024).toFixed(1)} MB)
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveFile(idx)}
                          className="text-neutral-500 hover:text-red-400 p-1 transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 4. TAGS & [FILTER] OPTION IN THE SAME PLACE */}
              <div className="space-y-2 pt-1 border-t border-neutral-800/80">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-mono uppercase tracking-wider text-neutral-300 font-semibold flex items-center gap-2">
                    <span>Tags &amp; Classification</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setFilterOpen(!filterOpen)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg border font-mono transition-colors ${
                      filterOpen
                        ? 'bg-red-950/50 border-red-600 text-red-300'
                        : 'bg-neutral-900 border-neutral-700 hover:border-neutral-500 text-neutral-300'
                    }`}
                  >
                    <Filter size={13} className="text-red-500" />
                    <span>[Filter]</span>
                    <span className="text-[10px] text-neutral-500">{filterOpen ? '▲' : '▼'}</span>
                  </button>
                </div>

                {/* The [Filter] option right here in the tags area */}
                {filterOpen && (
                  <div className="p-3 rounded-xl border border-neutral-800 bg-[#0d0d10] space-y-2.5 animate-in fade-in duration-100">
                    <div className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                      <span>Syllabus Filter Options</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {/* Subject */}
                      <div>
                        <label className="text-[11px] text-neutral-400 block mb-1">Subject</label>
                        <select
                          value={selectedSubject}
                          onChange={(e) => handleSubjectChange(e.target.value)}
                          className="w-full text-xs bg-neutral-900 border border-neutral-700 rounded-lg p-2 text-neutral-200 focus:outline-none focus:border-red-600"
                        >
                          {SYLLABUS_MAP.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Chapter */}
                      <div>
                        <label className="text-[11px] text-neutral-400 block mb-1">Chapter</label>
                        <select
                          value={selectedChapter}
                          onChange={(e) => setSelectedChapter(e.target.value)}
                          className="w-full text-xs bg-neutral-900 border border-neutral-700 rounded-lg p-2 text-neutral-200 focus:outline-none focus:border-red-600"
                        >
                          {availableChapters.map((ch) => (
                            <option key={ch.id} value={ch.name}>
                              {ch.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Target */}
                      <div>
                        <label className="text-[11px] text-neutral-400 block mb-1">Target Exam / Class</label>
                        <select
                          value={selectedTarget}
                          onChange={(e) => setSelectedTarget(e.target.value)}
                          className="w-full text-xs bg-neutral-900 border border-neutral-700 rounded-lg p-2 text-neutral-200 focus:outline-none focus:border-red-600"
                        >
                          {COMMONS_TARGET_OPTIONS.map((opt) => (
                            <option key={opt.id} value={opt.id}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Filter & Custom Tags unified badge display */}
                <div className="flex flex-wrap items-center gap-1.5 p-2.5 rounded-xl border border-neutral-800 bg-[#09090b] min-h-[46px]">
                  {/* Selected Filter Badges */}
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono bg-red-950/60 border border-red-800/70 text-red-300">
                    <span className="text-red-500 font-bold">Subject:</span>
                    <span className="capitalize">{selectedSubject}</span>
                  </span>

                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono bg-neutral-800/80 border border-neutral-700 text-neutral-300 max-w-[170px] truncate">
                    <span className="text-neutral-500 font-bold">Ch:</span>
                    <span className="truncate">{selectedChapter}</span>
                  </span>

                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono bg-neutral-800/80 border border-neutral-700 text-neutral-300">
                    <span className="text-neutral-500 font-bold">Target:</span>
                    <span>{selectedTarget}</span>
                  </span>

                  {/* Custom hashtag tags */}
                  {tags.map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono bg-neutral-900 border border-neutral-700 text-neutral-200"
                    >
                      <span>#{t}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(t)}
                        className="text-neutral-400 hover:text-red-400 ml-0.5"
                      >
                        ×
                      </button>
                    </span>
                  ))}

                  {/* Input for custom tag */}
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
                      placeholder="+ Add custom tag (Enter)"
                      className="w-full text-xs bg-transparent text-neutral-200 placeholder-neutral-500 focus:outline-none px-1"
                    />
                    {tagInput.trim() && (
                      <button
                        type="button"
                        onClick={handleAddTag}
                        className="text-[10px] font-mono text-red-400 px-1.5 py-0.5 rounded bg-neutral-800 shrink-0"
                      >
                        Add
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* ══════════════════════════════════════════════════════════════════
                  BELOW THAT: CONSENT CHECKBOX(ES), THEN THE PUBLISH BUTTON
                 ══════════════════════════════════════════════════════════════════ */}
              <div className="space-y-2.5 pt-3 border-t border-neutral-800/80">
                {/* Consent Checkbox 1: Academic & Guidelines */}
                <label className="flex items-start gap-2.5 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={consentAcademic}
                    onChange={(e) => setConsentAcademic(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-neutral-700 bg-neutral-900 text-red-600 focus:ring-red-500 focus:ring-offset-0 cursor-pointer accent-red-600"
                  />
                  <span className="text-xs text-neutral-300 leading-snug">
                    I confirm this material complies with Boardly Community Guidelines, is intended for peer academic learning, and does not contain unauthorized exam leaks.
                  </span>
                </label>

                {/* Consent Checkbox 2: Anonymous posting option */}
                <label className="flex items-start gap-2.5 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-neutral-700 bg-neutral-900 text-red-600 focus:ring-red-500 focus:ring-offset-0 cursor-pointer accent-red-600"
                  />
                  <span className="text-xs text-neutral-300 leading-snug">
                    <span className="font-semibold text-neutral-200">Post anonymously</span> — hide my public name and avatar from classmates (a randomized scholar alias will be shown).
                  </span>
                </label>
              </div>

              {/* Below that: Publish Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handlePublish}
                  disabled={isSubmitting || !title.trim() || !description.trim() || !consentAcademic}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm bg-red-600 hover:bg-red-500 disabled:bg-neutral-800 disabled:text-neutral-500 disabled:cursor-not-allowed text-white shadow-lg shadow-red-950/40 transition-all active:scale-[0.99]"
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
