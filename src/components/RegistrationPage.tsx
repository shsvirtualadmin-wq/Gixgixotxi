import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  User,
  Layers,
  BookOpen,
  GraduationCap,
  Check,
  ArrowRight,
  LogOut,
  ShieldCheck,
  Building2,
  X,
  Zap,
} from 'lucide-react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { BoardClass } from '../types';

export interface RegistrationFormData {
  fullName: string;
  phone: string;
  email: string;
  category: string;
  targetUniversity: string;
  grade?: string;
  stream?: string;
  subjects: string[];
}

interface RegistrationPageProps {
  user: SupabaseUser | null;
  onProceedToCheckout: (data: RegistrationFormData) => void;
  onSignOut: () => void;
}

// 20 Exact Exam Categories defined in the spec
export const EXAM_CATEGORIES = [
  { id: 'fbise', name: 'FBISE Board', code: 'FBISE', type: 'board' },
  { id: 'mdcat', name: 'PMDC MDCAT', code: 'MDCAT', type: 'medical' },
  { id: 'tcat', name: 'UET Taxila TCAT', code: 'TCAT', type: 'engineering' },
  { id: 'net', name: 'NUST (NET)', code: 'NET', type: 'engineering' },
  { id: 'fast', name: 'FAST-NU (NAT)', code: 'FAST', type: 'computing' },
  { id: 'ecat', name: 'UET Lahore (ECAT)', code: 'ECAT', type: 'engineering' },
  { id: 'etea', name: 'UET Peshawar (ETEA)', code: 'ETEA', type: 'engineering' },
  { id: 'nums', name: 'NUMS', code: 'NUMS', type: 'medical' },
  { id: 'giki', name: 'GIKI', code: 'GIKI', type: 'engineering' },
  { id: 'usat', name: 'HEC USAT', code: 'USAT', type: 'general' },
  { id: 'ned', name: 'NED', code: 'NED', type: 'engineering' },
  { id: 'pieas', name: 'PIEAS', code: 'PIEAS', type: 'engineering' },
  { id: 'nat', name: 'NTS NAT', code: 'NAT', type: 'general' },
  { id: 'iba', name: 'IBA Karachi', code: 'IBA', type: 'business' },
  { id: 'aku', name: 'AKU Medical', code: 'AKU', type: 'medical' },
  { id: 'muet', name: 'MUET', code: 'MUET', type: 'engineering' },
  { id: 'lums', name: 'LUMS', code: 'LUMS', type: 'business' },
  { id: 'numl', name: 'NUML', code: 'NUML', type: 'general' },
  { id: 'hitec', name: 'HITEC Taxila', code: 'HITEC', type: 'engineering' },
  { id: 'nutech', name: 'NUTECH', code: 'NUTECH', type: 'engineering' },
] as const;

