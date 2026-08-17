import React, { useState, useId } from 'react';
import {
  Upload,
  AlertCircle,
  CheckCircle2,
  FileCheck,
  FileText,
  Loader2,
  X,
} from 'lucide-react';
import { triggerHaptic, HAPTIC_PATTERNS } from '../lib/haptics';
import { ResourceCategory, ResourceItem } from '../types';
import { validatePdfFile } from '../lib/pdfValidator';
import { uploadResourceToHub, User } from '../lib/supabase';

export interface UploadResourceDrawerProps {
  activeCategory: ResourceCategory;
  currentUser?: User | null;
  initialData?: { title?: string; subject?: string; targetClass?: string; errorMsg?: string } | null;
  onClose: () => void;
  onSuccess: (resource: ResourceItem) => void;
}

export const UploadResourceDrawer: React.FC<UploadResourceDrawerProps> = ({
  activeCategory,
  currentUser,
  initialData,
  onClose,
  onSuccess,
}) => {
  const fileInputId = useId();
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState<string>(initialData?.title || '');
  const [uploadSubject, setUploadSubject] = useState<string>(initialData?.subject || 'Physics');
  const [uploadClass, setUploadClass] = useState<string>(initialData?.targetClass || 'Class 11');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string>(initialData?.errorMsg || '');
  const [uploadSuccess, setUploadSuccess] = useState<string>('');

  const handleUploadSubmit = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setUploadError('');
    setUploadSuccess('');

    if (!uploadFile) {
      setUploadError('Please select a PDF document to upload.');
      return;
    }

    if (!uploadTitle.trim()) {
      setUploadError('Please provide a document title.');
      return;
    }

    setIsUploading(true);
    triggerHaptic(HAPTIC_PATTERNS.medium);

    try {
      // 1. Client-Side PDF Integrity & Structure Verification
      const validation = await validatePdfFile(uploadFile);
      if (!validation.isValid) {
        throw new Error(validation.error || 'Upload failed — file appears corrupted, please try again');
      }

      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('title', uploadTitle.trim());
      formData.append('subject', uploadSubject.trim());
      formData.append('class', uploadClass.trim());
      formData.append('category', activeCategory);
      formData.append('requesterEmail', currentUser?.email || 'shsvirtualadmin@gmail.com');

      const result = await uploadResourceToHub(formData);

      if (result.success && result.resource) {
        triggerHaptic(HAPTIC_PATTERNS.success);
        setUploadSuccess('Resource published successfully to R2 bucket & database!');
        onSuccess(result.resource);
        setUploadFile(null);
        setUploadTitle('');
        setTimeout(() => {
          onClose();
          setUploadSuccess('');
        }, 1200);
      } else {
        throw new Error(result.error || 'Failed to publish resource.');
      }
    } catch (err: any) {
      console.error('Upload error:', err);
      setUploadError(err?.message || 'Upload failed — file appears corrupted, please try again');
      triggerHaptic(HAPTIC_PATTERNS.error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div
      id="upload-resource-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="upload-modal-title"
      className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onClick={() => {
        if (!isUploading) {
          onClose();
        }
      }}
    >
      <div
        id="upload-resource-drawer"
        onClick={e => e.stopPropagation()}
        className="bg-[#131f42] border border-[#1e3a8a] rounded-2xl sm:rounded-3xl p-5 sm:p-6 space-y-4 shadow-2xl overflow-hidden w-full max-w-xl max-h-[92vh] overflow-y-auto relative text-white my-auto box-border"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between gap-3 border-b border-[#1e3a8a]/60 pb-3.5">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-8 h-8 rounded-xl bg-[#1a6dff]/15 border border-[#1a6dff]/30 flex items-center justify-center text-[#1a6dff] shrink-0">
              <Upload className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 id="upload-modal-title" className="font-['Space_Grotesk'] font-bold text-sm sm:text-base text-white truncate">
                Publish New {activeCategory === 'past_paper' ? 'Past Paper PDF' : 'MCQs Drill Sheet'}
              </h3>
              <p className="text-[11px] text-[#94a3b8] truncate">
                Target: {activeCategory === 'past_paper' ? 'Past Papers Library' : 'MCQs Practice Drills'}
              </p>
            </div>
          </div>

          <button
            type="button"
            id="close-upload-modal-btn"
            disabled={isUploading}
            onClick={() => onClose()}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-[#0d1b3e] transition-colors cursor-pointer disabled:opacity-40 shrink-0"
            aria-label="Close upload modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {uploadError && (
          <div className="bg-rose-500/15 border border-rose-500/30 text-rose-300 rounded-xl p-3 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{uploadError}</span>
          </div>
        )}

        {uploadSuccess && (
          <div className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 rounded-xl p-3 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{uploadSuccess}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Document Title */}
          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-xs font-bold text-[#94a3b8]">
              Document Title <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={uploadTitle}
              onChange={e => setUploadTitle(e.target.value)}
              placeholder={
                activeCategory === 'past_paper'
                  ? 'e.g. Board Physics Class 11 2024 Solved Past Paper'
                  : 'e.g. Chemical Bonding 100 MCQs Practice Drill Sheet'
              }
              className="w-full bg-[#0d1b3e] border border-[#1e3a8a] focus:border-[#1a6dff] focus:ring-2 focus:ring-[#1a6dff]/30 text-white placeholder-[#94a3b8]/50 text-xs sm:text-sm rounded-xl px-3.5 py-2.5 outline-none transition-all"
            />
          </div>

          {/* Subject Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#94a3b8]">Subject</label>
            <select
              value={uploadSubject}
              onChange={e => setUploadSubject(e.target.value)}
              className="w-full bg-[#0d1b3e] border border-[#1e3a8a] focus:border-[#1a6dff] text-white text-xs sm:text-sm rounded-xl px-3 py-2.5 outline-none cursor-pointer"
            >
              <option value="Physics">Physics</option>
              <option value="Chemistry">Chemistry</option>
              <option value="Biology">Biology</option>
              <option value="Mathematics">Mathematics</option>
              <option value="Computer Science">Computer Science</option>
              <option value="English">English</option>
              <option value="Logical Reasoning">Logical Reasoning</option>
              <option value="General">General / Multi-Subject</option>
            </select>
          </div>

          {/* Target Class Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#94a3b8]">Target Class / Track</label>
            <select
              value={uploadClass}
              onChange={e => setUploadClass(e.target.value)}
              className="w-full bg-[#0d1b3e] border border-[#1e3a8a] focus:border-[#1a6dff] text-white text-xs sm:text-sm rounded-xl px-3 py-2.5 outline-none cursor-pointer"
            >
              <option value="Class 9">Class 9</option>
              <option value="Class 10">Class 10</option>
              <option value="Class 11">Class 11</option>
              <option value="Class 12">Class 12</option>
              <option value="MDCAT">MDCAT</option>
              <option value="TCAT">TCAT</option>
              <option value="All">All Classes / Open</option>
            </select>
          </div>

          {/* PDF File Picker / Dropzone */}
          <div className="space-y-1.5 sm:col-span-2">
            <label htmlFor={fileInputId} className="text-xs font-bold text-[#94a3b8]">
              PDF File <span className="text-rose-400">*</span>
            </label>
            <div
              onDragOver={e => {
                e.preventDefault();
                e.stopPropagation();
                setIsDragging(true);
              }}
              onDragLeave={e => {
                e.preventDefault();
                e.stopPropagation();
                setIsDragging(false);
              }}
              onDrop={e => {
                e.preventDefault();
                e.stopPropagation();
                setIsDragging(false);
                const file = e.dataTransfer.files?.[0];
                if (file) {
                  if (file.type && file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
                    setUploadError('Please select a valid PDF document.');
                    return;
                  }
                  setUploadError('');
                  setUploadFile(file);
                  if (!uploadTitle.trim()) {
                    const rawName = file.name.replace(/\.pdf$/i, '');
                    setUploadTitle(rawName.replace(/[-_]/g, ' '));
                  }
                }
              }}
              className={`relative border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-colors ${
                isDragging
                  ? 'border-[#1a6dff] bg-[#1a6dff]/15 ring-2 ring-[#1a6dff]/40'
                  : 'border-[#1e3a8a] hover:border-[#1a6dff] bg-[#0d1b3e]/60'
              }`}
            >
              <input
                id={fileInputId}
                type="file"
                accept=".pdf,application/pdf"
                onClick={e => e.stopPropagation()}
                onChange={e => {
                  e.preventDefault();
                  e.stopPropagation();
                  const file = e.target.files?.[0];
                  if (file) {
                    if (file.type && file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
                      setUploadError('Please select a valid PDF document.');
                      return;
                    }
                    setUploadError('');
                    setUploadFile(file);
                    if (!uploadTitle.trim()) {
                      const rawName = file.name.replace(/\.pdf$/i, '');
                      setUploadTitle(rawName.replace(/[-_]/g, ' '));
                    }
                  }
                }}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className="flex flex-col items-center justify-center gap-1.5 pointer-events-none">
                {uploadFile ? (
                  <>
                    <FileCheck className="w-8 h-8 text-emerald-400" />
                    <span className="text-xs sm:text-sm font-bold text-white truncate max-w-full px-2 text-center break-all">
                      {uploadFile.name}
                    </span>
                    <span className="text-[11px] text-[#94a3b8]">
                      {(uploadFile.size / (1024 * 1024)).toFixed(2)} MB — Click or drag to replace
                    </span>
                  </>
                ) : (
                  <>
                    <FileText className="w-8 h-8 text-[#1a6dff]" />
                    <span className="text-xs sm:text-sm font-bold text-white">
                      Click to select PDF or drag &amp; drop
                    </span>
                    <span className="text-[11px] text-[#94a3b8]">
                      Supports standard PDF files up to 50MB
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2.5 pt-2 border-t border-[#1e3a8a]/40">
          <button
            type="button"
            onClick={e => {
              e.preventDefault();
              e.stopPropagation();
              onClose();
            }}
            className="px-4 py-2.5 bg-[#0d1b3e] hover:bg-[#1e3a8a]/40 text-[#94a3b8] hover:text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleUploadSubmit}
            disabled={isUploading || !uploadFile}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1a6dff] hover:bg-[#1557cc] disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-all active:scale-95 shadow-md cursor-pointer"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Publishing to R2...</span>
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                <span>Publish to Hub</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
