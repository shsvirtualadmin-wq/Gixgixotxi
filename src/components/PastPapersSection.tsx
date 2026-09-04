import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FileText,
  UploadCloud,
  Loader2,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  FileCode,
  Image as ImageIcon,
  FolderOpen,
  Calendar,
  Search,
  Trash2,
  Tag,
  Shield,
  Download,
  Lock,
  X,
} from 'lucide-react';
import { StudentProfile, User, safeJsonResponse, evaluateStudentAccess } from '../lib/supabase';
import { validatePdfFile } from '../lib/pdfValidator';

export interface DriveFileItem {
  id: string;
  name: string;
  webViewLink: string;
  webContentLink?: string;
  createdTime?: string;
  mimeType?: string;
  size?: number | string;
  category?: string;
  source?: string;
}

import { getStudentAllowedClasses } from './ResourcesHub';

export interface PastPapersSectionProps {
  isAdmin?: boolean;
  userProfile?: StudentProfile | null;
  currentUser?: User | null;
  onUpgradeClick?: () => void;
}

export const PastPapersSection: React.FC<PastPapersSectionProps> = ({
  isAdmin = false,
  userProfile,
  currentUser,
  onUpgradeClick,
}) => {
  const isPro = isAdmin || userProfile?.plan_tier === 'pro' || (userProfile ? evaluateStudentAccess(userProfile).isPro : false);
  const [files, setFiles] = useState<DriveFileItem[]>([]);
  const [isLoadingList, setIsLoadingList] = useState<boolean>(true);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  // Custom Delete Confirmation Modal State
  const [fileToDelete, setFileToDelete] = useState<DriveFileItem | null>(null);
  const [isDeletingFile, setIsDeletingFile] = useState<boolean>(false);
  const [deleteFileError, setDeleteFileError] = useState<string | null>(null);
  
  // Student class authorization
  const allowedClasses = React.useMemo(() => {
    return getStudentAllowedClasses(userProfile, isAdmin);
  }, [userProfile, isAdmin]);

  const categories = React.useMemo(() => {
    if (isAdmin) {
      return ['All', 'Class 9', 'Class 10', 'Class 11', 'Class 12', 'MDCAT', 'TCAT', 'General'];
    }
    if (allowedClasses.length > 1) {
      return ['All My Classes', ...allowedClasses, 'General'];
    }
    return allowedClasses.length > 0 ? [...allowedClasses, 'General'] : ['Class 11', 'General'];
  }, [isAdmin, allowedClasses]);

  // Form fields
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentTitle, setDocumentTitle] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('General');
  
  // Filter & Search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>(() => {
    if (isAdmin) return 'All';
    if (allowedClasses.length > 1) return 'All My Classes';
    return allowedClasses[0] || 'Class 9';
  });

  useEffect(() => {
    if (!categories.includes(activeCategoryFilter)) {
      setActiveCategoryFilter(categories[0] || 'Class 9');
    }
  }, [categories, activeCategoryFilter]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchDriveFiles = async () => {
    setIsLoadingList(true);
    setErrorMessage('');
    try {
      const params = new URLSearchParams();
      if (currentUser?.email || userProfile?.email) {
        params.set('studentEmail', (currentUser?.email || userProfile?.email)!);
      }
      if (userProfile?.grade) params.set('grade', userProfile.grade);
      if (userProfile?.stream) params.set('stream', userProfile.stream);

      const res = await fetch(`/api/drive-list?${params.toString()}`);
      const data = await safeJsonResponse(res);
      if (!res.ok) {
        throw new Error(data?.error || `Failed to fetch files (Status ${res.status})`);
      }
      if (Array.isArray(data)) {
        setFiles(data);
      } else if (data?.files && Array.isArray(data.files)) {
        setFiles(data.files);
      } else if (data?.error) {
        throw new Error(data.error);
      } else {
        setFiles([]);
      }
    } catch (err: any) {
      console.error("Error loading Drive files:", err);
      setErrorMessage(err.message || "Unable to load past papers list.");
    } finally {
      setIsLoadingList(false);
    }
  };

  useEffect(() => {
    fetchDriveFiles();
  }, [userProfile?.grade, userProfile?.stream, userProfile?.assigned_classes]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage('');
    setSuccessMessage('');
    const file = e.target.files?.[0];
    if (!file) {
      setSelectedFile(null);
      return;
    }

    // Client-side Validation: Size Max 15MB
    const MAX_SIZE = 15 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
      setErrorMessage(`File size is too large (${sizeMB}MB). Maximum allowed limit is 15MB.`);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Client-side Validation: File Extension / Mime (PDF and Images Only)
    const allowedMimePrefixes = ['image/'];
    const allowedMimes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
    const ext = file.name.split('.').pop()?.toLowerCase();
    const isAllowedExt = ['pdf', 'jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext || '');
    const isAllowedMime = allowedMimes.includes(file.type) || allowedMimePrefixes.some(p => file.type.startsWith(p));

    if (!isAllowedExt && !isAllowedMime) {
      setErrorMessage("Invalid file type. Only PDF documents and image files (JPG, PNG, WEBP, GIF) are allowed.");
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setSelectedFile(file);
    if (!documentTitle) {
      setDocumentTitle(file.name.replace(/\.[^/.]+$/, ""));
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      setErrorMessage("Unauthorized: Only administrators are permitted to upload study resources.");
      return;
    }

    if (!selectedFile) {
      setErrorMessage("Please select a file to upload.");
      return;
    }

    setIsUploading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      // Validate PDF structure and magic bytes client-side before sending
      const ext = selectedFile.name.split('.').pop()?.toLowerCase();
      if (ext === 'pdf' || selectedFile.type === 'application/pdf') {
        const validation = await validatePdfFile(selectedFile);
        if (!validation.isValid) {
          throw new Error('Upload failed — file appears corrupted, please try again');
        }
      }

      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('title', documentTitle.trim() || selectedFile.name);
      formData.append('category', selectedCategory);
      if (currentUser?.email) {
        formData.append('adminEmail', currentUser.email);
      }

      const res = await fetch('/api/drive-upload', {
        method: 'POST',
        headers: {
          'X-Admin-Email': currentUser?.email || 'shsvirtualadmin@gmail.com',
        },
        body: formData,
      });

      const data = await safeJsonResponse(res);

      if (!res.ok || !data?.success) {
        throw new Error(data?.error || `Upload failed with status ${res.status}`);
      }

      setSuccessMessage(`Successfully published resource "${data.name || selectedFile.name}"!`);
      setSelectedFile(null);
      setDocumentTitle('');
      if (fileInputRef.current) fileInputRef.current.value = '';

      // Refresh file list
      await fetchDriveFiles();
    } catch (err: any) {
      console.error("Upload error:", err);
      setErrorMessage(err.message || "Failed to upload past paper document.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleOpenDeleteModal = (file: DriveFileItem) => {
    if (!isAdmin) return;
    setFileToDelete(file);
    setDeleteFileError(null);
  };

  const handleConfirmDelete = async () => {
    if (!fileToDelete || !isAdmin) return;

    const fileId = fileToDelete.id;
    const fileName = fileToDelete.name;

    setIsDeletingFile(true);
    setDeleteFileError(null);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const res = await fetch(`/api/drive-delete/${encodeURIComponent(fileId)}`, {
        method: 'DELETE',
        headers: {
          'X-Admin-Email': currentUser?.email || 'shsvirtualadmin@gmail.com',
        },
      });

      const data = await safeJsonResponse(res);
      if (!res.ok || !data?.success) {
        throw new Error(data?.error || "Failed to delete file.");
      }

      // Immediately remove from UI state without needing page refresh
      setFiles(prev => prev.filter(f => f.id !== fileId));
      setSuccessMessage(`Removed "${fileName}" successfully.`);
      setFileToDelete(null);
      
      // Also refresh background listing
      fetchDriveFiles();
    } catch (err: any) {
      setDeleteFileError(err.message || "Error removing past paper.");
    } finally {
      setIsDeletingFile(false);
    }
  };

  const getFileIcon = (name: string, mimeType?: string) => {
    const ext = name.split('.').pop()?.toLowerCase();
    if (ext === 'pdf' || mimeType?.includes('pdf')) {
      return <FileText className="w-5 h-5 text-rose-500" />;
    }
    if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext || '') || mimeType?.startsWith('image/')) {
      return <ImageIcon className="w-5 h-5 text-sky-500" />;
    }
    return <FileCode className="w-5 h-5 text-emerald-500" />;
  };

  const formatDate = (isoStr?: string) => {
    if (!isoStr) return '';
    try {
      const date = new Date(isoStr);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return '';
    }
  };

  // Filter logic
  const filteredFiles = files.filter(f => {
    // 1. Authorization check for non-admins
    if (!isAdmin && allowedClasses && allowedClasses.length > 0) {
      const fCat = (f.category || '').toLowerCase();
      const fName = (f.name || '').toLowerCase();
      const isGeneral = fCat === 'general' || fCat === 'all' || (!fCat && !fName.includes('class') && !fName.includes('mdcat') && !fName.includes('tcat'));
      
      if (!isGeneral) {
        const matchesAnyAllowed = allowedClasses.some(ac => {
          const normAc = ac.toLowerCase().replace(/\s+/g, '');
          const normCat = fCat.replace(/\s+/g, '');
          const normName = fName.replace(/\s+/g, '');
          return normCat.includes(normAc) || normName.includes(normAc);
        });
        if (!matchesAnyAllowed) return false;
      }
    }

    // 2. Search query check
    const matchesSearch = !searchQuery || 
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (f.category && f.category.toLowerCase().includes(searchQuery.toLowerCase()));

    // 3. Tab filter check
    let matchesCategory = true;
    if (activeCategoryFilter !== 'All' && activeCategoryFilter !== 'All My Classes') {
      matchesCategory = f.category === activeCategoryFilter || 
        f.name.toLowerCase().includes(activeCategoryFilter.toLowerCase());
    }

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="bg-white  border border-black/10  rounded-3xl p-6 sm:p-7 shadow-xl space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200 ">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10  text-rose-600  border border-rose-500/20 flex items-center justify-center shrink-0">
            <FolderOpen className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900  font-['Space_Grotesk'] tracking-tight">
                Past Papers & Study Resources
              </h2>
              {isAdmin && (
                <span className="bg-rose-100  text-rose-700  border border-rose-300  text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Shield className="w-3 h-3" /> Admin Portal
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500  mt-0.5">
              {isAdmin
                ? "Manage official FBISE past papers, MDCAT/TCAT entry test documents, and study resources for students."
                : "Official FBISE board past papers, MDCAT & TCAT preparation resources, and model test documents."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isAdmin && (
            <button
              type="button"
              id="past-papers-upload-btn"
              onClick={() => {
                setErrorMessage('');
                setSuccessMessage('');
                setShowUploadModal(true);
              }}
              className="self-start sm:self-auto px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Upload Past Paper</span>
            </button>
          )}

          <button
            type="button"
            onClick={fetchDriveFiles}
            disabled={isLoadingList}
            className="self-start sm:self-auto px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingList ? 'animate-spin text-rose-500' : ''}`} />
            <span>Refresh Files</span>
          </button>
        </div>
      </div>

      {/* Admin Upload Popup Modal (Instant centered overlay, zero page reflow) */}
      {isAdmin && showUploadModal && (
        <div
          id="past-paper-upload-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="past-paper-upload-modal-title"
          className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
          onClick={() => {
            if (!isUploading) {
              setShowUploadModal(false);
            }
          }}
        >
          <div
            id="past-paper-upload-modal"
            onClick={e => e.stopPropagation()}
            className="bg-[#0d1b3e] border border-[#1e3a8a] rounded-2xl sm:rounded-3xl max-w-lg w-full max-w-[95vw] sm:max-w-lg p-5 sm:p-6 shadow-2xl space-y-4 text-white relative overflow-hidden box-border my-auto"
          >
            <div className="flex items-center justify-between gap-3 border-b border-[#1e3a8a]/40 pb-3">
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className="w-9 h-9 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 id="past-paper-upload-modal-title" className="font-['Space_Grotesk'] font-bold text-base text-white truncate">
                    Upload Past Paper Document
                  </h3>
                  <p className="text-[11px] text-[#94a3b8] truncate">
                    Admin Past Paper Portal
                  </p>
                </div>
              </div>

              <button
                type="button"
                id="close-past-paper-upload-modal-btn"
                disabled={isUploading}
                onClick={() => setShowUploadModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors cursor-pointer disabled:opacity-40 shrink-0"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpload} className="space-y-3.5 pt-0.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1 sm:col-span-2">
                  <label className="block text-xs font-bold text-[#94a3b8]">
                    Document Title / Description <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Class 11 Physics 2024 FBISE Past Paper"
                    value={documentTitle}
                    onChange={(e) => setDocumentTitle(e.target.value)}
                    className="w-full bg-[#081028] border border-[#1e3a8a] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500 transition-colors"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="block text-xs font-bold text-[#94a3b8]">
                    Target Category / Track
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full bg-[#081028] border border-[#1e3a8a] rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500 cursor-pointer"
                  >
                    <option value="General">General / All Students</option>
                    <option value="Class 9">Class 9 (FBISE)</option>
                    <option value="Class 10">Class 10 (FBISE)</option>
                    <option value="Class 11">Class 11 (Pre-Med / Pre-Eng / CS)</option>
                    <option value="Class 12">Class 12 (Pre-Med / Pre-Eng / CS)</option>
                    <option value="MDCAT">MDCAT Medical Prep</option>
                    <option value="TCAT">TCAT Engineering Prep</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="past-paper-file-input" className="block text-xs font-bold text-[#94a3b8]">
                  Attach File <span className="text-rose-400">*</span>
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,image/png,image/jpeg,image/jpg,image/webp,image/gif"
                  onChange={handleFileChange}
                  className="hidden"
                  id="past-paper-file-input"
                />
                
                <label
                  htmlFor="past-paper-file-input"
                  className="block w-full border-2 border-dashed border-[#1e3a8a] hover:border-rose-500 rounded-xl p-4 text-center cursor-pointer bg-[#081028] transition-colors text-xs font-semibold text-slate-300 truncate"
                >
                  {selectedFile ? (
                    <span className="text-rose-400 font-bold truncate block">
                      Selected: {selectedFile.name} ({(selectedFile.size / (1024 * 1024)).toFixed(2)}MB)
                    </span>
                  ) : (
                    <span className="text-slate-400">
                      Click to attach file <span className="text-rose-400 font-bold">(PDF or Image, max 15MB)</span>
                    </span>
                  )}
                </label>
              </div>

              {errorMessage && (
                <div className="bg-rose-500/15 border border-rose-500/30 text-rose-300 rounded-xl p-3 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span className="font-semibold">{errorMessage}</span>
                </div>
              )}

              {successMessage && (
                <div className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 rounded-xl p-3 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="font-semibold">{successMessage}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#1e3a8a]/40">
                <button
                  type="button"
                  disabled={isUploading}
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#131f42] hover:bg-[#1e3a8a]/50 text-slate-300 border border-[#1e3a8a]/50 transition-all cursor-pointer disabled:opacity-40"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isUploading || !selectedFile}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shrink-0"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Uploading Resource...</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-4 h-4" />
                      <span>Upload Resource</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Filter and Search Bar for All Users */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search past papers by title, subject, or year..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50  border border-slate-200  rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900  focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  activeCategoryFilter === cat
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'bg-slate-100  text-slate-600  hover:text-slate-900 '
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Files List Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="font-['Space_Grotesk'] text-sm font-bold text-slate-900  flex items-center gap-2">
              <FileText className="w-4 h-4 text-rose-500" />
              <span>Available Papers & Resources ({filteredFiles.length})</span>
            </h3>
          </div>

          {isLoadingList ? null : filteredFiles.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredFiles.map((file, idx) => {
                const isCuratedSample = idx < 2 || file.name.toLowerCase().includes('sample') || file.name.toLowerCase().includes('demo');
                const isLockedForFree = !isPro && !isCuratedSample;

                return (
                  <div
                    key={file.id}
                    className="bg-slate-50  border border-slate-200  hover:border-rose-400  rounded-2xl p-4 flex items-center justify-between gap-3 group transition-all shadow-sm hover:shadow-md"
                  >
                    <div className="flex items-center gap-3 overflow-hidden flex-1">
                      <div className="p-2.5 bg-white  border border-slate-200  rounded-xl shrink-0 group-hover:scale-105 transition-transform">
                        {getFileIcon(file.name, file.mimeType)}
                      </div>
                      <div className="overflow-hidden space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs sm:text-sm font-bold text-slate-900  group-hover:text-rose-600  transition-colors truncate">
                            {file.name}
                          </h4>
                          {isLockedForFree && (
                            <span className="px-2 py-0.5 bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[10px] font-bold rounded-full shrink-0 flex items-center gap-1">
                              <Lock className="w-2.5 h-2.5" /> Pro Only
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap text-[10px] text-slate-500 ">
                          {file.category && file.category !== 'General' && (
                            <span className="bg-rose-500/10 text-rose-600  font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                              <Tag className="w-2.5 h-2.5" /> {file.category}
                            </span>
                          )}
                          {file.createdTime && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-slate-400" />
                              {formatDate(file.createdTime)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {/* View / Download Button */}
                      {isLockedForFree ? (
                        <button
                          type="button"
                          onClick={() => {
                            if (onUpgradeClick) {
                              onUpgradeClick();
                            } else {
                              alert("The full 100+ solved past papers archive requires Pro Plan — Upgrade to unlock.");
                            }
                          }}
                          className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                          title="Requires Pro Plan — Upgrade to unlock"
                        >
                          <Lock className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Unlock</span>
                        </button>
                      ) : (
                        <a
                          href={file.webViewLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
                          title="View / Download File"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">View</span>
                        </a>
                      )}

                    {/* Admin Delete Action */}
                    {isAdmin && (
                      <button
                        type="button"
                        id={`delete-past-paper-btn-${file.id}`}
                        onClick={() => handleOpenDeleteModal(file)}
                        className="p-1.5 text-slate-400 hover:text-rose-600  hover:bg-rose-500/10 rounded-lg transition-all cursor-pointer"
                        title="Delete document (Admin)"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
            </div>
          ) : (
            <div className="bg-slate-50  border border-slate-200  rounded-2xl p-8 text-center space-y-2">
              <FolderOpen className="w-10 h-10 text-slate-400 mx-auto opacity-50" />
              <p className="text-xs font-bold text-slate-700 ">
                {searchQuery || activeCategoryFilter !== 'All'
                  ? "No matching past papers found"
                  : "No study resources available yet"}
              </p>
              <p className="text-[11px] text-slate-500  max-w-sm mx-auto">
                {isAdmin
                  ? "Use the admin upload box above to upload past papers or study resources for students."
                  : "Your course instructor or administrator will upload official FBISE past papers and study guides here shortly."}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* CUSTOM STYLED DARK DELETE CONFIRMATION MODAL */}
      <AnimatePresence>
        {fileToDelete && (
          <div
            id="delete-past-paper-modal-overlay"
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fadeIn overflow-y-auto"
            onClick={() => {
              if (!isDeletingFile) {
                setFileToDelete(null);
                setDeleteFileError(null);
              }
            }}
          >
            <motion.div
              id="delete-past-paper-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="delete-past-paper-modal-title"
              initial={{ opacity: 0, scale: 0.94, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 12 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              onClick={e => e.stopPropagation()}
              className="bg-[#0d1b3e] border border-[#1e3a8a] rounded-2xl sm:rounded-3xl max-w-md w-full max-w-[95vw] sm:max-w-md p-5 sm:p-6 shadow-2xl space-y-4 text-white relative overflow-hidden box-border my-auto"
            >
              {/* Top destructive accent bar */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-rose-600 via-rose-500 to-rose-600" />

              {/* Modal Header */}
              <div className="flex items-start justify-between gap-2 pt-1 border-b border-[#1e3a8a]/40 pb-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                    <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 id="delete-past-paper-modal-title" className="font-['Space_Grotesk'] font-bold text-base sm:text-lg text-white truncate">
                      Delete Resource
                    </h3>
                    <p className="text-[11px] text-[#94a3b8] truncate">
                      Admin Past Paper Archive
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  id="close-delete-past-paper-modal-btn"
                  disabled={isDeletingFile}
                  onClick={() => {
                    setFileToDelete(null);
                    setDeleteFileError(null);
                  }}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors cursor-pointer disabled:opacity-40 shrink-0"
                  aria-label="Close modal"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="space-y-3.5 pt-0.5">
                <p className="text-xs sm:text-sm font-semibold text-slate-200 leading-relaxed">
                  Are you sure you want to delete this resource?
                </p>

                {/* Resource Summary Card */}
                <div className="bg-[#081028] border border-[#1e3a8a]/60 rounded-xl p-3.5 space-y-2">
                  <div className="flex items-start gap-2.5">
                    <div className="p-2 rounded-lg bg-[#1a6dff]/15 text-[#1a6dff] border border-[#1a6dff]/25 shrink-0 mt-0.5">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-['Space_Grotesk'] font-bold text-xs sm:text-sm text-white line-clamp-2 leading-snug">
                        {fileToDelete.name}
                      </h4>
                      {fileToDelete.category && (
                        <div className="pt-1.5 text-[10px] text-[#94a3b8]">
                          <span className="bg-[#0d1b3e] px-2 py-0.5 rounded border border-[#1e3a8a]/40 font-semibold text-slate-300">
                            {fileToDelete.category}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-2.5 text-xs text-rose-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>This action cannot be undone and will permanently remove this document.</span>
                </div>

                {deleteFileError && (
                  <div className="bg-rose-500/15 border border-rose-500/30 text-rose-300 rounded-xl p-3 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                    <span>{deleteFileError}</span>
                  </div>
                )}
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#1e3a8a]/40">
                <button
                  type="button"
                  id="cancel-delete-past-paper-btn"
                  disabled={isDeletingFile}
                  onClick={() => {
                    setFileToDelete(null);
                    setDeleteFileError(null);
                  }}
                  className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-[#131f42] hover:bg-[#1e3a8a]/50 text-slate-300 border border-[#1e3a8a]/50 transition-all cursor-pointer disabled:opacity-40 active:scale-95"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  id="confirm-delete-past-paper-btn"
                  disabled={isDeletingFile}
                  onClick={handleConfirmDelete}
                  className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold bg-rose-600 hover:bg-rose-700 text-white transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-rose-900/30 active:scale-95 disabled:opacity-50"
                >
                  {isDeletingFile ? (
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
    </div>
  );
};