// Stream definitions with Boardly's actual subjects
export const STREAM_OPTIONS_PER_TRACK: Record<string, { id: string; name: string; subjects: string[] }[]> = {
  fbise: [
    {
      id: 'pre_medical',
      name: 'Pre-Medical Stream',
      subjects: ['Physics', 'Chemistry', 'Biology', 'English', 'Urdu', 'Islamiat / Pak Studies'],
    },
    {
      id: 'pre_engineering',
      name: 'Pre-Engineering Stream',
      subjects: ['Physics', 'Chemistry', 'Mathematics', 'English', 'Urdu', 'Islamiat / Pak Studies'],
    },
    {
      id: 'ics_physics',
      name: 'ICS (Physics) Stream',
      subjects: ['Physics', 'Computer Science', 'Mathematics', 'English', 'Urdu', 'Islamiat / Pak Studies'],
    },
    {
      id: 'ics_stats',
      name: 'ICS (Stats) Stream',
      subjects: ['Statistics', 'Computer Science', 'Mathematics', 'English', 'Urdu', 'Islamiat / Pak Studies'],
    },
  ],
  net: [
    {
      id: 'net_eng',
      name: 'Engineering Stream',
      subjects: ['Mathematics (80)', 'Physics (60)', 'Chemistry (30)', 'English (20)', 'Intelligence (10)'],
    },
    {
      id: 'net_cs',
      name: 'Computing / CS Stream',
      subjects: ['Mathematics (80)', 'Physics (60)', 'Computer Science (30)', 'English (20)', 'Intelligence (10)'],
    },
    {
      id: 'net_bio',
      name: 'Applied Sciences / Bio Stream',
      subjects: ['Biology (80)', 'Chemistry (60)', 'Physics (30)', 'English (20)', 'Intelligence (10)'],
    },
  ],
  tcat: [
    {
      id: 'tcat_eng',
      name: 'Pre-Engineering Stream',
      subjects: ['Mathematics', 'Physics', 'Chemistry', 'English'],
    },
    {
      id: 'tcat_ics',
      name: 'ICS / Computing Stream',
      subjects: ['Mathematics', 'Physics', 'Computer Science', 'English'],
    },
  ],
  ecat: [
    {
      id: 'ecat_eng',
      name: 'Pre-Engineering Stream',
      subjects: ['Mathematics', 'Physics', 'Chemistry', 'English'],
    },
    {
      id: 'ecat_ics',
      name: 'Computer Science Stream',
      subjects: ['Mathematics', 'Physics', 'Computer Science', 'English'],
    },
  ],
  etea: [
    {
      id: 'etea_eng',
      name: 'Engineering Stream',
      subjects: ['Mathematics', 'Physics', 'Chemistry', 'English'],
    },
    {
      id: 'etea_cs',
      name: 'Computer Science Stream',
      subjects: ['Mathematics', 'Physics', 'Computer Science', 'English'],
    },
  ],
  fast: [
    {
      id: 'fast_cs',
      name: 'BS Computing / CS Stream',
      subjects: ['Advanced Mathematics', 'Basic Mathematics', 'Physics', 'English', 'Analytical IQ'],
    },
    {
      id: 'fast_eng',
      name: 'Engineering Stream',
      subjects: ['Advanced Mathematics', 'Physics', 'Chemistry', 'English'],
    },
  ],
  usat: [
    {
      id: 'usat_e',
      name: 'USAT-E (Engineering)',
      subjects: ['Physics', 'Chemistry', 'Mathematics', 'Verbal Reasoning', 'Quantitative Reasoning'],
    },
    {
      id: 'usat_m',
      name: 'USAT-M (Medical)',
      subjects: ['Physics', 'Chemistry', 'Biology', 'Verbal Reasoning', 'Quantitative Reasoning'],
    },
    {
      id: 'usat_cs',
      name: 'USAT-CS (Computer Science)',
      subjects: ['Physics', 'Computer Science', 'Mathematics', 'Verbal Reasoning', 'Quantitative Reasoning'],
    },
  ],
  giki: [
    {
      id: 'giki_eng',
      name: 'Engineering Stream',
      subjects: ['Mathematics (30)', 'Physics (25)', 'English (15)'],
    },
    {
      id: 'giki_cs',
      name: 'Computer Science Stream',
      subjects: ['Mathematics (30)', 'Physics (25)', 'English (15)'],
    },
  ],
  pieas: [
    {
      id: 'pieas_eng',
      name: 'Engineering & CS Stream',
      subjects: ['Mathematics (30)', 'Physics (30)', 'Chemistry / CS (20)', 'English (20)'],
    },
  ],
};

