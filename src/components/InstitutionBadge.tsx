import React from 'react';
import { GraduationCap } from 'lucide-react';

export interface Institution {
  id: string;
  name: string;
  shortName: string;
  category: 'university' | 'college' | 'board' | 'academy';
  bgGradient: string;
  textColor: string;
  borderColor: string;
  badgeInitials: string;
  logoUrl?: string;
  description?: string;
}

export const INSTITUTIONS: Record<string, Institution> = {
  nust: {
    id: 'nust',
    name: 'National University of Sciences & Technology',
    shortName: 'NUST',
    category: 'university',
    bgGradient: 'from-[#002B49] to-[#004B87]',
    textColor: 'text-blue-400',
    borderColor: 'border-blue-500/30',
    badgeInitials: 'NUST',
    logoUrl: 'https://pub-51ccade1f191417389ac7df61830c670.r2.dev/nust-logo-png_seeklogo-234117.png',
    description: 'ECAT & NET Entry Test prep for Engineering, CS & Applied Sciences.',
  },
  fast: {
    id: 'fast',
    name: 'FAST-NUCES (Computer & Emerging Sciences)',
    shortName: 'FAST-NUCES',
    category: 'university',
    bgGradient: 'from-[#001E3D] to-[#003B73]',
    textColor: 'text-cyan-400',
    borderColor: 'border-cyan-500/30',
    badgeInitials: 'FAST',
    logoUrl: 'https://pub-51ccade1f191417389ac7df61830c670.r2.dev/Fast-University-Logo.png',
    description: 'Top CS & Software Engineering entry test specialization.',
  },
  giki: {
    id: 'giki',
    name: 'Ghulam Ishaq Khan Institute',
    shortName: 'GIKI',
    category: 'university',
    bgGradient: 'from-[#0A1330] to-[#102254]',
    textColor: 'text-blue-300',
    borderColor: 'border-blue-400/30',
    badgeInitials: 'GIKI',
    logoUrl: 'https://pub-51ccade1f191417389ac7df61830c670.r2.dev/cropped-giki-logo-updated.png',
    description: 'High-level engineering & AI technology entrance exam.',
  },
  ned: {
    id: 'ned',
    name: 'NED University of Engineering & Tech',
    shortName: 'NED',
    category: 'university',
    bgGradient: 'from-[#0F1E4A] to-[#1E3B8A]',
    textColor: 'text-blue-300',
    borderColor: 'border-blue-400/30',
    badgeInitials: 'NED',
    logoUrl: '/logos/ned.svg',
    description: 'Sindh engineering entrance exam and entry test topics.',
  },
  lums: {
    id: 'lums',
    name: 'Lahore University of Management Sciences',
    shortName: 'LUMS',
    category: 'university',
    bgGradient: 'from-[#002D62] to-[#0A4B94]',
    textColor: 'text-emerald-400',
    borderColor: 'border-emerald-500/30',
    badgeInitials: 'LUMS',
    logoUrl: '/logos/lums.svg',
    description: 'LCAT & SSE Scientific Aptitude Test prep.',
  },
  iba: {
    id: 'iba',
    name: 'Institute of Business Administration',
    shortName: 'IBA Karachi',
    category: 'university',
    bgGradient: 'from-[#0D1B3E] to-[#1E3A8A]',
    textColor: 'text-blue-300',
    borderColor: 'border-blue-400/30',
    badgeInitials: 'IBA',
    logoUrl: '/logos/iba.svg',
    description: 'Aptitude Test in Math, English & Analytical Reasoning.',
  },
  uhs: {
    id: 'uhs',
    name: 'University of Health Sciences Lahore',
    shortName: 'UHS',
    category: 'university',
    bgGradient: 'from-[#004D25] to-[#008037]',
    textColor: 'text-emerald-300',
    borderColor: 'border-emerald-400/30',
    badgeInitials: 'UHS',
    logoUrl: '/logos/uhs.png',
    description: 'Punjab MDCAT medical admissions authority.',
  },
  duhs: {
    id: 'duhs',
    name: 'Dow University of Health Sciences',
    shortName: 'DUHS',
    category: 'university',
    bgGradient: 'from-[#002855] to-[#004B87]',
    textColor: 'text-sky-300',
    borderColor: 'border-sky-400/30',
    badgeInitials: 'DUHS',
    logoUrl: '/logos/duhs.svg',
    description: 'Sindh medical & dental entry test standards.',
  },
  nums: {
    id: 'nums',
    name: 'National University of Medical Sciences',
    shortName: 'NUMS',
    category: 'university',
    bgGradient: 'from-[#003B1D] to-[#006837]',
    textColor: 'text-lime-300',
    borderColor: 'border-lime-400/30',
    badgeInitials: 'NUMS',
    logoUrl: 'https://pub-51ccade1f191417389ac7df61830c670.r2.dev/nums-logo.png',
    description: 'Army Medical College & NUMS affiliated admissions.',
  },
  kmu: {
    id: 'kmu',
    name: 'Khyber Medical University',
    shortName: 'KMU',
    category: 'university',
    bgGradient: 'from-[#004B49] to-[#007A78]',
    textColor: 'text-teal-300',
    borderColor: 'border-teal-400/30',
    badgeInitials: 'KMU',
    logoUrl: '/logos/kmu.svg',
    description: 'KPK MDCAT entrance test curriculum.',
  },
  szabmu: {
    id: 'szabmu',
    name: 'SZAB Medical University Islamabad',
    shortName: 'SZABMU',
    category: 'university',
    bgGradient: 'from-[#1A3A2A] to-[#2D5A42]',
    textColor: 'text-blue-300',
    borderColor: 'border-blue-400/30',
    badgeInitials: 'SZABMU',
    logoUrl: '/logos/szabmu.svg',
    description: 'Federal Territory Medical entrance test standard.',
  },
  fbise: {
    id: 'fbise',
    name: 'Board Examinations (Classes 9-12)',
    shortName: 'Board Exams',
    category: 'board',
    bgGradient: 'from-[#064E3B] to-[#047857]',
    textColor: 'text-emerald-400',
    borderColor: 'border-emerald-500/30',
    badgeInitials: 'BOARDS',
    logoUrl: 'https://pub-51ccade1f191417389ac7df61830c670.r2.dev/file_00000000aa9c8208899ee0e0e9a1a513.png',
    description: 'Board Examinations & Curriculum Islamabad & Nationwide.',
  },
  pmdc: {
    id: 'pmdc',
    name: 'Pakistan Medical & Dental Council (PMDC)',
    shortName: 'PMDC MDCAT',
    category: 'university',
    bgGradient: 'from-[#0A1330] to-[#1E5AFF]/40',
    textColor: 'text-blue-400',
    borderColor: 'border-blue-500/30',
    badgeInitials: 'PMDC',
    logoUrl: 'https://pub-51ccade1f191417389ac7df61830c670.r2.dev/PMDC%20Logo-Green.png',
    description: 'Official PMDC MDCAT medical entry test authority.',
  },
  uet: {
    id: 'uet',
    name: 'University of Engineering and Technology (UET Taxila)',
    shortName: 'UET TCAT',
    category: 'university',
    bgGradient: 'from-[#0F172A] to-[#082F49]',
    textColor: 'text-cyan-400',
    borderColor: 'border-cyan-500/30',
    badgeInitials: 'UET',
    logoUrl: 'https://pub-51ccade1f191417389ac7df61830c670.r2.dev/logo-2.png',
    description: 'Official UET Taxila TCAT engineering entry test authority.',
  },
  apsacs: {
    id: 'apsacs',
    name: 'Army Public Schools & Colleges (APSACS)',
    shortName: 'APSACS',
    category: 'college',
    bgGradient: 'from-[#0A1330] to-[#1E5AFF]/40',
    textColor: 'text-blue-400',
    borderColor: 'border-blue-400/30',
    badgeInitials: 'APS',
    logoUrl: 'https://pub-51ccade1f191417389ac7df61830c670.r2.dev/file_000000000c0c82088a7c46700ba17bd5.png',
    description: 'Federal Board SSC & HSSC excellence network.',
  },
  fgc: {
    id: 'fgc',
    name: 'FG Colleges Islamabad',
    shortName: 'FG Colleges',
    category: 'college',
    bgGradient: 'from-[#0B3C42] to-[#145C66]',
    textColor: 'text-teal-200',
    borderColor: 'border-teal-400/30',
    badgeInitials: 'FGC',
    logoUrl: 'https://pub-51ccade1f191417389ac7df61830c670.r2.dev/file_0000000016248208870342fb6e403b94.png',
    description: 'Federal Government Institutions across Pakistan.',
  },
  opf: {
    id: 'opf',
    name: 'OPF Girls & Boys Colleges',
    shortName: 'OPF Colleges',
    category: 'college',
    bgGradient: 'from-[#1B263B] to-[#2E4057]',
    textColor: 'text-blue-300',
    borderColor: 'border-blue-400/30',
    badgeInitials: 'OPF',
    logoUrl: '/logos/opf.png',
    description: 'Overseas Pakistanis Foundation educational system.',
  },
  kips: {
    id: 'kips',
    name: 'KIPS & STEP Prep Centers',
    shortName: 'KIPS / STEP',
    category: 'academy',
    bgGradient: 'from-[#0D1B3E] to-[#1E3A8A]',
    textColor: 'text-blue-300',
    borderColor: 'border-blue-400/30',
    badgeInitials: 'KIPS',
    logoUrl: 'https://pub-51ccade1f191417389ac7df61830c670.r2.dev/file_00000000ca3482089810078834ca4bd2.png',
    description: 'Leading entry test preparation academies in Pakistan.',
  },
  pgc: {
    id: 'pgc',
    name: 'Punjab Group of Colleges & Cadet Colleges',
    shortName: 'PGC & Cadet',
    category: 'college',
    bgGradient: 'from-[#0A1330] to-[#1E5AFF]/40',
    textColor: 'text-blue-300',
    borderColor: 'border-blue-400/30',
    badgeInitials: 'PGC',
    logoUrl: '/logos/pgc.png',
    description: 'Intermediate position holders and board toppers network.',
  },
  step: {
    id: 'step',
    name: 'STEP Prep (Punjab Group of Colleges)',
    shortName: 'STEP Prep',
    category: 'academy',
    bgGradient: 'from-[#0A1330] to-[#1E3B8A]',
    textColor: 'text-blue-400',
    borderColor: 'border-blue-500/30',
    badgeInitials: 'STEP',
    logoUrl: '/logos/step.png',
    description: 'Premier entry test preparation network by PGC.',
  },
};

