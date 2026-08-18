import React, { useState, useRef } from 'react';
import { StudentProfile, User, updateStudentPersonalInfo, uploadUserAvatar, supabase, evaluateStudentAccess } from '../lib/supabase';
import { renderTargetUniversityBadge } from './InstitutionBadge';
import { TargetUniversityModal } from './TargetUniversityModal';
import { UserAvatar } from './UserAvatar';
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
  ShieldCheck,
  Calendar,
  Sparkles,
  CreditCard,
  Layers,
  LogOut,
  Camera,
  Loader2,
} from 'lucide-react';

interface StudentProfileViewProps {
  user: User;
  profile: StudentProfile;
  onRefreshProfile: () => void;
  onStartPractice?: () => void;
  onSignOut?: () => void;
}

export const StudentProfileView: React.FC<StudentProfileViewProps> = ({
  user,
  profile,
  onRefreshProfile,
  onStartPractice,
  onSignOut,
}) => {
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editName, setEditName] = useState<string>(profile.name || '');
  const [editPhone, setEditPhone] = useState<string>(profile.phone || '');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [toast, setToast] = useState<{ text: string; isError?: boolean } | null>(null);
  const [showUniModal, setShowUniModal] = useState<boolean>(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const initialLetter = (profile.name || user.email || 'S').charAt(0).toUpperCase();

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 1. Validation
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/avif', 'image/svg+xml'];
    if (!validTypes.includes(file.type) && !file.type.startsWith('image/')) {
      setToast({ text: 'Please select a valid image file (JPEG, PNG, WebP, GIF, AVIF).', isError: true });
      setTimeout(() => setToast(null), 4000);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const maxBytes = 5 * 1024 * 1024; // 5 MB
    if (file.size > maxBytes) {
      setToast({ text: 'Image exceeds 5MB limit. Please choose a smaller photo.', isError: true });
      setTimeout(() => setToast(null), 4000);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const res = await uploadUserAvatar(user.id, file, user.email || profile.email);
      if (res.success) {
        setToast({ text: 'Profile picture updated successfully!' });
        setTimeout(() => setToast(null), 3500);
        onRefreshProfile();
      } else {
        setToast({ text: res.message || 'Failed to upload profile picture.', isError: true });
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
    if (!editName.trim() || !editPhone.trim()) return;

    setIsSaving(true);
    const res = await updateStudentPersonalInfo(
      user.id,
      {
        name: editName,
        phone: editPhone,
      },
      user.email
    );

    setIsSaving(false);
    if (res.success) {
      setIsEditing(false);
      setToast({ text: 'Personal details updated successfully!' });
      setTimeout(() => setToast(null), 3000);
      onRefreshProfile();
    } else {
      setToast({ text: res.message || 'Failed to update personal details.', isError: true });
      setTimeout(() => setToast(null), 4000);
    }
  };

  // Convert subject array or string into comma-separated list
  const getSubjectListString = (): string => {
    if (Array.isArray(profile.subjects)) {
      return profile.subjects.join(', ');
    }
    if (typeof profile.subjects === 'string' && profile.subjects.trim()) {
      return profile.subjects;
    }
    return 'Biology, Chemistry, Physics, Mathematics, English, Urdu, Islamiat';
  };

  const subjectListStr = getSubjectListString();
  const truncatedSubjects =
    subjectListStr.length > 55 ? subjectListStr.substring(0, 55) + '…' : subjectListStr;

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6 py-2 px-3 sm:px-4 text-left animate-ios-spring">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-20 right-4 z-50 px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-bold animate-bounce ${
            toast.isError
              ? 'bg-rose-950 text-white border border-rose-500'
              : 'bg-[#0A0A0A] text-white border border-[#F2B90C]'
          }`}
        >
          {toast.isError ? (
            <Info className="w-4 h-4 text-rose-400" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-[#F2B90C]" />
          )}
          <span>{toast.text}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <h2 className="font-['Space_Grotesk'] text-2xl sm:text-3xl font-extrabold text-[#0A0A0A]  leading-tight">
            My Profile
          </h2>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#0A0A0A]  bg-[#F2B90C]/20 border border-[#F2B90C]/40 px-3 py-1 rounded-full">
            Boardly LMS
          </span>
        </div>
        <p className="text-xs sm:text-sm text-slate-500  font-medium">
          View and update your personal info, course enrollments, and class package details.
        </p>
      </div>

      {/* 1. Main Profile Card */}
      <div className="bg-white  text-slate-900  border border-black/10  rounded-3xl p-6 sm:p-7 shadow-xl space-y-4 relative overflow-hidden transition-colors">
        <div className="absolute top-0 right-0 w-48 h-48 bg-[#F2B90C]/15  rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            {/* Avatar with Camera upload button overlay */}
            <div className="relative group shrink-0">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                className="hidden"
                onChange={handleAvatarFileChange}
                disabled={isUploadingAvatar}
              />
              <UserAvatar
                user={user}
                profile={profile}
                size="lg"
                shape="square"
                className="shadow-lg border-2 border-slate-200/80 rounded-2xl"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingAvatar}
                className="absolute -bottom-1 -right-1 p-1.5 bg-[#1E5AFF] hover:bg-[#1546CC] text-white rounded-xl shadow-md border-2 border-white transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                title="Change Profile Picture"
                aria-label="Change Profile Picture"
              >
                {isUploadingAvatar ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Camera className="w-3.5 h-3.5" />
                )}
              </button>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-['Space_Grotesk'] text-xl font-bold text-slate-900 leading-tight">
                  {profile.name || 'Student Account'}
                </h3>
                <span className="bg-[#F2B90C] text-[#0A0A0A] text-[9px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-xs">
                  STUDENT ACCOUNT
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-xs text-slate-600 font-medium pt-0.5">
                <span className="flex items-center gap-1.5 text-slate-600">
                  <Mail className="w-3.5 h-3.5 text-[#F2B90C]" />
                  <span>{profile.email}</span>
                </span>
                {profile.phone && (
                  <>
                    <span className="hidden sm:inline text-slate-400">&bull;</span>
                    <span className="flex items-center gap-1.5 text-slate-600">
                      <Phone className="w-3.5 h-3.5 text-[#F2B90C]" />
                      <span>{profile.phone}</span>
                    </span>
                  </>
                )}
              </div>

              {/* Upload photo helper button */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingAvatar}
                  className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#1E5AFF] hover:text-[#1546CC] hover:underline cursor-pointer transition-colors"
                >
                  <Camera className="w-3 h-3" />
                  <span>{isUploadingAvatar ? 'Uploading picture...' : 'Change profile picture'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Personal Details Card (With Edit Details button for Name & Phone) */}
      <div className="bg-white  border border-black/10  rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-black/5 ">
          <div className="flex items-center gap-2">
            <UserIcon className="w-4 h-4 text-[#F2B90C]" />
            <h3 className="font-['Space_Grotesk'] text-sm sm:text-base font-bold text-[#0A0A0A]  uppercase tracking-wider">
              Personal Details
            </h3>
          </div>

          {!isEditing ? (
            <button
              onClick={() => {
                setEditName(profile.name || '');
                setEditPhone(profile.phone || '');
                setIsEditing(true);
              }}
              className="px-3 py-1.5 rounded-full bg-black/5  hover:bg-[#F2B90C] hover:text-[#0A0A0A] text-[#0A0A0A]  font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer border border-black/5 "
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit details</span>
            </button>
          ) : (
            <button
              onClick={() => setIsEditing(false)}
              className="p-1.5 rounded-full hover:bg-black/5  text-slate-500 cursor-pointer"
              title="Cancel editing"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {!isEditing ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="bg-slate-50  p-3.5 rounded-2xl border border-black/5  space-y-1">
              <span className="text-slate-500 font-bold block text-[10px] uppercase tracking-wider">
                Full Name
              </span>
              <span className="font-extrabold text-sm text-[#0A0A0A]  block">
                {profile.name || 'Not provided'}
              </span>
            </div>

            <div className="bg-slate-50  p-3.5 rounded-2xl border border-black/5  space-y-1">
              <span className="text-slate-500 font-bold block text-[10px] uppercase tracking-wider">
                WhatsApp / Phone Number
              </span>
              <span className="font-extrabold text-sm text-[#0A0A0A]  block">
                {profile.phone || 'Not provided'}
              </span>
            </div>

            {/* Email locked badge */}
            <div className="bg-slate-50  p-3.5 rounded-2xl border border-black/5  space-y-1 sm:col-span-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-bold text-[10px] uppercase tracking-wider">
                  Google Account Email (Locked)
                </span>
                <span className="text-[10px] font-extrabold text-[#F2B90C] flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Permanent Read-Only
                </span>
              </div>
              <span className="font-semibold text-xs text-slate-600  block">
                {profile.email}
              </span>
            </div>
          </div>
        ) : (
          /* Inline Edit Form for Full Name & Phone */
          <form onSubmit={handleSaveDetails} className="space-y-4 text-xs animate-ios-spring">
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#0A0A0A]  mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-slate-50  border border-black/10  rounded-2xl px-4 py-2.5 text-xs font-extrabold text-[#0A0A0A]  focus:outline-none focus:border-[#F2B90C]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0A0A0A]  mb-1">
                  WhatsApp / Phone Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full bg-slate-50  border border-black/10  rounded-2xl px-4 py-2.5 text-xs font-extrabold text-[#0A0A0A]  focus:outline-none focus:border-[#F2B90C]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600  hover:bg-black/5 "
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2 rounded-xl bg-[#0A0A0A] text-white   font-extrabold text-xs flex items-center gap-1.5 cursor-pointer hover:opacity-90 active:scale-95 transition-all"
              >
                {isSaving ? (
                  <span>Saving...</span>
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

      {/* 3. Course Registration Card (Read-only for Student, No Edit Button) */}
      <div className="bg-white  border border-black/10  rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-black/5 ">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#F2B90C]" />
            <h3 className="font-['Space_Grotesk'] text-sm sm:text-base font-bold text-[#0A0A0A]  uppercase tracking-wider">
              Course Registration
            </h3>
          </div>
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 bg-black/5  px-2.5 py-1 rounded-full">
            Read-Only Record
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          {/* Exam Board */}
          <div className="p-3.5 bg-slate-50  border border-black/5  rounded-2xl space-y-1">
            <div className="flex items-center gap-1.5 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
              <Award className="w-3.5 h-3.5 text-[#F2B90C]" />
              <span>Exam Board</span>
            </div>
            <span className="font-extrabold text-sm text-[#0A0A0A]  block">
              FBISE
            </span>
          </div>

          {/* Grade / Class */}
          <div className="p-3.5 bg-slate-50  border border-black/5  rounded-2xl space-y-1">
            <div className="flex items-center gap-1.5 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
              <BookOpen className="w-3.5 h-3.5 text-[#F2B90C]" />
              <span>Grade / Class</span>
            </div>
            <span className="font-extrabold text-sm text-[#0A0A0A]  block">
              {profile.grade || 'Class 11'}
            </span>
          </div>

          {/* Academic Stream */}
          <div className="p-3.5 bg-slate-50  border border-black/5  rounded-2xl space-y-1">
            <div className="flex items-center gap-1.5 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
              <GraduationCap className="w-3.5 h-3.5 text-[#F2B90C]" />
              <span>Academic Stream</span>
            </div>
            <span className="font-extrabold text-sm text-[#0A0A0A]  block truncate">
              {profile.stream || 'Pre-Medical Stream'}
            </span>
          </div>

          {/* Target University */}
          <div className="p-3.5 bg-slate-50  border border-black/5  rounded-2xl space-y-1.5 sm:col-span-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                <GraduationCap className="w-3.5 h-3.5 text-[#1E5AFF]" />
                <span>Target University</span>
              </div>
              <button
                type="button"
                onClick={() => setShowUniModal(true)}
                className="text-[10px] text-[#1E5AFF]  font-extrabold hover:underline cursor-pointer"
              >
                Change
              </button>
            </div>
            <div>
              {renderTargetUniversityBadge(
                profile.dream_university || profile.target_university,
                'md',
                () => setShowUniModal(true)
              )}
            </div>
          </div>
        </div>

        {/* Gray Info Box */}
        <div className="p-3.5 bg-slate-100/80  border border-slate-200  rounded-2xl flex items-start gap-2.5 text-xs text-slate-600  font-medium">
          <Info className="w-4 h-4 text-[#F2B90C] shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            Please contact the SHS Academy Administrator if you need to update your registered course or subject combos.
          </p>
        </div>
      </div>

      {/* 4. Course Enrollment Details Card */}
      <div className="bg-white  border border-black/10  rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-black/5 ">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#F2B90C]" />
            <h3 className="font-['Space_Grotesk'] text-sm sm:text-base font-bold text-[#0A0A0A]  uppercase tracking-wider">
              Course Enrollment Details
            </h3>
          </div>

          {/* Active Subscription Pill */}
          {(() => {
            const access = evaluateStudentAccess(profile);
            return (
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                access.isPro
                  ? 'bg-emerald-500/15 text-emerald-700  border border-emerald-500/30'
                  : 'bg-slate-500/15 text-slate-700  border border-slate-500/30'
              }`}>
                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                <span>{access.isPro ? 'Pro Active' : (access.isProExpired ? 'Pro Expired' : 'Free Plan')}</span>
              </span>
            );
          })()}
        </div>

        {/* Read-Only Summary Table */}
        {(() => {
          const access = evaluateStudentAccess(profile);
          return (
            <div className="divide-y divide-black/5  border border-black/10  rounded-2xl overflow-hidden text-xs">
              <div className="p-3.5 bg-slate-50  flex justify-between items-center">
                <span className="font-bold text-slate-500">Subscription Package</span>
                <span className="font-extrabold text-[#0A0A0A] ">
                  {access.effectivePlanName}
                </span>
              </div>

              <div className="p-3.5 bg-white  flex justify-between items-start gap-4">
                <span className="font-bold text-slate-500 shrink-0">Enrolled Track</span>
                <span className="font-bold text-[#0A0A0A]  text-right truncate max-w-xs">
                  Class {access.assignedTrack} ({access.assignedStream})
                </span>
              </div>

              <div className="p-3.5 bg-slate-50  flex justify-between items-center">
                <span className="font-bold text-slate-500">Monthly Test Limit</span>
                <span className="font-extrabold text-[#0A0A0A] ">
                  {access.isPro ? 'Unlimited Tests' : '2 Tests / Calendar Month'}
                </span>
              </div>

              <div className="p-3.5 bg-white  flex justify-between items-center">
                <span className="font-bold text-slate-500">Payment Status</span>
                <span className={`font-extrabold flex items-center gap-1 ${
                  access.isPro ? 'text-emerald-600 ' : 'text-slate-600 '
                }`}>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{access.paymentStatus}</span>
                </span>
              </div>

              <div className="p-3.5 bg-slate-50  flex justify-between items-center">
                <span className="font-bold text-slate-500">Access Expiration</span>
                <span className="font-extrabold text-[#0A0A0A] ">
                  {access.isPro
                    ? `${access.daysRemaining} days remaining (${access.accessExpiresDate ? new Date(access.accessExpiresDate).toLocaleDateString() : 'Active'})`
                    : 'Free Tier (Renews Monthly)'}
                </span>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Bottom Action Row: Log Out of Account */}
      <div className="pt-2">
        <button
          onClick={async () => {
            try {
              await supabase.auth.signOut();
            } catch (err) {
              console.error('Logout error:', err);
            }
            if (onSignOut) {
              onSignOut();
            }
          }}
          className="w-full bg-rose-100  hover:bg-rose-200  text-rose-900  border border-rose-300  font-extrabold py-3.5 px-6 rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 text-xs shadow-sm"
        >
          <LogOut className="w-4 h-4 text-rose-700 " />
          <span>Log Out of Account</span>
        </button>
      </div>

      <TargetUniversityModal
        isOpen={showUniModal}
        onClose={() => setShowUniModal(false)}
        currentUser={user}
        userProfile={profile}
        onUniversityUpdated={() => {
          onRefreshProfile();
        }}
      />
    </div>
  );
};