// University names mapping for university-specific tracks
export const TRACK_UNIVERSITY_MAPPING: Record<string, { fullName: string; short: string; location: string }> = {
  net: { fullName: 'National University of Sciences & Technology (NUST)', short: 'NUST', location: 'Islamabad' },
  fast: { fullName: 'FAST National University of Computer and Emerging Sciences', short: 'FAST-NUCES', location: 'Islamabad / Lahore / Khi' },
  ecat: { fullName: 'University of Engineering and Technology (UET) Lahore', short: 'UET Lahore', location: 'Lahore' },
  tcat: { fullName: 'University of Engineering and Technology (UET) Taxila', short: 'UET Taxila', location: 'Taxila' },
  etea: { fullName: 'UET Peshawar / Khyber Pakhtunkhwa Engineering Universities', short: 'UET Peshawar', location: 'Peshawar' },
  nums: { fullName: 'National University of Medical Sciences (NUMS) & AMC', short: 'NUMS', location: 'Rawalpindi' },
  giki: { fullName: 'Ghulam Ishaq Khan Institute of Engineering Sciences & Technology', short: 'GIKI', location: 'Topi, Swabi' },
  ned: { fullName: 'NED University of Engineering & Technology', short: 'NED', location: 'Karachi' },
  pieas: { fullName: 'Pakistan Institute of Engineering and Applied Sciences', short: 'PIEAS', location: 'Islamabad' },
  iba: { fullName: 'Institute of Business Administration (IBA)', short: 'IBA Karachi', location: 'Karachi' },
  aku: { fullName: 'Aga Khan University Medical College', short: 'AKU', location: 'Karachi' },
  muet: { fullName: 'Mehran University of Engineering and Technology', short: 'MUET', location: 'Jamshoro' },
  lums: { fullName: 'Lahore University of Management Sciences', short: 'LUMS', location: 'Lahore' },
  numl: { fullName: 'National University of Modern Languages', short: 'NUML', location: 'Islamabad' },
  hitec: { fullName: 'HITEC University', short: 'HITEC', location: 'Taxila' },
  nutech: { fullName: 'National University of Technology', short: 'NUTECH', location: 'Islamabad' },
  nat: { fullName: 'National Testing Service (NTS NAT Associated Universities)', short: 'NTS NAT', location: 'Pakistan' },
  usat: { fullName: 'Higher Education Commission (HEC USAT Universities)', short: 'HEC USAT', location: 'Pakistan' },
  mdcat: { fullName: 'PMDC Recognized Public & Private Medical Colleges', short: 'PMDC MDCAT', location: 'Nationwide' },
};