interface InstitutionBadgeProps {
  id: string;
  size?: 'sm' | 'md' | 'lg';
  showFullName?: boolean;
  className?: string;
  onClick?: () => void;
  selected?: boolean;
}

export const InstitutionBadge: React.FC<InstitutionBadgeProps> = ({
  id,
  size = 'md',
  showFullName = false,
  className = '',
  onClick,
  selected = false,
}) => {
  const [imgError, setImgError] = React.useState(false);

  const inst = INSTITUTIONS[id.toLowerCase()] || {
    id,
    name: id.toUpperCase(),
    shortName: id.toUpperCase(),
    category: 'university' as const,
    bgGradient: 'from-[#1A1A1A] to-[#2A2A2A]',
    textColor: 'text-blue-400',
    borderColor: 'border-white/10',
    badgeInitials: id.slice(0, 4).toUpperCase(),
  };

  const sizeClasses = {
    sm: {
      badge: 'w-6 h-6 text-[10px]',
      container: 'px-2.5 py-1 text-xs',
    },
    md: {
      badge: 'w-7.5 h-7.5 text-xs',
      container: 'px-3 py-1.5 text-xs sm:text-sm',
    },
    lg: {
      badge: 'w-9 h-9 text-sm',
      container: 'px-4 py-2 text-sm sm:text-base',
    },
  }[size];

  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-xl bg-gradient-to-r ${inst.bgGradient} border ${
        selected ? 'border-[#1E5AFF] ring-2 ring-[#1E5AFF]/30' : inst.borderColor
      } ${sizeClasses.container} shadow-sm transition-all duration-200 max-w-full ${
        onClick ? 'cursor-pointer hover:scale-[1.02] active:scale-[0.98]' : ''
      } ${className}`}
    >
      <div
        className={`${sizeClasses.badge} rounded-lg bg-black/40 border border-white/20 p-0.5 flex items-center justify-center shrink-0 shadow-inner overflow-hidden`}
      >
        {inst.logoUrl && !imgError ? (
          <img
            src={inst.logoUrl}
            alt={`${inst.name} Logo`}
            className="w-full h-full object-contain"
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
          />
        ) : (
          <span className={`font-black tracking-tighter ${inst.textColor}`}>
            {inst.badgeInitials}
          </span>
        )}
      </div>
      <span className={`font-bold tracking-tight text-white min-w-0 break-words leading-tight ${size === 'sm' ? 'text-xs' : ''}`}>
        {showFullName ? inst.name : inst.shortName}
      </span>
    </div>
  );
};

export function renderTargetUniversityBadge(targetUniStr?: string, size: 'sm' | 'md' = 'sm', onClick?: () => void) {
  const uni = (targetUniStr || '').trim();
  if (!uni) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`inline-flex items-center gap-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-700  px-3 py-1 rounded-full text-xs font-extrabold border border-blue-500/30 transition-all ${
          onClick ? 'cursor-pointer hover:scale-[1.02] active:scale-[0.98]' : ''
        }`}
        title="Click to select your Target University"
      >
        <GraduationCap className="w-3.5 h-3.5 text-blue-500" />
        <span>Target University Not Specified</span>
        {onClick && (
          <span className="text-[10px] bg-[#1E5AFF] text-white font-black px-1.5 py-0.5 rounded-md ml-1">
            Tap to Select
          </span>
        )}
      </button>
    );
  }

  const lower = uni.toLowerCase();
  let instId: string | null = null;
  if (lower.includes('nust')) instId = 'nust';
  else if (lower.includes('fast')) instId = 'fast';
  else if (lower.includes('giki')) instId = 'giki';
  else if (lower.includes('uhs') || lower.includes('pmdc') || lower.includes('mdcat')) instId = 'uhs';
  else if (lower.includes('lums')) instId = 'lums';
  else if (lower.includes('uet') || lower.includes('tcat')) instId = 'uet';
  else if (lower.includes('nums')) instId = 'nums';
  else if (lower.includes('szabmu')) instId = 'szabmu';
  else if (lower.includes('ned')) instId = 'ned';
  else if (lower.includes('iba')) instId = 'iba';
  else if (lower.includes('duhs') || lower.includes('dow')) instId = 'duhs';
  else if (lower.includes('kmu') || lower.includes('khyber')) instId = 'kmu';

  if (instId && INSTITUTIONS[instId]) {
    return <InstitutionBadge id={instId} size={size} showFullName onClick={onClick} />;
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 bg-slate-900 text-white   px-3.5 py-1 rounded-full text-xs font-extrabold border border-blue-500/30 shadow-xs ${
        onClick ? 'cursor-pointer hover:scale-[1.02] active:scale-[0.98]' : ''
      }`}
    >
      <GraduationCap className="w-3.5 h-3.5 text-blue-400" />
      <span>{uni}</span>
    </button>
  );
}
