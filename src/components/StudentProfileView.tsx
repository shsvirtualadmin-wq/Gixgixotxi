import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  StudentProfile,
  User,
  updateStudentPersonalInfo,
  uploadUserAvatar,
} from '../lib/supabase';
import { PRICING_PLANS, normalizePlan, PlanKey } from '../config/pricing';
import { TargetUniversityModal } from './TargetUniversityModal';
import { findUniversity } from '../data/universities';
import {
  User as UserIcon,
  Mail,
  Phone,
  Edit2,
  Lock,
  Award,
  BookOpen,
  GraduationCap,
  Info,
  CheckCircle2,
  X,
  Check,
  Calendar,
  Sparkles,
  LogOut,
  Camera,
  Loader2,
  Home,
  Crown,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';

export interface StudentProfileViewProps {
  user?: User | any;
  profile?: StudentProfile | any;
  onRefreshProfile?: () => void;
  onStartPractice?: () => void;
  onSignOut?: () => void;
  onNavigateHome?: () => void;
  onOpenUpgrade?: (initialPlan?: 'pro' | 'premium') => void;
}

export const StudentProfileView: React.FC<StudentProfileViewProps> = ({
  user: propUser,
  profile: propProfile,
  onRefreshProfile,
  onStartPractice,
  onSignOut,
  onNavigateHome,
  onOpenUpgrade,
}) => {
  const authContext = useAuth();
  const effectiveUser = propUser || authContext.user;
  const effectiveProfile = propProfile || authContext.profile;

  const chosenUniName =
    effectiveProfile?.targetUniversity ||
    effectiveProfile?.targetUniversityId ||
    effectiveProfile?.university ||
    effectiveProfile?.dream_university ||
    effectiveProfile?.target_university ||
    '';
  const resolvedTargetUni = chosenUniName ? findUniversity(chosenUniName) : undefined;
  const displayTargetUni = resolvedTargetUni ? resolvedTargetUni.shortName : (chosenUniName || '');

  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editName, setEditName] = useState<string>(effectiveProfile?.name || effectiveUser?.displayName || '');
  const [editPhone, setEditPhone] = useState<string>(effectiveProfile?.phone || '');
  const [editExam, setEditExam] = useState<string>(effectiveProfile?.targetExam || effectiveProfile?.testTrack || effectiveProfile?.exam || 'MDCAT');
  const [editGrade, setEditGrade] = useState<string>(effectiveProfile?.grade || 'Class 12');
  const [editUniversity, setEditUniversity] = useState<string>(displayTargetUni);
  const [editExamDate, setEditExamDate] = useState<string>(
    effectiveProfile?.examDate || effectiveProfile?.targetExamDate || ''
  );
  const [editSubjects, setEditSubjects] = useState<string>(() => {
    if (Array.isArray(effectiveProfile?.subjects)) return effectiveProfile.subjects.join(', ');
    if (typeof effectiveProfile?.subjects === 'string') return effectiveProfile.subjects;
    if (Array.isArray(effectiveProfile?.weakSubjects)) return effectiveProfile.weakSubjects.join(', ');
    return 'Biology, Chemistry, Physics, English';
  });

  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [toast, setToast] = useState<{ text: string; isError?: boolean } | null>(null);
  const [showUniModal, setShowUniModal] = useState<boolean>(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const planKey: PlanKey = normalizePlan(effectiveProfile?.plan);
  const planConfig = PRICING_PLANS[planKey];

  // Calculate joined date
  const joinedDateString = (() => {
    try {
      const rawDate = effectiveProfile?.createdAt || effectiveUser?.metadata?.creationTime;
      if (!rawDate) return 'October 2026';
      const d = new Date(rawDate);
      return isNaN(d.getTime())
        ? 'October 2026'
        : d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    } catch {
      return 'October 2026';
    }
  })();

  // Calculate expiry date for paid users
  const expiryDateString = (() => {
    try {
      const rawDate =
        effectiveProfile?.accessExpiresDate ||
        effectiveProfile?.pro_expires_at ||
        effectiveProfile?.expiresAt;
      if (rawDate) {
        const d = new Date(rawDate);
        if (!isNaN(d.getTime())) return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      }
      // If active paid but no explicit date, show 30 days from creation
      const created = new Date(effectiveProfile?.createdAt || Date.now());
      created.setDate(created.getDate() + 30);
      return created.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return 'Next Month';
    }
  })();

  // Check if user's subscription has expired
  const isExpired = Boolean(
    effectiveProfile?.status === 'expired' ||
    effectiveProfile?.plan_status === 'expired' ||
    effectiveProfile?.is_expired ||
    (() => {
      const expDate =
        effectiveProfile?.accessExpiresDate ||
        effectiveProfile?.pro_expires_at ||
        effectiveProfile?.expiresAt ||
        effectiveProfile?.access_expires;
      if (!expDate) return false;
      const t = new Date(expDate).getTime();
      return !isNaN(t) && t < Date.now();
    })()
  );

  // Check if upgrade request is currently pending review
  const isPendingReview = Boolean(
    effectiveProfile?.payment_status === 'pending_verification' ||
    effectiveProfile?.payment_status === 'pending' ||
    effectiveProfile?.status === 'pending admin approval' ||
    effectiveProfile?.status === 'pending' ||
    effectiveProfile?.upgrade_pending
  );

  const initialLetter = (effectiveProfile?.name || effectiveUser?.displayName || effectiveUser?.email || 'S')
    .charAt(0)
    .toUpperCase();

  const avatarUrl =
    effectiveProfile?.avatarUrl ||
    effectiveProfile?.photoURL ||
    effectiveUser?.photoURL ||
    effectiveUser?.user_metadata?.avatar_url;

  // Subjects parsed into array of pills
  const subjectsList = (() => {
    if (Array.isArray(effectiveProfile?.subjects) && effectiveProfile.subjects.length > 0) {
      return effectiveProfile.subjects;
    }
    if (typeof effectiveProfile?.subjects === 'string' && effectiveProfile.subjects.trim()) {
      return effectiveProfile.subjects.split(',').map((s: string) => s.trim()).filter(Boolean);
    }
    if (Array.isArray(effectiveProfile?.weakSubjects) && effectiveProfile.weakSubjects.length > 0) {
      return effectiveProfile.weakSubjects;
    }
    // Default by track
    const track = (effectiveProfile?.testTrack || '').toUpperCase();
    if (track.includes('MDCAT')) return ['Biology', 'Chemistry', 'Physics', 'English', 'Logical Reasoning'];
    if (track.includes('ECAT') || track.includes('TCAT')) return ['Mathematics', 'Physics', 'Chemistry', 'English'];
    return ['Biology', 'Chemistry', 'Physics', 'Mathematics', 'English'];
  })();

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];
    if (!validTypes.includes(file.type) && !file.type.startsWith('image/')) {
      setToast({ text: 'Please select a valid image file (JPEG, PNG, WebP).', isError: true });
      setTimeout(() => setToast(null), 4000);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const maxBytes = 5 * 1024 * 1024;
    if (file.size > maxBytes) {
      setToast({ text: 'Image exceeds 5MB limit. Please choose a smaller photo.', isError: true });
      setTimeout(() => setToast(null), 4000);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const res = await uploadUserAvatar(
        effectiveUser?.uid || effectiveUser?.id || 'current_user',
        file,
        effectiveUser?.email || effectiveProfile?.email
      );
      if (res.success) {
        setToast({ text: 'Profile picture updated successfully!' });
        setTimeout(() => setToast(null), 3500);
        onRefreshProfile?.();
        authContext?.refreshProfile?.();
      } else {
        setToast({ text: res.message || 'Failed to upload photo.', isError: true });
        setTimeout(() => setToast(null), 4000);
      }
    } catch (err: any) {
      setToast({ text: err?.message || 'Failed to upload photo.', isError: true });
      setTimeout(() => setToast(null), 4000);
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSaveDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) return;

    setIsSaving(true);
    const parsedSubjects = editSubjects
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    try {
      // 1. Update Firebase doc if authContext is available
      if (authContext?.updateProfileData) {
        await authContext.updateProfileData({
          name: editName.trim(),
          phone: editPhone.trim(),
          testTrack: editExam,
          targetUniversityId: editUniversity,
          targetExamDate: editExamDate,
          weakSubjects: parsedSubjects,
          ...({ grade: editGrade } as any),
        });
      }

      // 2. Also sync to legacy personal info helper
      if (effectiveUser?.id || effectiveUser?.uid) {
        await updateStudentPersonalInfo(
          effectiveUser.id || effectiveUser.uid,
          {
            name: editName.trim(),
            phone: editPhone.trim(),
          },
          effectiveUser.email || effectiveProfile?.email
        );
      }

      setIsEditing(false);
      setToast({ text: 'Personal details saved successfully!' });
      setTimeout(() => setToast(null), 3000);
      onRefreshProfile?.();
      authContext?.refreshProfile?.();
    } catch (err: any) {
      setToast({ text: err?.message || 'Failed to update personal details.', isError: true });
      setTimeout(() => setToast(null), 4000);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6 py-2 px-3 sm:px-4 text-left animate-in fade-in pb-16">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-20 right-4 z-50 px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-bold animate-bounce ${
            toast.isError
              ? 'bg-rose-950 text-white border border-rose-500'
              : 'bg-[#0d1b3e] text-white border border-[#1a6dff]'
          }`}
        >
          {toast.isError ? (
            <Info className="w-4 h-4 text-rose-400" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-[#1a6dff]" />
          )}
          <span>{toast.text}</span>
        </div>
      )}

      {/* ========================================================= */}
      {/* 1. HERO CARD: Gradient Banner + Circular Avatar + Identity */}
      {/* ========================================================= */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
        {/* Gradient Banner with Home & Upgrade Buttons */}
        <div className="h-28 sm:h-36 bg-gradient-to-r from-[#0d1b3e] via-[#102a6b] to-[#1a6dff] p-4 flex items-start justify-between relative">
          {/* Subtle geometric background watermark */}
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

          {/* Home Button */}
          <button
            type="button"
            onClick={onNavigateHome}
            className="relative z-10 p-2 sm:px-3 sm:py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-all flex items-center gap-1.5 text-xs font-bold cursor-pointer active:scale-95 border border-white/15"
            title="Return to Dashboard Home"
          >
            <Home className="w-4 h-4" />
            <span className="hidden sm:inline">Home</span>
          </button>
        </div>

        {/* Avatar overlapping banner + Identity Block */}
        <div className="px-5 sm:px-7 pb-6 relative">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-12 sm:-mt-14 mb-4">
            {/* Avatar with Accent Ring */}
            <div className="relative group shrink-0 inline-block">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                className="hidden"
                onChange={handleAvatarFileChange}
                disabled={isUploadingAvatar}
              />
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-white shadow-xl ring-2 ring-[#1a6dff] bg-[#0d1b3e] text-white flex items-center justify-center overflow-hidden">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={effectiveProfile?.name || 'Profile'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-2xl sm:text-3xl font-black">{initialLetter}</span>
                )}
              </div>

              {/* Camera Upload Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingAvatar}
                className="absolute bottom-0 right-0 p-1.5 bg-[#1a6dff] hover:bg-[#1558d6] text-white rounded-full shadow-md border-2 border-white transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                title="Change Profile Photo"
                aria-label="Change Profile Photo"
              >
                {isUploadingAvatar ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Camera className="w-3 h-3" />
                )}
              </button>
            </div>

            {/* Target Track & Plan Pill Badges */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Target Track Badge (FBISE / MDCAT / TCAT) */}
              <span className="text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-blue-50 text-[#1a6dff] border border-blue-200">
                {effectiveProfile?.testTrack || effectiveProfile?.exam || 'MDCAT'}
              </span>

              {/* Plan Badge (FREE / PRO / PREMIUM, color-coded) */}
              {planKey === 'free' && (
                <span className="text-[11px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                  FREE
                </span>
              )}
              {planKey === 'pro' && (
                <span className="text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-[#1a6dff] text-white shadow-xs">
                  PRO
                </span>
              )}
              {planKey === 'premium' && (
                <span className="text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-xs">
                  PREMIUM
                </span>
              )}
            </div>
          </div>

          {/* Identity Info: Name, Email, Joined Date, Target University */}
          <div className="space-y-2">
            <h2 className="text-xl sm:text-2xl font-black text-[#0d1b3e] tracking-tight">
              {effectiveProfile?.name || effectiveUser?.displayName || 'Student Aspirant'}
            </h2>

            <div className="flex flex-wrap items-center gap-y-1.5 gap-x-4 text-xs text-slate-600 font-medium">
              {/* Email with Ellipsis Truncation - Never overflows card */}
              <div className="flex items-center gap-1.5 min-w-0 max-w-[280px] sm:max-w-md">
                <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{effectiveUser?.email || effectiveProfile?.email}</span>
              </div>

              {/* Joined Month Year */}
              <div className="flex items-center gap-1.5 shrink-0">
                <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>Joined {joinedDateString}</span>
              </div>

              {/* Target University */}
              <div className="flex items-center gap-1.5 shrink-0">
                <GraduationCap className="w-3.5 h-3.5 text-[#1a6dff] shrink-0" />
                <span className="font-semibold text-slate-700">
                  Target: {effectiveProfile?.targetUniversityId?.toUpperCase() || effectiveProfile?.dream_university || 'NUST'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. PERSONAL INFORMATION CARD (Title left, Member since right) */}
      {/* ========================================================= */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-5 sm:p-6 space-y-4">
        {/* Card Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-sm sm:text-base text-[#0d1b3e] uppercase tracking-wider">
              Personal Information
            </h3>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[11px] font-semibold text-slate-400">
              Member since {joinedDateString}
            </span>
            {!isEditing ? (
              <button
                type="button"
                onClick={() => {
                  setEditName(effectiveProfile?.name || effectiveUser?.displayName || '');
                  setEditPhone(effectiveProfile?.phone || '');
                  setEditExam(effectiveProfile?.testTrack || 'MDCAT');
                  setEditGrade(effectiveProfile?.grade || 'Class 12');
                  setEditUniversity(
                    effectiveProfile?.targetUniversityId || effectiveProfile?.dream_university || 'NUST'
                  );
                  setEditExamDate(effectiveProfile?.targetExamDate || 'August 2026');
                  setEditSubjects(subjectsList.join(', '));
                  setIsEditing(true);
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-blue-50 hover:text-[#1a6dff] text-slate-700 font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer border border-slate-200"
              >
                <Edit2 className="w-3 h-3" />
                <span>Edit</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
                title="Cancel"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {!isEditing ? (
          /* READ-ONLY ROWS with thin dividers */
          <div className="divide-y divide-slate-100 text-xs">
            {/* Full Name */}
            <div className="py-2.5 flex items-center justify-between">
              <span className="font-semibold text-slate-500">Full Name</span>
              <span className="font-bold text-[#0d1b3e]">
                {effectiveProfile?.name || effectiveUser?.displayName || 'Not provided'}
              </span>
            </div>

            {/* Email (with Lock indicator) */}
            <div className="py-2.5 flex items-center justify-between">
              <span className="font-semibold text-slate-500">Email</span>
              <div className="flex items-center gap-1.5 text-right font-medium text-slate-700">
                <span className="truncate max-w-[200px] sm:max-w-xs">{effectiveUser?.email || effectiveProfile?.email}</span>
                <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                  <Lock className="w-2.5 h-2.5" /> Locked
                </span>
              </div>
            </div>

            {/* WhatsApp / Phone */}
            <div className="py-2.5 flex items-center justify-between">
              <span className="font-semibold text-slate-500">WhatsApp / Phone</span>
              <span className="font-bold text-[#0d1b3e]">
                {effectiveProfile?.phone || 'Not added'}
              </span>
            </div>

            {/* Target Exam */}
            <div className="py-2.5 flex items-center justify-between">
              <span className="font-semibold text-slate-500">Target Exam</span>
              <span className="font-bold text-[#0d1b3e]">
                {effectiveProfile?.testTrack || effectiveProfile?.exam || 'MDCAT / FSC'}
              </span>
            </div>

            {/* Grade */}
            <div className="py-2.5 flex items-center justify-between">
              <span className="font-semibold text-slate-500">Grade / Year</span>
              <span className="font-bold text-[#0d1b3e]">
                {effectiveProfile?.grade || 'Class 12'}
              </span>
            </div>

            {/* Target University */}
            <div className="py-2.5 flex items-center justify-between">
              <span className="font-semibold text-slate-500">Target University</span>
              <span className="font-bold text-[#1a6dff]">
                {effectiveProfile?.targetUniversityId?.toUpperCase() || effectiveProfile?.dream_university || 'NUST'}
              </span>
            </div>

            {/* Exam Date */}
            <div className="py-2.5 flex items-center justify-between">
              <span className="font-semibold text-slate-500">Exam Date</span>
              <span className="font-bold text-[#0d1b3e]">
                {effectiveProfile?.targetExamDate || 'August 2026'}
              </span>
            </div>

            {/* Focus Subjects as Pills */}
            <div className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="font-semibold text-slate-500">Focus Subjects</span>
              <div className="flex flex-wrap items-center gap-1.5">
                {subjectsList.map((subj: string, i: number) => (
                  <span
                    key={i}
                    className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200"
                  >
                    {subj}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* EDITABLE FORM */
          <form onSubmit={handleSaveDetails} className="space-y-3.5 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Full Name */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-bold text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1a6dff]"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">WhatsApp / Phone</label>
                <input
                  type="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="e.g. 03001234567"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-bold text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1a6dff]"
                />
              </div>

              {/* Target Exam */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Target Exam</label>
                <select
                  value={editExam}
                  onChange={(e) => setEditExam(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-bold text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1a6dff]"
                >
                  <option value="FBISE">FBISE (Federal Board)</option>
                  <option value="MDCAT">MDCAT (Medical)</option>
                  <option value="TCAT">TCAT (Engineering / Tech)</option>
                  <option value="ECAT">ECAT / UET</option>
                  <option value="NET">NET (NUST)</option>
                  <option value="NUMS">NUMS (Army Medical)</option>
                </select>
              </div>

              {/* Grade */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Grade</label>
                <select
                  value={editGrade}
                  onChange={(e) => setEditGrade(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-bold text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1a6dff]"
                >
                  <option value="Class 9">Class 9 (Matric Part 1)</option>
                  <option value="Class 10">Class 10 (Matric Part 2)</option>
                  <option value="Class 11">Class 11 (FSC Part 1)</option>
                  <option value="Class 12">Class 12 (FSC Part 2)</option>
                  <option value="Repeater / Gap Year">Repeater / Gap Year</option>
                </select>
              </div>

              {/* Target University */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Target University</label>
                <input
                  type="text"
                  value={editUniversity}
                  onChange={(e) => setEditUniversity(e.target.value)}
                  placeholder="e.g. NUST, FAST, King Edward"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-bold text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1a6dff]"
                />
              </div>

              {/* Exam Date */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Exam Date</label>
                <input
                  type="text"
                  value={editExamDate}
                  onChange={(e) => setEditExamDate(e.target.value)}
                  placeholder="e.g. August 2026"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-bold text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1a6dff]"
                />
              </div>

              {/* Focus Subjects */}
              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">
                  Focus Subjects (comma-separated)
                </label>
                <input
                  type="text"
                  value={editSubjects}
                  onChange={(e) => setEditSubjects(e.target.value)}
                  placeholder="Biology, Chemistry, Physics, English"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-bold text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1a6dff]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 rounded-xl font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2 rounded-xl bg-[#0d1b3e] hover:bg-[#152a5c] text-white font-bold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* ========================================================= */}
      {/* 3. CURRENT PLAN CARD: Dark Gradient Card + Checklist + Upgrade/Renew */}
      {/* ========================================================= */}
      <div id="current-plan-card" className="bg-gradient-to-br from-[#0d1b3e] via-[#102554] to-[#0a142e] text-white rounded-3xl p-6 sm:p-7 shadow-xl space-y-5 relative overflow-hidden border border-white/10 scroll-mt-24">
        {/* Subtle accent glow */}
        <div className="absolute top-0 right-0 w-56 h-56 bg-[#1a6dff]/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex items-start justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#1a6dff]">
              {planKey === 'free'
                ? 'STARTER ACCESS'
                : planKey === 'pro'
                ? 'PRO'
                : 'PREMIUM'}
            </span>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {planConfig.name}
            </h3>
            <p className="text-xs text-slate-300 font-normal">
              {planConfig.tagline}
            </p>
          </div>

          <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-amber-400 border border-white/10 shadow-inner">
            <Crown className="w-5 h-5 fill-amber-400 text-amber-400" />
          </div>
        </div>

        {/* 2-Column Checklist of Included Features */}
        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-white/10 text-xs">
          {planConfig.features
            .filter((f) => f.included)
            .map((feat, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <Check className="w-4 h-4 text-[#1a6dff] shrink-0 mt-0.5" />
                <span className="text-slate-200 font-medium leading-relaxed">{feat.text}</span>
              </div>
            ))}
        </div>

        {/* Action Button: Single Entry Point to Pricing Modal per FIX 1 */}
        <div className="relative z-10 pt-3 border-t border-white/10">
          {planKey !== 'free' && (
            <div className="flex items-center justify-between text-xs text-slate-300 mb-3">
              <span>
                Subscription Status:{' '}
                <strong className={isExpired ? 'text-amber-400 font-extrabold' : 'text-emerald-400 font-extrabold'}>
                  {isExpired ? 'Expired' : `${planConfig.name} Active`}
                </strong>
              </span>
              <span>Expires: <strong>{expiryDateString}</strong></span>
            </div>
          )}

          {isPendingReview ? (
            <button
              type="button"
              disabled
              className="w-full py-3.5 px-4 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-amber-300 font-black text-xs flex items-center justify-center gap-2 cursor-not-allowed select-none opacity-90"
              title="Payment verification under review"
            >
              <Crown className="w-4 h-4 fill-amber-300 text-amber-300" />
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-black border border-amber-400/40">
                Payment under review
              </span>
            </button>
          ) : isExpired ? (
            <button
              type="button"
              onClick={() => onOpenUpgrade?.(planKey === 'premium' ? 'premium' : 'pro')}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 hover:from-amber-300 hover:to-amber-200 text-amber-950 font-black text-xs shadow-lg shadow-amber-400/30 cursor-pointer active:scale-95 transition-all flex items-center justify-center gap-2 border border-amber-300"
              title="Renew Plan"
            >
              <Crown className="w-4 h-4 fill-amber-950 text-amber-950" />
              <span>Renew Plan</span>
            </button>
          ) : planKey === 'free' ? (
            <button
              type="button"
              onClick={() => onOpenUpgrade?.('pro')}
              className="w-full py-3.5 px-4 rounded-2xl bg-[#1a6dff] hover:bg-[#1558d6] text-white font-black text-xs shadow-lg shadow-[#1a6dff]/30 cursor-pointer active:scale-95 transition-all flex items-center justify-center gap-2 border border-blue-400/30"
              title="Upgrade to Pro"
            >
              <Crown className="w-4 h-4 fill-white text-white" />
              <span>Upgrade to Pro</span>
            </button>
          ) : planKey === 'pro' ? (
            <button
              type="button"
              onClick={() => onOpenUpgrade?.('premium')}
              className="w-full py-3.5 px-4 rounded-2xl bg-[#1a6dff] hover:bg-[#1558d6] text-white font-black text-xs shadow-lg shadow-[#1a6dff]/30 cursor-pointer active:scale-95 transition-all flex items-center justify-center gap-2 border border-blue-400/30"
              title="Upgrade to Premium"
            >
              <Crown className="w-4 h-4 fill-white text-white" />
              <span>Upgrade to Premium</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onOpenUpgrade?.('premium')}
              className="w-full py-3.5 px-4 rounded-2xl bg-white/15 hover:bg-white/25 text-white font-black text-xs border border-white/25 cursor-pointer active:scale-95 transition-all flex items-center justify-center gap-2 shadow-md"
              title="Renew Plan"
            >
              <Crown className="w-4 h-4 fill-white text-white" />
              <span>Renew Plan</span>
            </button>
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* 4. LOG OUT BUTTON                                         */}
      {/* ========================================================= */}
      <div className="pt-2">
        <button
          type="button"
          onClick={async () => {
            try {
              clearAllClientAuthAndSessionData();
              await supabase.auth.signOut();
            } catch (err) {
              console.error('Logout error:', err);
            }
            if (authContext?.logOut) {
              await authContext.logOut();
            }
            if (onSignOut) {
              onSignOut();
            }
          }}
          className="w-full bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-extrabold py-3.5 px-6 rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 text-xs shadow-xs"
        >
          <LogOut className="w-4 h-4 text-rose-600" />
          <span>Log Out of Account</span>
        </button>
      </div>

      {/* Target University Modal (Optional quick selector) */}
      <TargetUniversityModal
        isOpen={showUniModal}
        onClose={() => setShowUniModal(false)}
        currentUser={effectiveUser}
        userProfile={effectiveProfile}
        onUniversityUpdated={() => {
          onRefreshProfile?.();
          authContext?.refreshProfile?.();
        }}
      />
    </div>
  );
};