export const RegistrationPage: React.FC<RegistrationPageProps> = ({
  user,
  onProceedToCheckout,
  onSignOut,
}) => {
  // Form State
  const [fullName, setFullName] = useState<string>(() => {
    return (
      user?.user_metadata?.full_name ||
      user?.user_metadata?.name ||
      ''
    );
  });

  const [phone, setPhone] = useState<string>('');
  const [phoneError, setPhoneError] = useState<string | null>(null);

  // Selected Exam Category (Default: NUST NET or FBISE)
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('net');

  // Selected Grade for FBISE (9th, 10th, 11th, 12th)
  const [selectedGrade, setSelectedGrade] = useState<string>('11th');

  // Selected Stream
  const [selectedStreamId, setSelectedStreamId] = useState<string>('net_eng');

  // Plan Comparison Modal State
  const [showPlanModal, setShowPlanModal] = useState<boolean>(false);

  // Active Category Object
  const selectedCategory = useMemo(() => {
    return EXAM_CATEGORIES.find((c) => c.id === selectedCategoryId) || EXAM_CATEGORIES[0];
  }, [selectedCategoryId]);

  // Dynamic available streams
  const availableStreams = useMemo(() => {
    return STREAM_OPTIONS_PER_TRACK[selectedCategoryId] || [];
  }, [selectedCategoryId]);

  // Auto-select first stream when category changes
  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    const streams = STREAM_OPTIONS_PER_TRACK[categoryId];
    if (streams && streams.length > 0) {
      setSelectedStreamId(streams[0].id);
    } else {
      setSelectedStreamId('');
    }
  };

  // Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!phone || phone.trim().length < 9) {
      setPhoneError('Please enter a valid WhatsApp / Phone number (e.g. +92 300 1234567)');
      return;
    }
    setPhoneError(null);

    const activeStreamObj = availableStreams.find((s) => s.id === selectedStreamId);
    const universityInfo = TRACK_UNIVERSITY_MAPPING[selectedCategoryId];

    let targetUni = universityInfo ? universityInfo.fullName : 'FBISE Board';
    let computedGrade = selectedCategory.id === 'fbise' ? selectedGrade : selectedCategory.code;

    const formData: RegistrationFormData = {
      fullName: fullName.trim() || user?.email?.split('@')[0] || 'Student',
      phone: phone.trim(),
      email: user?.email || '',
      category: selectedCategory.name,
      targetUniversity: targetUni,
      grade: computedGrade,
      stream: activeStreamObj?.name || (selectedCategory.id === 'mdcat' ? 'Medical Stream' : 'General'),
      subjects: activeStreamObj?.subjects || (selectedCategory.id === 'mdcat' ? ['Biology', 'Chemistry', 'Physics', 'English', 'Logical Reasoning'] : ['General Subjects']),
    };

    onProceedToCheckout(formData);
  };

  return (
    <div id="boardly-registration-container" className="min-h-screen w-full bg-[#F8F9FB] flex flex-col items-center justify-start py-6 sm:py-10 px-3 sm:px-6">
      {/* Centered Header Above Card */}
      <div id="boardly-reg-header" className="flex flex-col items-center text-center mb-6">
        <div className="flex items-center gap-2.5 mb-1.5">
          <div className="w-9 h-9 rounded-xl bg-slate-950 flex items-center justify-center shadow-md border border-slate-800 text-white font-black text-lg">
            B
          </div>
          <span className="text-2xl font-black tracking-tight text-slate-950">Boardly</span>
        </div>
        <p className="text-xs font-semibold text-slate-500 tracking-normal">
          Boardly by SHS Virtual Academy · Self-Paced Exam Prep
        </p>
      </div>

      {/* ONE Main White Card */}
      <div
        id="boardly-reg-card"
        className="w-full max-w-3xl bg-white rounded-3xl border border-slate-200/80 shadow-[0_10px_35px_-8px_rgba(0,0,0,0.06)] p-5 sm:p-8 relative"
      >
        {/* Card Top Row */}
        <div id="reg-card-top-row" className="flex items-center justify-between gap-3 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600">
              <Sparkles className="w-4 h-4" />
            </div>
            <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
              Student Registration
            </h1>
          </div>

          {/* Dynamic Exam Category Pill Badge */}
          <div
            id="reg-selected-track-pill"
            className="px-3 py-1 rounded-full bg-slate-900 text-white text-[11px] sm:text-xs font-extrabold flex items-center gap-1.5 shadow-sm whitespace-nowrap"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>{selectedCategory.name}</span>
          </div>
        </div>

        {/* Subtitle */}
        <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed pb-4">
          Select your exam track, target university, and payment plan to customize your curriculum and proceed to checkout.
        </p>

        {/* Divider */}
        <hr className="border-slate-100 mb-6" />

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* SECTION 1: PERSONAL INFORMATION */}
          <div id="reg-section-personal" className="space-y-3.5">
            <div className="flex items-center gap-2">
              <User className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-700">
                PERSONAL INFORMATION
              </span>
            </div>

            {/* Side-by-Side: Full Name & WhatsApp / Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                  FULL NAME
                </label>
                <input
                  id="reg-input-name"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Muhammad Ali"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800 transition-all placeholder:text-slate-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                  WHATSAPP / PHONE *
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-sm select-none" role="img" aria-label="Pakistan">
                    🇵🇰
                  </span>
                  <input
                    id="reg-input-phone"
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      if (phoneError) setPhoneError(null);
                    }}
                    placeholder="+92 3XXXXXXXXX"
                    className={`w-full pl-9 pr-3.5 py-2.5 rounded-xl border ${
                      phoneError ? 'border-rose-400 ring-2 ring-rose-400/10' : 'border-slate-200'
                    } bg-white text-slate-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800 transition-all placeholder:text-slate-400`}
                  />
                </div>
                {phoneError && (
                  <p className="text-[10px] font-bold text-rose-500 mt-1">{phoneError}</p>
                )}
              </div>
            </div>

            {/* Full-width Google Account Email (read-only greyed) */}
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                GOOGLE ACCOUNT EMAIL
              </label>
              <input
                id="reg-input-email"
                type="email"
                readOnly
                disabled
                value={user?.email || 'Logged In Student Account'}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200/80 bg-slate-50 text-slate-500 text-xs font-semibold cursor-not-allowed select-none"
              />
            </div>
          </div>

          {/* Divider */}
          <hr className="border-slate-100" />

          {/* SECTION 2: SELECT EXAM CATEGORY */}
          <div id="reg-section-category" className="space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-700">
                  SELECT EXAM CATEGORY
                </span>
              </div>
              <span className="text-[10px] font-bold text-slate-400">Curriculum Standard</span>
            </div>

            {/* Segmented/Pill selector wrapping across rows */}
            <div className="flex flex-wrap gap-2 pt-1" id="exam-categories-pill-grid">
              {EXAM_CATEGORIES.map((cat) => {
                const isSelected = selectedCategoryId === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleCategorySelect(cat.id)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border ${
                      isSelected
                        ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isSelected ? 'bg-amber-400 ring-2 ring-amber-400/30' : 'bg-slate-300'
                      }`}
                    />
                    <span>{cat.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Divider */}
          <hr className="border-slate-100" />

          {/* SECTION 3: SELECT TARGET UNIVERSITY / GRADE */}
          <div id="reg-section-target" className="space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-700">
                  SELECT TARGET UNIVERSITY / GRADE
                </span>
              </div>

              {/* Compare Plans Gold/Yellow Pill Button */}
              <button
                type="button"
                onClick={() => setShowPlanModal(true)}
                className="px-3 py-1 rounded-full bg-amber-100 hover:bg-amber-200/80 text-amber-900 border border-amber-300/60 text-[10px] font-extrabold flex items-center gap-1 transition-all cursor-pointer shadow-xs active:scale-95"
              >
                <span>✨ Compare Plans</span>
              </button>
            </div>

            {/* Dynamic Content based on Track */}
            {selectedCategoryId === 'fbise' ? (
              // FBISE: Selectable Grade Cards (9th, 10th, 11th, 12th)
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                {[
                  { id: '9th', label: '9th', sub: 'Grade 9 (SSC-I)' },
                  { id: '10th', label: '10th', sub: 'Grade 10 (SSC-II)' },
                  { id: '11th', label: '11th', sub: 'Grade 11 (HSSC-I)' },
                  { id: '12th', label: '12th', sub: 'Grade 12 (HSSC-II)' },
                ].map((gr) => {
                  const isSelected = selectedGrade === gr.id;
                  return (
                    <button
                      key={gr.id}
                      type="button"
                      onClick={() => setSelectedGrade(gr.id)}
                      className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative flex flex-col justify-between ${
                        isSelected
                          ? 'border-amber-500 bg-amber-50/40 ring-2 ring-amber-500/20 shadow-xs'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-black text-slate-900">{gr.label}</span>
                        {isSelected && (
                          <div className="w-4 h-4 rounded-full bg-amber-500 flex items-center justify-center text-white">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </div>
                        )}
                      </div>
                      <span className="text-[10px] font-semibold text-slate-500 mt-1">{gr.sub}</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              // University-tied tracks: Pre-selected / confirmed target institution card
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-center text-slate-800">
                    <Building2 className="w-5 h-5 text-slate-700" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-extrabold text-slate-900">
                      {TRACK_UNIVERSITY_MAPPING[selectedCategoryId]?.fullName || selectedCategory.name}
                    </h3>
                    <p className="text-[10px] font-medium text-slate-500">
                      Target Institution & Syllabus Standard · Confirmed for {selectedCategory.code}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full text-[10px] font-extrabold shrink-0">
                  <Check className="w-3 h-3 stroke-[3]" />
                  <span>Confirmed</span>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 4: CHOOSE STREAM (Only if streams exist for this track) */}
          {availableStreams.length > 0 && (
            <>
              <hr className="border-slate-100" />

              <div id="reg-section-stream" className="space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-3.5 h-3.5 text-slate-500" />
                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-700">
                      CHOOSE STREAM
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400">Select one</span>
                </div>

                {/* Side-by-side Stream Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {availableStreams.map((stream) => {
                    const isSelected = selectedStreamId === stream.id;
                    return (
                      <button
                        key={stream.id}
                        type="button"
                        onClick={() => setSelectedStreamId(stream.id)}
                        className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                          isSelected
                            ? 'border-slate-900 bg-slate-900/[0.02] ring-2 ring-slate-900/10 shadow-xs'
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-slate-900">{stream.name}</span>
                          <div
                            className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                              isSelected
                                ? 'bg-slate-900 border-slate-900 text-white'
                                : 'border-slate-300 bg-white'
                            }`}
                          >
                            {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                          </div>
                        </div>

                        {/* Subject Pills underneath */}
                        <div className="flex flex-wrap gap-1.5">
                          {stream.subjects.map((sub, idx) => (
                            <span
                              key={idx}
                              className={`text-[9px] font-semibold px-2 py-0.5 rounded-md border ${
                                isSelected
                                  ? 'bg-slate-100 border-slate-200 text-slate-800'
                                  : 'bg-slate-50 border-slate-200/60 text-slate-500'
                              }`}
                            >
                              {sub}
                            </span>
                          ))}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* Bottom Action Buttons */}
          <div id="reg-card-actions" className="pt-2 space-y-2.5">
            <button
              id="reg-submit-btn"
              type="submit"
              className="w-full py-3.5 px-6 rounded-2xl bg-slate-950 hover:bg-slate-900 active:scale-[0.99] text-white text-xs sm:text-sm font-extrabold shadow-lg shadow-slate-950/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <span>Complete Registration & Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              id="reg-signout-btn"
              type="button"
              onClick={onSignOut}
              className="w-full py-2.5 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-800 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </form>
      </div>

      {/* Footer Text below Card */}
      <div id="boardly-reg-footer" className="mt-5 text-center flex items-center justify-center gap-1.5 text-[11px] font-semibold text-slate-400">
        <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
        <span>Boardly Security System · Encrypted & Verified</span>
      </div>

      {/* Plan Comparison Modal */}
      {showPlanModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 border border-slate-200 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h3 className="text-base font-black text-slate-900">Compare Boardly Plans</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPlanModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              {/* Free Tier Column */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-900">Free Tier</span>
                  <span className="text-[10px] font-bold text-slate-500">Rs. 0</span>
                </div>
                <ul className="text-[11px] text-slate-600 space-y-2 font-medium">
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>2 Practice Tests / month</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>Instant step-by-step solutions</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>Track progress & score history</span>
                  </li>
                  <li className="flex items-center gap-1.5 text-slate-400 line-through">
                    <span>Full-length grand mocks</span>
                  </li>
                </ul>
              </div>

              {/* Pro Tier Column */}
              <div className="p-4 rounded-2xl border border-amber-300 bg-amber-50/40 space-y-3 relative ring-2 ring-amber-400/20">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-amber-950 flex items-center gap-1">
                    <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
                    <span>Pro Member</span>
                  </span>
                  <span className="text-[10px] font-black text-amber-900">Full Term</span>
                </div>
                <ul className="text-[11px] text-amber-900 space-y-2 font-medium">
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>Unlimited practice test builder</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>100 & 180 MCQ Grand Mock series</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>AI study buddy & weak-spot drills</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>Priority syllabus updates</span>
                  </li>
                </ul>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowPlanModal(false)}
              className="w-full py-2.5 rounded-xl bg-slate-900 text-white text-xs font-extrabold hover:bg-slate-800 transition-all cursor-pointer"
            >
              Got it, Continue Registration
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
