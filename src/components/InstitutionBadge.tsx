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
    logoUrl: '/logos/academic/nust.png',
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
    logoUrl: '/logos/academic/fast.png',
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
    logoUrl: '/logos/academic/giki.png',
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
    logoUrl: '/logos/academic/ned.png',
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
    logoUrl: '/logos/academic/lums.png',
    description: 'LCAT & SSE Scientific Aptitude Test prep.',
  },
  pieas: {
    id: 'pieas',
    name: 'Pakistan Institute of Engineering & Applied Sciences',
    shortName: 'PIEAS',
    category: 'university',
    bgGradient: 'from-[#0A1330] to-[#1E3A8A]',
    textColor: 'text-blue-300',
    borderColor: 'border-blue-400/30',
    badgeInitials: 'PIEAS',
    logoUrl: '/logos/academic/pieas.png',
    description: 'Premier engineering and applied sciences admissions.',
  },
  comsats: {
    id: 'comsats',
    name: 'COMSATS University Islamabad',
    shortName: 'COMSATS',
    category: 'university',
    bgGradient: 'from-[#062419] to-[#006A4E]',
    textColor: 'text-emerald-300',
    borderColor: 'border-emerald-400/30',
    badgeInitials: 'COMSATS',
    logoUrl: '/logos/academic/comsats.png',
    description: 'NTS NAT portal for engineering, computing and sciences.',
  },
  nat: {
    id: 'nat',
    name: 'NTS National Aptitude Test (NAT / COMSATS)',
    shortName: 'NTS NAT',
    category: 'board',
    bgGradient: 'from-[#062419] to-[#006A4E]',
    textColor: 'text-emerald-300',
    borderColor: 'border-emerald-400/30',
    badgeInitials: 'NAT',
    logoUrl: '/logos/academic/comsats.png',
    description: 'Shared admission test for COMSATS, Air, Bahria, IIUI, and IST.',
  },
  hitec: {
    id: 'hitec',
    name: 'HITEC University Taxila',
    shortName: 'HITEC',
    category: 'university',
    bgGradient: 'from-[#3A1408] to-[#7C2D12]',
    textColor: 'text-orange-300',
    borderColor: 'border-orange-400/30',
    badgeInitials: 'HITEC',
    logoUrl: '/logos/academic/hitec.png',
    description: 'Heavy Industries Taxila Education City university entrance.',
  },
  nutech: {
    id: 'nutech',
    name: 'National University of Technology',
    shortName: 'NUTECH',
    category: 'university',
    bgGradient: 'from-[#06301A] to-[#14532D]',
    textColor: 'text-emerald-300',
    borderColor: 'border-emerald-400/30',
    badgeInitials: 'NUTECH',
    logoUrl: '/logos/academic/nutech.png',
    description: 'NUTECH Entry Test (NUET) for engineering and computing.',
  },
  muet: {
    id: 'muet',
    name: 'Mehran University of Engineering and Technology (MUET)',
    shortName: 'MUET',
    category: 'university',
    bgGradient: 'from-[#3A0A14] to-[#800020]',
    textColor: 'text-rose-300',
    borderColor: 'border-rose-400/30',
    badgeInitials: 'MUET',
    logoUrl: '/logos/academic/muet.png',
    description: 'Pre-admission test for Sindh engineering and technology.',
  },
  mehran: {
    id: 'muet',
    name: 'Mehran University of Engineering and Technology (MUET Jamshoro)',
    shortName: 'MUET Jamshoro',
    category: 'university',
    bgGradient: 'from-[#3A0A14] to-[#800020]',
    textColor: 'text-rose-300',
    borderColor: 'border-rose-400/30',
    badgeInitials: 'MUET',
    logoUrl: '/logos/academic/muet.png',
    description: 'Pre-admission test for Sindh engineering and technology.',
  },
  iba: {
    id: 'iba',
    name: 'Institute of Business Administration (IBA)',
    shortName: 'IBA Karachi',
    category: 'university',
    bgGradient: 'from-[#0D1B3E] to-[#1E3A8A]',
    textColor: 'text-blue-300',
    borderColor: 'border-blue-400/30',
    badgeInitials: 'IBA',
    logoUrl: '/logos/academic/iba.png',
    description: 'Aptitude Test in Math, English & Analytical Reasoning.',
  },
  'iba-karachi': {
    id: 'iba',
    name: 'Institute of Business Administration (IBA Karachi)',
    shortName: 'IBA Karachi',
    category: 'university',
    bgGradient: 'from-[#0D1B3E] to-[#1E3A8A]',
    textColor: 'text-blue-300',
    borderColor: 'border-blue-400/30',
    badgeInitials: 'IBA',
    logoUrl: '/logos/academic/iba.png',
    description: 'Aptitude Test in Math, English & Analytical Reasoning.',
  },
  aku: {
    id: 'aku',
    name: 'Aga Khan University (AKU) Medical College',
    shortName: 'AKU Medical',
    category: 'university',
    bgGradient: 'from-[#003B23] to-[#005A36]',
    textColor: 'text-emerald-300',
    borderColor: 'border-emerald-400/30',
    badgeInitials: 'AKU',
    logoUrl: '/logos/academic/aku.png',
    description: 'Premier MBBS & health sciences entrance test.',
  },
  agakhan: {
    id: 'aku',
    name: 'Aga Khan University (AKU) Medical College',
    shortName: 'AKU Medical',
    category: 'university',
    bgGradient: 'from-[#003B23] to-[#005A36]',
    textColor: 'text-emerald-300',
    borderColor: 'border-emerald-400/30',
    badgeInitials: 'AKU',
    logoUrl: '/logos/academic/aku.png',
    description: 'Premier MBBS & health sciences entrance test.',
  },
  'aga-khan': {
    id: 'aku',
    name: 'Aga Khan University (AKU) Medical College',
    shortName: 'AKU Medical',
    category: 'university',
    bgGradient: 'from-[#003B23] to-[#005A36]',
    textColor: 'text-emerald-300',
    borderColor: 'border-emerald-400/30',
    badgeInitials: 'AKU',
    logoUrl: '/logos/academic/aku.png',
    description: 'Premier MBBS & health sciences entrance test.',
  },
  numl: {
    id: 'numl',
    name: 'National University of Modern Languages',
    shortName: 'NUML',
    category: 'university',
    bgGradient: 'from-[#0C3D4D] to-[#155E75]',
    textColor: 'text-cyan-300',
    borderColor: 'border-cyan-400/30',
    badgeInitials: 'NUML',
    logoUrl: '/logos/academic/numl.png',
    description: 'Undergraduate computing, languages & management sciences entrance test.',
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
    logoUrl: '/logos/academic/uhs.png',
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
    logoUrl: '/logos/academic/nums.png',
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
    name: 'FBISE Examinations (Classes 9-12)',
    shortName: 'FBISE',
    category: 'board',
    bgGradient: 'from-[#064E3B] to-[#047857]',
    textColor: 'text-emerald-400',
    borderColor: 'border-emerald-500/30',
    badgeInitials: 'FBISE',
    logoUrl: '/logos/academic/fbise.png',
    description: 'FBISE Examinations & Curriculum Islamabad & Nationwide.',
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
    logoUrl: '/logos/academic/pmdc.png',
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
    badgeInitials: 'TCAT',
    logoUrl: '/logos/academic/uet-taxila.png',
    description: 'Official UET Taxila TCAT engineering entry test authority.',
  },
  'uet-taxila': {
    id: 'uet-taxila',
    name: 'University of Engineering and Technology (UET Taxila)',
    shortName: 'UET TCAT',
    category: 'university',
    bgGradient: 'from-[#0F172A] to-[#082F49]',
    textColor: 'text-cyan-400',
    borderColor: 'border-cyan-500/30',
    badgeInitials: 'TCAT',
    logoUrl: '/logos/academic/uet-taxila.png',
    description: 'Official UET Taxila TCAT engineering entry test authority.',
  },
  ecat: {
    id: 'ecat',
    name: 'UET Lahore (ECAT)',
    shortName: 'UET ECAT',
    category: 'university',
    bgGradient: 'from-[#0B1E48] to-[#173F8A]',
    textColor: 'text-blue-400',
    borderColor: 'border-blue-500/30',
    badgeInitials: 'ECAT',
    logoUrl: '/logos/academic/uet-taxila.png',
    description: 'Official Combined Engineering Entrance Test (ECAT) for Punjab engineering institutions.',
  },
  etea: {
    id: 'etea',
    name: 'UET Peshawar (ETEA Engineering)',
    shortName: 'ETEA',
    category: 'university',
    bgGradient: 'from-[#042F2E] to-[#115E59]',
    textColor: 'text-teal-300',
    borderColor: 'border-teal-400/30',
    badgeInitials: 'ETEA',
    logoUrl: '/logos/academic/uet-peshawar.png',
    description: 'Educational Testing and Evaluation Agency (ETEA) engineering test for KPK.',
  },
  usat: {
    id: 'usat',
    name: 'Higher Education Commission (HEC USAT)',
    shortName: 'HEC USAT',
    category: 'board',
    bgGradient: 'from-[#1E1B4B] to-[#3730A3]',
    textColor: 'text-indigo-300',
    borderColor: 'border-indigo-400/30',
    badgeInitials: 'USAT',
    logoUrl: '/logos/academic/hec-usat.png',
    description: 'Higher Education Commission Undergraduate Studies Admission Test.',
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
    logoUrl: '/logos/academic/aps.png',
    description: 'FBISE SSC & HSSC excellence network.',
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
    logoUrl: '/logos/academic/fgc.png',
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
  const normKey = (id || '').toLowerCase().trim();
  const inst = INSTITUTIONS[normKey] || {
    id,
    name: id.toUpperCase(),
    shortName: id.toUpperCase(),
    category: 'university' as const,
    bgGradient: 'from-[#1A1A1A] to-[#2A2A2A]',
    textColor: 'text-blue-400',
    borderColor: 'border-white/10',
    badgeInitials: id.slice(0, 4).toUpperCase(),
  };

  const canonicalId = inst.id ? inst.id.toLowerCase() : normKey;
  const primaryLogo = inst.logoUrl || `/logos/${canonicalId}.png`;
  const [currentSrc, setCurrentSrc] = React.useState<string | undefined>(primaryLogo);
  const [imgError, setImgError] = React.useState(false);
  const [retryAttempt, setRetryAttempt] = React.useState(0);

  React.useEffect(() => {
    const nextLogo = inst.logoUrl || `/logos/${canonicalId}.png`;
    setCurrentSrc(nextLogo);
    setImgError(false);
    setRetryAttempt(0);
  }, [id, canonicalId, inst.logoUrl]);

  const handleImageError = () => {
    if (retryAttempt === 0) {
      setRetryAttempt(1);
      setCurrentSrc(`/logos/academic/${canonicalId}.png`);
    } else if (retryAttempt === 1) {
      setRetryAttempt(2);
      setCurrentSrc(`/logos/${canonicalId}.svg`);
    } else {
      setImgError(true);
    }
  };

  const sizeClasses = {
    sm: {
      badge: 'w-6 h-6 text-[10px]',
      container: 'px-2.5 py-1 text-xs',
      dim: 24,
    },
    md: {
      badge: 'w-7.5 h-7.5 text-xs',
      container: 'px-3 py-1.5 text-xs sm:text-sm',
      dim: 30,
    },
    lg: {
      badge: 'w-9 h-9 text-sm',
      container: 'px-4 py-2 text-sm sm:text-base',
      dim: 36,
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
        {currentSrc && !imgError ? (
          <img
            key={`${canonicalId}-${retryAttempt}`}
            src={currentSrc}
            alt={`${inst.name} Logo`}
            width={sizeClasses.dim}
            height={sizeClasses.dim}
            loading="eager"
            style={{ objectFit: 'contain' }}
            className="w-full h-full object-contain"
            onError={handleImageError}
          />
        ) : (
          <GraduationCap className="w-3.5 h-3.5 text-white/80 shrink-0" />
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
  else if (lower.includes('pieas')) instId = 'pieas';
  else if (lower.includes('comsats') || lower.includes('cui')) instId = 'comsats';
  else if (lower.includes('usat')) instId = 'usat';
  else if (lower.includes('hitec')) instId = 'hitec';
  else if (lower.includes('nutech')) instId = 'nutech';
  else if (lower.includes('muet') || lower.includes('mehran')) instId = 'muet';
  else if (lower.includes('iba')) instId = 'iba';
  else if (lower.includes('aku') || lower.includes('aga khan')) instId = 'aku';
  else if (lower.includes('numl')) instId = 'numl';
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

export interface ExamTrackLogoProps {
  id: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  altText?: string;
}

export const ExamTrackLogo: React.FC<ExamTrackLogoProps> = ({
  id,
  size = 'xl',
  className = '',
  altText,
}) => {
  const normKey = (id || '').toLowerCase().trim();
  const inst = INSTITUTIONS[normKey] || {
    id,
    name: id.toUpperCase(),
    shortName: id.toUpperCase(),
    category: 'university' as const,
    bgGradient: '',
    textColor: 'text-slate-700',
    borderColor: '',
    badgeInitials: id.slice(0, 4).toUpperCase(),
  };

  const canonicalId = (() => {
    if (normKey === 'uet-taxila' || normKey === 'tcat') return 'uet-taxila';
    if (normKey === 'ecat') return 'uet-taxila';
    if (normKey === 'etea') return 'uet-peshawar';
    if (normKey === 'usat' || normKey === 'hec-usat' || normKey === 'hec usat') return 'usat';
    if (normKey === 'nat') return 'nat';
    if (normKey === 'pmdc') return 'pmdc';
    if (normKey === 'fbise') return 'fbise';
    if (normKey === 'nums') return 'nums';
    if (normKey === 'aku' || normKey === 'agakhan' || normKey === 'aga-khan') return 'aku';
    if (normKey === 'iba' || normKey === 'iba-karachi') return 'iba';
    if (normKey === 'muet' || normKey === 'mehran') return 'muet';
    if (normKey === 'lums') return 'lums';
    if (normKey === 'nust') return 'nust';
    if (normKey === 'fast') return 'fast';
    if (normKey === 'giki') return 'giki';
    if (normKey === 'ned') return 'ned';
    if (normKey === 'pieas') return 'pieas';
    if (normKey === 'numl') return 'numl';
    if (normKey === 'hitec') return 'hitec';
    if (normKey === 'nutech') return 'nutech';
    return inst.id ? inst.id.toLowerCase() : normKey;
  })();

  const primaryLogo = inst.logoUrl || `/logos/${canonicalId}.png`;
  const [currentSrc, setCurrentSrc] = React.useState<string | undefined>(primaryLogo);
  const [imgError, setImgError] = React.useState(false);
  const [retryAttempt, setRetryAttempt] = React.useState(0);

  React.useEffect(() => {
    const nextLogo = inst.logoUrl || `/logos/${canonicalId}.png`;
    setCurrentSrc(nextLogo);
    setImgError(false);
    setRetryAttempt(0);
  }, [id, canonicalId, inst.logoUrl]);

  const handleImageError = () => {
    if (retryAttempt === 0) {
      setRetryAttempt(1);
      setCurrentSrc(`/logos/academic/${canonicalId}.png`);
    } else if (retryAttempt === 1) {
      setRetryAttempt(2);
      setCurrentSrc(`/logos/${canonicalId}.svg`);
    } else {
      setImgError(true);
    }
  };

  const sizeClasses = {
    sm: 'w-7 h-7',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-14 h-14 sm:w-16 sm:h-16 md:w-18 md:h-18',
    '2xl': 'w-20 h-20 sm:w-24 sm:h-24',
  }[size];

  const displayName = altText || inst.name || id.toUpperCase();

  return (
    <div
      className={`relative shrink-0 flex items-center justify-center select-none bg-transparent ${sizeClasses} ${className}`}
      title={displayName}
    >
      {currentSrc && !imgError ? (
        <img
          key={`${canonicalId}-${retryAttempt}`}
          src={currentSrc}
          alt={displayName}
          loading="eager"
          style={{ objectFit: 'contain' }}
          className="w-full h-full object-contain filter drop-shadow-xs transition-transform duration-200"
          onError={handleImageError}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center rounded-2xl bg-slate-100 border border-slate-200">
          <GraduationCap className="w-6 h-6 text-indigo-500" />
        </div>
      )}
    </div>
  );
};

