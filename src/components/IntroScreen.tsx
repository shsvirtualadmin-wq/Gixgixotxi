import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { StudyBuddyFormattedMessage } from './StudyBuddyFormattedMessage';
import {
  History,
  Users,
  Sparkles,
  GraduationCap,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Target,
  Bot,
  Shield,
  ShieldCheck,
  Lock,
  FileText,
  Quote,
  Heart,
  Award,
  Star,
  CreditCard,
  Eye,
  Trash2,
  HelpCircle,
  X,
  Zap,
  Globe,
  ChevronUp,
  ChevronDown,
  Menu,
  Check,
  BarChart3,
  Building2,
  DollarSign,
  Brain,
  MessageCircle,
  ExternalLink,
  Layers,
} from 'lucide-react';
import { fetchStudentCountFromSupabase } from '../lib/supabase';
import { InstitutionBadge, INSTITUTIONS } from './InstitutionBadge';
import { useLogosReady } from '../lib/logoPreloader';
import { useSlidingPill } from '../hooks/useSlidingPill';
import { useCountUp } from '../hooks/useCountUp';
import { AnimatedCounter } from './AnimatedCounter';
import { LazySection } from './LazySection';
import { triggerHaptic, HAPTIC_PATTERNS } from '../lib/haptics';

interface IntroScreenProps {
  onContinue: () => void;
  onOpenCommunity: () => void;
  onOpenHistory: () => void;
  onOpenLmsPortal: () => void;
  onOpenStudyBuddy?: () => void;
  historyCount: number;
  onSelectGradesFlow?: () => void;
  onSelectMdcat?: () => void;
  onSelectTcat?: () => void;
  onSelectEntranceTrack?: (track: string) => void;
}

// ---------------------------------------------------------------------------
// High-Performance Motion Animation Components
// ---------------------------------------------------------------------------

const ScrollFadeInCard: React.FC<{
  children: React.ReactNode;
  delayIndex?: number;
  className?: string;
}> = React.memo(({ children, delayIndex = 0, className = '' }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 25 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{
        duration: 0.35,
        delay: Math.min(delayIndex * 0.04, 0.2),
        ease: [0.16, 1, 0.3, 1],
      }}
      whileHover={{ y: -6, transition: { duration: 0.2 } }}
      className={className}
    >
      {children}
    </motion.div>
  );
});

const AnimatedStatCard: React.FC<{
  targetValue: number;
  label: string;
  midCountFn?: (val: number) => string;
  finalDisplay: string;
  duration?: number;
}> = React.memo(({ targetValue, label, midCountFn, finalDisplay, duration = 1300 }) => {
  const { ref, displayString } = useCountUp({
    end: targetValue,
    duration,
    finalDisplay,
    formattingFn: (val, isComplete) => {
      if (isComplete) return finalDisplay;
      if (midCountFn) return midCountFn(val);
      return Math.round(val).toLocaleString();
    },
    triggerOnView: true,
    rootMargin: '100px',
    threshold: 0.01,
  });

  return (
    <motion.div
      ref={ref}
      whileHover={{ y: -4, scale: 1.02, transition: { duration: 0.2 } }}
      className="bg-slate-50 border border-dashed border-slate-300 rounded-2xl p-3.5 text-center relative overflow-hidden group hover:border-[#1E5AFF]/80 hover:shadow-lg hover:shadow-[#1E5AFF]/10 transition-all duration-200 cursor-default"
    >
      <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white border-r border-slate-300" />
      <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white border-l border-slate-300" />
      <span className="font-['Space_Grotesk'] font-black text-xl sm:text-2xl text-[#1E5AFF] block leading-tight tabular-nums">
        {displayString}
      </span>
      <span className="text-[11px] font-semibold text-slate-600">
        {label}
      </span>
    </motion.div>
  );
});

const AnimatedTableRow: React.FC<{
  children: React.ReactNode;
  delayIndex: number;
}> = React.memo(({ children, delayIndex }) => {
  return (
    <motion.tr
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.01 }}
      transition={{
        duration: 0.35,
        delay: Math.min(delayIndex * 0.04, 0.2),
        ease: [0.16, 1, 0.3, 1],
      }}
      className="hover:bg-slate-50  transition-colors"
    >
      {children}
    </motion.tr>
  );
});

const TypewriterChatPreview: React.FC<{ fullText: string }> = React.memo(({ fullText }) => {
  const [progress, setProgress] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let animationFrameId: number;
    let startTime: number | null = null;
    const duration = 2000;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsTyping(true);

          const step = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const elapsed = timestamp - startTime;
            const p = Math.min((elapsed / duration) * 100, 100);
            setProgress(p);

            if (p < 100) {
              animationFrameId = requestAnimationFrame(step);
            } else {
              setIsTyping(false);
            }
          };

          animationFrameId = requestAnimationFrame(step);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      observer.disconnect();
    };
  }, [fullText]);

  return (
    <div ref={ref} className="relative">
      <div
        style={{
          clipPath: progress >= 100 ? 'none' : `inset(0 ${100 - progress}% 0 0)`,
        }}
      >
        <StudyBuddyFormattedMessage content={fullText} />
      </div>
      {isTyping && (
        <motion.span
          animate={{ opacity: [1, 0, 1] }}
          transition={{ repeat: Infinity, duration: 0.5 }}
          className="inline-block w-2 h-4 bg-[#1E5AFF] ml-1 align-middle rounded-xs shadow-xs shadow-[#1E5AFF]"
        />
      )}
    </div>
  );
});

interface TrustedInstitution {
  id: string;
  name: string;
  shortName: string;
  localLogoUrl: string;
  remoteLogoUrl: string;
  fallbackInitials: string;
}

const TRUSTED_INSTITUTIONS_MARQUEE: TrustedInstitution[] = [
  {
    id: 'fbise',
    name: 'FBISE',
    shortName: 'FBISE',
    localLogoUrl: '/logos/academic/fbise.png',
    remoteLogoUrl: 'https://pub-51ccade1f191417389ac7df61830c670.r2.dev/file_00000000aa9c8208899ee0e0e9a1a513.png',
    fallbackInitials: 'FBISE',
  },
  {
    id: 'uet-peshawar',
    name: 'UET Peshawar',
    shortName: 'UET Peshawar',
    localLogoUrl: '/logos/academic/uet-peshawar.png',
    remoteLogoUrl: 'https://pub-51ccade1f191417389ac7df61830c670.r2.dev/uet-02.png',
    fallbackInitials: 'UETP',
  },
  {
    id: 'uet-taxila',
    name: 'UET Taxila',
    shortName: 'UET Taxila',
    localLogoUrl: '/logos/academic/uet-taxila.png',
    remoteLogoUrl: 'https://pub-51ccade1f191417389ac7df61830c670.r2.dev/logo-2.png',
    fallbackInitials: 'UETT',
  },
  {
    id: 'nums',
    name: 'NUMS',
    shortName: 'NUMS',
    localLogoUrl: '/logos/academic/nums.png',
    remoteLogoUrl: 'https://pub-51ccade1f191417389ac7df61830c670.r2.dev/nums-logo.png',
    fallbackInitials: 'NUMS',
  },
  {
    id: 'nust',
    name: 'NUST',
    shortName: 'NUST',
    localLogoUrl: '/logos/academic/nust.png',
    remoteLogoUrl: 'https://pub-51ccade1f191417389ac7df61830c670.r2.dev/nust-logo-png_seeklogo-234117.png',
    fallbackInitials: 'NUST',
  },
  {
    id: 'aps',
    name: 'Army Public School (APS)',
    shortName: 'APS (Army Public School)',
    localLogoUrl: '/logos/academic/aps.png',
    remoteLogoUrl: 'https://pub-51ccade1f191417389ac7df61830c670.r2.dev/file_000000000c0c82088a7c46700ba17bd5.png',
    fallbackInitials: 'APS',
  },
  {
    id: 'qau',
    name: 'Quaid-i-Azam University (QAU)',
    shortName: 'QAU (Quaid-i-Azam)',
    localLogoUrl: '/logos/academic/qau.png',
    remoteLogoUrl: 'https://pub-51ccade1f191417389ac7df61830c670.r2.dev/file_000000007cec8208ba576fe1db5a4e93.png',
    fallbackInitials: 'QAU',
  },
  {
    id: 'fazaia',
    name: 'Fazaia',
    shortName: 'Fazaia',
    localLogoUrl: '/logos/academic/fazaia.png',
    remoteLogoUrl: 'https://pub-51ccade1f191417389ac7df61830c670.r2.dev/images%20(1).jpeg',
    fallbackInitials: 'PAF',
  },
  {
    id: 'giki',
    name: 'GIKI',
    shortName: 'GIKI',
    localLogoUrl: '/logos/academic/giki.png',
    remoteLogoUrl: 'https://pub-51ccade1f191417389ac7df61830c670.r2.dev/cropped-giki-logo-updated.png',
    fallbackInitials: 'GIKI',
  },
  {
    id: 'pmdc',
    name: 'PMDC (MDCAT)',
    shortName: 'PMDC (MDCAT)',
    localLogoUrl: '/logos/academic/pmdc.png',
    remoteLogoUrl: 'https://pub-51ccade1f191417389ac7df61830c670.r2.dev/PMDC%20Logo-Green.png',
    fallbackInitials: 'PMDC',
  },
  {
    id: 'fast',
    name: 'FAST University',
    shortName: 'FAST University',
    localLogoUrl: '/logos/academic/fast.png',
    remoteLogoUrl: 'https://pub-51ccade1f191417389ac7df61830c670.r2.dev/Fast-University-Logo.png',
    fallbackInitials: 'FAST',
  },
  {
    id: 'fgc',
    name: 'FG College',
    shortName: 'FG College',
    localLogoUrl: '/logos/academic/fgc.png',
    remoteLogoUrl: 'https://pub-51ccade1f191417389ac7df61830c670.r2.dev/file_0000000016248208870342fb6e403b94.png',
    fallbackInitials: 'FGC',
  },
  {
    id: 'stem',
    name: 'STEM Education',
    shortName: 'STEM Education',
    localLogoUrl: '/logos/academic/stem.png',
    remoteLogoUrl: 'https://pub-51ccade1f191417389ac7df61830c670.r2.dev/file_00000000e5188208a03e6fe07eeef99c.png',
    fallbackInitials: 'STEM',
  },
  {
    id: 'kips',
    name: 'KIPS',
    shortName: 'KIPS',
    localLogoUrl: '/logos/academic/kips.png',
    remoteLogoUrl: 'https://pub-51ccade1f191417389ac7df61830c670.r2.dev/file_00000000ca3482089810078834ca4bd2.png',
    fallbackInitials: 'KIPS',
  },
  {
    id: 'pieas',
    name: 'PIEAS Islamabad',
    shortName: 'PIEAS',
    localLogoUrl: '/logos/academic/pieas.png',
    remoteLogoUrl: 'https://pub-51ccade1f191417389ac7df61830c670.r2.dev/Logos/file_00000000748c8211bb5e3cfb31849396.png',
    fallbackInitials: 'PIEAS',
  },
  {
    id: 'usat',
    name: 'HEC USAT',
    shortName: 'HEC USAT',
    localLogoUrl: '/logos/academic/hec-usat.png',
    remoteLogoUrl: 'https://pub-51ccade1f191417389ac7df61830c670.r2.dev/Logos/file_00000000175082118793959c6c498063.png',
    fallbackInitials: 'USAT',
  },
  {
    id: 'lums',
    name: 'LUMS Lahore',
    shortName: 'LUMS',
    localLogoUrl: '/logos/academic/lums.png',
    remoteLogoUrl: 'https://pub-51ccade1f191417389ac7df61830c670.r2.dev/Logos/file_00000000f29c8211bbac0ae9800006de.png',
    fallbackInitials: 'LUMS',
  },
  {
    id: 'comsats',
    name: 'COMSATS University',
    shortName: 'COMSATS',
    localLogoUrl: '/logos/academic/comsats.png',
    remoteLogoUrl: 'https://pub-51ccade1f191417389ac7df61830c670.r2.dev/Logos/file_000000008a848208ad6e5ff38e3d1998.png',
    fallbackInitials: 'CUI',
  },
  {
    id: 'hitec',
    name: 'HITEC University Taxila',
    shortName: 'HITEC',
    localLogoUrl: '/logos/academic/hitec.png',
    remoteLogoUrl: 'https://pub-51ccade1f191417389ac7df61830c670.r2.dev/Logos/file_0000000011a08208bd16b443318357b1.png',
    fallbackInitials: 'HITEC',
  },
  {
    id: 'nutech',
    name: 'NUTECH Islamabad',
    shortName: 'NUTECH',
    localLogoUrl: '/logos/academic/nutech.png',
    remoteLogoUrl: 'https://pub-51ccade1f191417389ac7df61830c670.r2.dev/Logos/file_0000000098c08211934c88fe8706c744.png',
    fallbackInitials: 'NUTECH',
  },
  {
    id: 'muet',
    name: 'Mehran UET Jamshoro',
    shortName: 'MUET',
    localLogoUrl: '/logos/academic/muet.png',
    remoteLogoUrl: 'https://pub-51ccade1f191417389ac7df61830c670.r2.dev/Logos/file_00000000f8bc82118852ce302ba72b72.png',
    fallbackInitials: 'MUET',
  },
  {
    id: 'ned',
    name: 'NED University Karachi',
    shortName: 'NED',
    localLogoUrl: '/logos/academic/ned.png',
    remoteLogoUrl: 'https://pub-51ccade1f191417389ac7df61830c670.r2.dev/Logos/file_00000000f8bc82118852ce302ba72b72.png',
    fallbackInitials: 'NED',
  },
  {
    id: 'iba',
    name: 'IBA Karachi',
    shortName: 'IBA Karachi',
    localLogoUrl: '/logos/academic/iba.png',
    remoteLogoUrl: 'https://pub-51ccade1f191417389ac7df61830c670.r2.dev/Logos/file_00000000736c82118bb66504edef22ad.png',
    fallbackInitials: 'IBA',
  },
  {
    id: 'aku',
    name: 'Aga Khan University',
    shortName: 'AKU Medical',
    localLogoUrl: '/logos/academic/aku.png',
    remoteLogoUrl: 'https://pub-51ccade1f191417389ac7df61830c670.r2.dev/Logos/file_00000000722c8207814e3b5131030edc.png',
    fallbackInitials: 'AKU',
  },
  {
    id: 'numl',
    name: 'NUML Islamabad',
    shortName: 'NUML',
    localLogoUrl: '/logos/academic/numl.png',
    remoteLogoUrl: 'https://pub-51ccade1f191417389ac7df61830c670.r2.dev/Logos/file_000000001f108208b064cbd5b8dc77f5.png',
    fallbackInitials: 'NUML',
  },
];

const MARQUEE_ITEMS = [...TRUSTED_INSTITUTIONS_MARQUEE, ...TRUSTED_INSTITUTIONS_MARQUEE];

const CarouselLogoItem: React.FC<{ inst: TrustedInstitution }> = React.memo(({ inst }) => {
  const [currentSrc, setCurrentSrc] = useState<string>(inst.localLogoUrl || inst.remoteLogoUrl);
  const [hasFailed, setHasFailed] = useState(false);

  const handleError = () => {
    if (currentSrc === inst.localLogoUrl && inst.remoteLogoUrl) {
      // Try remote fallback if local is not available
      setCurrentSrc(inst.remoteLogoUrl);
    } else if (currentSrc.includes('/logos/academic/')) {
      setCurrentSrc(currentSrc.replace('/logos/academic/', '/logos/'));
    } else if (inst.remoteLogoUrl && currentSrc !== inst.remoteLogoUrl) {
      setCurrentSrc(inst.remoteLogoUrl);
    } else {
      setHasFailed(true);
    }
  };

  return (
    <div className="flex flex-col items-center justify-start shrink-0 w-28 sm:w-32 md:w-36 group/item cursor-pointer transition-transform duration-300 hover:-translate-y-1.5 select-none">
      <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full bg-white border border-slate-200/90 shadow-sm p-3 sm:p-3.5 md:p-4 flex items-center justify-center overflow-hidden transition-all duration-300 group-hover/item:border-[#1E5AFF] group-hover/item:shadow-md group-hover/item:shadow-[#1E5AFF]/10 group-hover/item:scale-105 relative">
        {!hasFailed ? (
          <img
            src={currentSrc}
            alt={`${inst.name} Logo`}
            className="w-full h-full object-contain max-w-full max-h-full block filter drop-shadow-xs transition-transform duration-300"
            style={{ objectFit: 'contain' }}
            loading="eager"
            decoding="async"
            referrerPolicy="no-referrer"
            onError={handleError}
          />
        ) : (
          <div className="w-full h-full rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center border border-slate-300/60 shadow-inner p-1">
            <span className="font-extrabold text-xs sm:text-sm text-slate-800 text-center tracking-wider">
              {inst.fallbackInitials || inst.shortName}
            </span>
          </div>
        )}
      </div>
      <p className="mt-2.5 sm:mt-3 text-xs sm:text-sm font-bold text-center text-slate-700 group-hover/item:text-[#1E5AFF] transition-colors leading-tight line-clamp-2 px-1 max-w-[120px] sm:max-w-[140px]">
        {inst.shortName || inst.name}
      </p>
    </div>
  );
});

const CardLogoImage: React.FC<{
  src: string;
  fallbackSrc?: string;
  alt: string;
  fallbackText: string;
  bgClass: string;
  textClass: string;
}> = React.memo(({
  src,
  fallbackSrc,
  alt,
  fallbackText,
  bgClass,
  textClass,
}) => {
  const [currentSrc, setCurrentSrc] = useState(src);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    setCurrentSrc(src);
    setFailed(false);
    setAttempt(0);
  }, [src]);

  const handleError = () => {
    if (attempt === 0) {
      setAttempt(1);
      if (src.includes('/logos/academic/')) {
        setCurrentSrc(src.replace('/logos/academic/', '/logos/'));
      } else if (src.startsWith('/logos/')) {
        setCurrentSrc(src.replace('/logos/', '/logos/academic/'));
      } else if (fallbackSrc) {
        setCurrentSrc(fallbackSrc);
      } else {
        setFailed(true);
      }
    } else if (attempt === 1 && fallbackSrc && currentSrc !== fallbackSrc) {
      setAttempt(2);
      setCurrentSrc(fallbackSrc);
    } else {
      setFailed(true);
    }
  };

  if (failed) {
    return (
      <div className={`w-full h-full ${bgClass} flex items-center justify-center rounded-2xl font-black text-sm sm:text-base shadow-xs ${textClass}`}>
        {fallbackText}
      </div>
    );
  }

  return (
    <div className="w-full h-full p-2 flex items-center justify-center">
      <img
        src={currentSrc}
        alt={alt}
        className="max-w-full max-h-full object-contain filter drop-shadow-xs transition-transform duration-300 group-hover:scale-105"
        style={{ objectFit: 'contain' }}
        loading="eager"
        decoding="async"
        referrerPolicy="no-referrer"
        onError={handleError}
      />
    </div>
  );
});

// 9 Testimonials Dataset
interface Testimonial {
  id: string;
  name: string;
  role: string;
  cityBoard: string;
  track: 'FBISE' | 'MDCAT' | 'TCAT' | 'NET' | 'FAST' | 'ECAT' | 'NUMS' | 'GIKI' | 'USAT' | 'ETEA';
  outcome: string;
  avatarBg: string;
  avatarText: string;
  rating: number;
  quote: string;
}

const TESTIMONIALS_DATA: Testimonial[] = [
  {
    id: '1',
    name: 'Ayesha Malik',
    role: 'Pre-Medical Student',
    cityBoard: 'FBISE HSSC-II, Islamabad',
    track: 'FBISE',
    outcome: 'Scored 1070 / 1100 (97.2%)',
    avatarBg: 'bg-[#1E5AFF]/20 border-[#1E5AFF]/40 text-blue-900 ',
    avatarText: 'AM',
    rating: 5,
    quote:
      'The chapter-wise MCQ practice with instant Study Buddy step-by-step explanations helped me pinpoint my exact weak concepts in Organic Chemistry before the FBISE finals.',
  },
  {
    id: '2',
    name: 'Muhammad Hamza',
    role: 'MDCAT Medical Aspirant',
    cityBoard: 'PMC MDCAT, Rawalpindi',
    track: 'MDCAT',
    outcome: 'Admitted to Rawalpindi Medical University',
    avatarBg: 'bg-rose-500/20 border-rose-500/40 text-rose-700 ',
    avatarText: 'MH',
    rating: 5,
    quote:
      'Practicing high-yield Biology and Physics MCQs daily on Boardly gave me the speed and accuracy required for the 200-question MDCAT exam without paying 60,000 PKR for coaching academies.',
  },
  {
    id: '3',
    name: 'Zainab Shah',
    role: 'Engineering Candidate',
    cityBoard: 'TCAT, UET Taxila',
    track: 'TCAT',
    outcome: 'Top 50 Merit Rank (368 / 400)',
    avatarBg: 'bg-cyan-500/20 border-cyan-500/40 text-cyan-700 ',
    avatarText: 'ZS',
    rating: 5,
    quote:
      'The 100-MCQ timed mock tests with 400 marks scoring mirrored the actual UET Taxila entrance exam pattern perfectly. I went in completely confident on test day.',
  },
  {
    id: '4',
    name: 'Saad Chaudhry',
    role: 'Science Stream Student',
    cityBoard: 'FBISE SSC-II, Lahore',
    track: 'FBISE',
    outcome: '98% in Physics & Math',
    avatarBg: 'bg-[#1E5AFF]/20 border-[#1E5AFF]/40 text-blue-900 ',
    avatarText: 'SC',
    rating: 5,
    quote:
      'Boardly’s SLO-aligned question bank matched FBISE paper SLO guidelines line by line. Solved 1,200+ MCQs before my physics exam.',
  },
  {
    id: '5',
    name: 'Fatima Zahra',
    role: 'Medical Aspirant',
    cityBoard: 'Khyber Medical University, Peshawar',
    track: 'MDCAT',
    outcome: 'Scored 186 / 200 in MDCAT',
    avatarBg: 'bg-rose-500/20 border-rose-500/40 text-rose-700 ',
    avatarText: 'FZ',
    rating: 5,
    quote:
      'The Biology memory tricks and Physics numerical step derivations provided by Study Buddy AI saved hours of manual textbook hunting.',
  },
  {
    id: '6',
    name: 'Bilal Ahmed',
    role: 'Computer Science Group',
    cityBoard: 'UET Entry Test, Gujranwala',
    track: 'TCAT',
    outcome: 'Scored 364 / 400 Marks',
    avatarBg: 'bg-cyan-500/20 border-cyan-500/40 text-cyan-700 ',
    avatarText: 'BA',
    rating: 5,
    quote:
      'The CS and Math combinations in Boardly TCAT portal allowed me to practice authentic exam pacing and time management. Highly recommended!',
  },
  {
    id: '7',
    name: 'Maryam Nawaz',
    role: 'Pre-Engineering Student',
    cityBoard: 'FBISE HSSC-I, Multan',
    track: 'FBISE',
    outcome: 'Scored 485 / 520 in Part-1',
    avatarBg: 'bg-[#1E5AFF]/20 border-[#1E5AFF]/40 text-blue-900 ',
    avatarText: 'MN',
    rating: 5,
    quote:
      'The instant feedback loop on incorrect options helped me rectify conceptual mistakes in Integration and Vectors before college midterms.',
  },
  {
    id: '8',
    name: 'Usama Khan',
    role: 'MDCAT Candidate',
    cityBoard: 'Bolan Medical College, Quetta',
    track: 'MDCAT',
    outcome: 'BMC Open Merit Seat Secured',
    avatarBg: 'bg-rose-500/20 border-rose-500/40 text-rose-700 ',
    avatarText: 'UK',
    rating: 5,
    quote:
      'As a student from Balochistan with limited access to expensive academies, Boardly gave me world-class AI test prep completely free of cost.',
  },
  {
    id: '9',
    name: 'Mahnoor Raza',
    role: 'Matric Science Student',
    cityBoard: 'FBISE Class 9, Faisalabad',
    track: 'FBISE',
    outcome: 'FBISE Position Holder',
    avatarBg: 'bg-[#1E5AFF]/20 border-[#1E5AFF]/40 text-blue-900 ',
    avatarText: 'MR',
    rating: 5,
    quote:
      'I loved the clean layout and immediate answer breakdowns. Study Buddy feels like having a personal tutor available at 2 AM before exams.',
  },
  {
    id: '10',
    name: 'Daniyal Tariq',
    role: 'CS / Software Engineering Aspirant',
    cityBoard: 'NUST SEECS, Islamabad',
    track: 'NET',
    outcome: 'Scored 172 / 200 in NET-1',
    avatarBg: 'bg-blue-600/20 border-blue-600/40 text-blue-800',
    avatarText: 'DT',
    rating: 5,
    quote:
      'The 200-question timed mocks and zero-marking pacing simulations prepared me perfectly for the NUST NET exam environment.',
  },
  {
    id: '11',
    name: 'Sarah Qureshi',
    role: 'FAST CS Student',
    cityBoard: 'FAST-NUCES, Lahore',
    track: 'FAST',
    outcome: 'Top 1% in FAST Admission Test',
    avatarBg: 'bg-cyan-600/20 border-cyan-600/40 text-cyan-800',
    avatarText: 'SQ',
    rating: 5,
    quote:
      'FAST test has brutal -0.25 negative marking penalties. Boardly taught me question selection strategy and rapid mental math without calculators.',
  },
  {
    id: '12',
    name: 'Farhan Ali',
    role: 'Mechanical Engineering Student',
    cityBoard: 'UET Lahore ECAT',
    track: 'ECAT',
    outcome: 'Scored 342 / 400 in ECAT',
    avatarBg: 'bg-sky-600/20 border-sky-600/40 text-sky-800',
    avatarText: 'FA',
    rating: 5,
    quote:
      'Practicing 100-MCQ 400-mark timed sets for UET ECAT made the actual examination feel like second nature.',
  },
];

// FAQ Dataset
interface FAQItem {
  question: string;
  answer: string;
}

const FAQ_DATA: FAQItem[] = [
  {
    question: 'What is Boardly?',
    answer:
      'Boardly is a dedicated online MCQ practice and examination preparation platform engineered specifically for Matric, FSC, and post-FSC entry test students in Pakistan. It combines chapter-wise question banks, timed mock exam simulations, step-by-step solution derivations, and 24/7 AI tutoring to help students master their syllabus through active recall and continuous diagnostic assessment.',
  },
  {
    question: 'Which subjects and exams does Boardly cover?',
    answer:
      'Boardly provides comprehensive coverage across all 20 exam tracks in Pakistan: FBISE SSC (Classes 9 & 10) and HSSC (Classes 11 & 12), PMDC MDCAT (Medical), NUST NET (Engineering & Computing), FAST-NU Admission (NAT), UET Lahore ECAT, UET Peshawar ETEA, NUMS Medical (Army Medical College), GIKI Engineering, UET Taxila TCAT, HEC USAT, NED University Karachi, PIEAS Islamabad, NTS NAT (Shared Portal: COMSATS, Air, Bahria, IIUI, IST), IBA Karachi Aptitude, Aga Khan University (AKU) Medical, Mehran UET Jamshoro (MUET), LUMS (LCAT & SBASSE), NUML University, HITEC University Taxila, and NUTECH Islamabad (NUET).',
  },
  {
    question: 'Is Boardly free to use?',
    answer:
      'Yes, students can practice core chapter-wise question banks, attempt mock exams, and view AI-powered answer explanations for free. Optional Pro memberships provide extended question sets, in-depth performance analytics, and priority Study Buddy AI access. (Note that all Pro upgrades are digital purchases subject to a strict no-refunds policy.)',
  },
  {
    question: 'How is Boardly different from live classes on schaorlio.me?',
    answer:
      'Boardly focuses strictly on self-paced MCQ testing, active question drills, instant step-by-step formula derivations, and diagnostic score tracking. Live interactive classes, scheduled video lectures, and instructor-led mentoring sessions are hosted separately through schaorlio.me.',
  },
  {
    question: 'Does Boardly provide explanations for MCQ answers?',
    answer:
      'Yes, every single question features detailed step-by-step explanations, formula breakdowns, and reasoning for why the correct option applies. Students can also chat directly with the 24/7 AI Study Buddy tutor to ask follow-up questions on complex numericals or tricky definitions.',
  },
  {
    question: 'Is Boardly part of SHS Virtual Academy?',
    answer:
      'Yes, Boardly is an educational initiative developed and operated under SHS Virtual Academy (shsvirtualacademy.pro). While SHS Virtual Academy provides overarching curriculum guidance, academic direction, and mentorship, Boardly serves as the specialized digital testing and practice portal.',
  },
];

export const IntroScreen: React.FC<IntroScreenProps> = React.memo(({
  onContinue,
  onOpenCommunity,
  onOpenHistory,
  onOpenLmsPortal,
  onOpenStudyBuddy,
  historyCount,
  onSelectGradesFlow,
  onSelectMdcat,
  onSelectTcat,
  onSelectEntranceTrack,
}) => {
  const [studentCount, setStudentCount] = useState<number>(12000);
  const [activeLegalModal, setActiveLegalModal] = useState<'privacy' | 'terms' | 'no-refunds' | null>(null);
  const [activeTrackFilter, setActiveTrackFilter] = useState<'ALL' | 'FBISE' | 'MDCAT' | 'NET' | 'FAST' | 'ECAT' | 'TCAT'>('ALL');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);
  const [showScrollTop, setShowScrollTop] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const isLogosReady = useLogosReady();

  // Smooth sliding pill hook for Student Success Stories filter
  const {
    containerRef: testimonialTabsRef,
    registerTab: registerTestimonialTab,
    pillStyle: testimonialPillStyle,
  } = useSlidingPill<'ALL' | 'FBISE' | 'MDCAT' | 'NET' | 'FAST' | 'ECAT' | 'TCAT'>(activeTrackFilter);

  useEffect(() => {
    let isMounted = true;
    fetchStudentCountFromSupabase().then((count) => {
      if (isMounted && count > 1000) {
        setStudentCount(count);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Handle scroll detection for back-to-top button with RAF ticking & state guard
  useEffect(() => {
    let lastShown = false;
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(() => {
          const isPast = window.scrollY > 250;
          if (isPast !== lastShown) {
            lastShown = isPast;
            setShowScrollTop(isPast);
          }
          ticking = false;
        });
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const filteredTestimonials = React.useMemo(() => {
    return activeTrackFilter === 'ALL'
      ? TESTIMONIALS_DATA
      : TESTIMONIALS_DATA.filter((t) => t.track === activeTrackFilter);
  }, [activeTrackFilter]);

  return (
    <div className="min-h-screen bg-transparent text-[#1A1A1A]  transition-colors duration-200 flex flex-col font-sans relative">
      {/* Main Page Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-12 sm:space-y-16 flex-1 w-full relative z-[2]">
        {/* =========================================================================
            SECTION 1: HERO & TICKET-STUB STATS STRIP
           ========================================================================= */}
        <section id="hero" className="space-y-6">
          <div className="bg-white/75  backdrop-blur-md text-slate-900  rounded-3xl p-6 sm:p-10 border border-slate-200/80  shadow-lg relative overflow-hidden flex flex-col justify-between gap-8 transition-colors duration-200">
            {/* Background Glow Effect with Ambient Looping Float */}
            <motion.div
              animate={{ y: [0, -8, 0], scale: [1, 1.05, 1] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -top-10 -right-10 w-96 h-96 bg-[#1E5AFF]/[0.08]  rounded-full blur-3xl pointer-events-none"
            />

            <div className="flex flex-wrap items-center justify-between gap-3 relative z-10">
              <motion.div
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="inline-flex items-center gap-2 bg-[#1E5AFF]/15  border border-[#1E5AFF]/30 text-[#0A1330]  px-3.5 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wider"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#1E5AFF]" />
                <span>FBISE & Entrance Exam Academy Platform</span>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="flex items-center gap-2"
              >
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10  text-emerald-700  text-xs font-extrabold border border-emerald-500/30">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>2026 Session Live</span>
                </span>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-4 relative z-10 max-w-3xl"
            >
              <h1 className="font-['Space_Grotesk'] text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900  leading-[1.15] tracking-tight">
                Boardly — MCQ Practice for FSC Matric & Post FSC Students
              </h1>
              <p className="text-slate-600  text-sm sm:text-base lg:text-lg leading-relaxed font-normal">
                Master FBISE SSC & HSSC Matric & FSC curriculum, PMDC MDCAT, NUST NET, FAST-NU, UET ECAT, ETEA, NUMS, GIKI, TCAT, HEC USAT, NED University, PIEAS, NTS NAT, IBA Karachi, AKU Medical, MUET, LUMS, NUML, HITEC, and NUTECH entrance exams with intelligent chapter-wise question banks, step-by-step AI reasoning, and performance analytics.
              </p>
            </motion.div>

            <div className="space-y-6 relative z-10">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <motion.button
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ duration: 0.15 }}
                  onClick={onSelectGradesFlow || onContinue}
                  className="bg-[#1E5AFF] hover:bg-[#1546CC] text-white font-extrabold py-4 px-8 rounded-full shadow-md hover:shadow-lg hover:shadow-[#1E5AFF]/20 flex items-center justify-center gap-2.5 text-sm sm:text-base cursor-pointer transition-all"
                >
                  <span>Start Practice Test for Free</span>
                  <ArrowRight className="w-4 h-4 stroke-[3]" />
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ duration: 0.15 }}
                  onClick={onOpenCommunity}
                  className="bg-[#0A1330] text-white hover:bg-[#152454]   border border-[#0A1330]  font-bold py-4 px-6 rounded-full flex items-center justify-center gap-2 text-xs sm:text-sm cursor-pointer transition-all"
                >
                  <Users className="w-4 h-4 text-[#1E5AFF]" />
                  <span>Join SHS Virtual Academy Community</span>
                </motion.button>
              </div>

              {/* Dynamic Trust-Signal Line */}
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 font-medium">
                <div className="flex -space-x-1.5 overflow-hidden shrink-0">
                  <span className="inline-flex h-6 w-6 rounded-full ring-2 ring-white bg-[#1E5AFF] text-white font-black text-[10px] items-center justify-center shadow-xs">
                    S
                  </span>
                  <span className="inline-flex h-6 w-6 rounded-full ring-2 ring-white bg-slate-800 text-white font-bold text-[10px] items-center justify-center shadow-xs">
                    M
                  </span>
                  <span className="inline-flex h-6 w-6 rounded-full ring-2 ring-white bg-emerald-500 text-white font-bold text-[10px] items-center justify-center shadow-xs">
                    A
                  </span>
                </div>
                <span>
                  Join <strong className="text-slate-900 font-black"><AnimatedCounter value={studentCount > 1000 ? studentCount : 12000} duration={1300} suffix="+" /></strong> students practicing across Pakistan
                </span>
              </div>

              {/* Ticket-Stub Style Stats Strip */}
              <div className="pt-5 border-t border-slate-200/80">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
                  <AnimatedStatCard
                    targetValue={studentCount > 1000 ? studentCount : 12000}
                    duration={1300}
                    midCountFn={(v) => Math.round(v).toLocaleString()}
                    finalDisplay={studentCount >= 1000 ? `${(studentCount / 1000).toFixed(studentCount % 1000 === 0 ? 0 : 1)}K+` : `${studentCount}+`}
                    label="Students Practicing"
                  />
                  <AnimatedStatCard
                    targetValue={40000}
                    duration={1400}
                    midCountFn={(v) => `${Math.round(v).toLocaleString()}+`}
                    finalDisplay="40,000+"
                    label="MCQs Explained"
                  />
                  <AnimatedStatCard
                    targetValue={20}
                    duration={1000}
                    midCountFn={(v) => `${Math.round(v)} Tracks`}
                    finalDisplay="20 Tracks"
                    label="All 20 Exam Portals"
                  />
                  <AnimatedStatCard
                    targetValue={24}
                    duration={1100}
                    midCountFn={(v) => `${Math.round(v)}/7`}
                    finalDisplay="24/7"
                    label="Study Buddy Uptime"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            SECTION 2: SOCIAL PROOF & ACADEMY MENTIONS BAND
           ========================================================================= */}
        <section className="bg-white/75  backdrop-blur-md border border-slate-200/80  rounded-3xl p-5 sm:p-7 shadow-sm overflow-hidden space-y-6">
          <div className="text-center space-y-1">
            <span className="text-[11px] font-black uppercase tracking-widest text-[#1E5AFF] inline-flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" />
              <span>Academic Network</span>
            </span>
            <p className="text-xs sm:text-sm font-extrabold uppercase tracking-widest text-slate-700 ">
              TRUSTED BY STUDENTS &amp; POSITION-HOLDERS FROM LEADING INSTITUTIONS
            </p>
          </div>

          {/* Auto-sliding Horizontal Carousel with Gradient Fades at Edges */}
          <div className="relative w-full overflow-hidden py-2 group min-h-[140px] sm:min-h-[160px]">
            {/* Left/Right Edge Fades */}
            <div className="absolute left-0 top-0 bottom-0 w-12 sm:w-20 bg-gradient-to-r from-white/80  to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-12 sm:w-20 bg-gradient-to-l from-white/80  to-transparent z-10 pointer-events-none" />

            {/* If logos are loading in parallel, render a coordinated skeleton placeholder to prevent staggered pop-in */}
            {!isLogosReady ? (
              <div className="flex gap-6 sm:gap-10 items-start animate-pulse opacity-60">
                {TRUSTED_INSTITUTIONS_MARQUEE.slice(0, 10).map((inst, index) => (
                  <div key={`skel-${inst.id}-${index}`} className="flex flex-col items-center shrink-0 w-28 sm:w-32 md:w-36 select-none">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full bg-slate-100 border border-slate-200/80 shadow-xs flex items-center justify-center p-3">
                      <div className="w-12 h-12 rounded-full bg-slate-200/70" />
                    </div>
                    <div className="mt-3 h-3 w-16 bg-slate-200 rounded-full" />
                  </div>
                ))}
              </div>
            ) : (
              /* Continuous Marquee Track - all logos rendered simultaneously */
              <div className="animate-continuous-scroll flex gap-6 sm:gap-10 items-start will-change-transform transition-opacity duration-500 opacity-100">
                {MARQUEE_ITEMS.map((inst, index) => (
                  <CarouselLogoItem key={`${inst.id}-${index}`} inst={inst} />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* =========================================================================
            SECTION: PLATFORM OVERVIEW & ACADEMIC SCOPE
           ========================================================================= */}
        <section id="platform-overview" className="bg-white border border-slate-200/80 card-containment rounded-3xl p-6 sm:p-8 lg:p-10 shadow-sm space-y-8">
          <div className="space-y-3 max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-[#1E5AFF]/15 text-[#0A1330] px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider border border-[#1E5AFF]/30">
              <BookOpen className="w-3.5 h-3.5 text-[#1E5AFF]" />
              <span>Dedicated Exam Preparation Platform</span>
            </div>
            <h2 className="font-['Space_Grotesk'] text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 leading-tight">
              How does Boardly help you prepare for FBISE, MDCAT, and university entrance exams?
            </h2>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
              Boardly is a comprehensive online MCQ practice and examination preparation platform engineered specifically for students across Pakistan. Covering 20 distinct academic and entrance test tracks — FBISE (Classes 9–12), PMDC MDCAT, NUST NET, FAST-NU, UET ECAT, ETEA, NUMS, GIKI, UET Taxila TCAT, HEC USAT, NED University Karachi, PIEAS Islamabad, NTS NAT, IBA Karachi, Aga Khan University (AKU), MEHRAN UET (MUET), LUMS, NUML, HITEC University Taxila, and NUTECH Islamabad — Boardly provides extensive chapter-wise question banks, timed mock tests with negative marking simulations, and instant AI step-by-step solutions to help you identify learning gaps and master your syllabus with confidence.
            </p>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
              Boardly is an educational initiative developed under{' '}
              <a
                href="https://shsvirtualacademy.pro"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#1E5AFF] font-bold underline hover:text-[#1546CC] inline-flex items-center gap-0.5"
              >
                SHS Virtual Academy (shsvirtualacademy.pro)
                <ExternalLink className="w-3 h-3 ml-0.5" />
              </a>
              , our parent academic organization dedicated to empowering Pakistani learners with modern digital learning tools. While our main academy coordinates curriculum guidance and student mentorship, Boardly serves as the dedicated testing and self-assessment engine. Note that live scheduled lectures and interactive video classes are conducted separately through{' '}
              <a
                href="https://schaorlio.me"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#1E5AFF] font-bold underline hover:text-[#1546CC]"
              >
                schaorlio.me
              </a>
              , allowing Boardly to focus exclusively on question practice, instant answer derivations, and diagnostic testing.
            </p>
            <div className="p-4 bg-blue-50/80 rounded-2xl border border-blue-100 text-xs text-slate-700 leading-relaxed flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-[#1E5AFF] shrink-0 mt-0.5" />
              <span>
                <strong>Academic Scope Note:</strong> Boardly specializes exclusively in self-paced MCQ practice, past papers simulation, and AI-powered step-by-step solutions. Scheduled interactive lectures and live classes are conducted separately through our academy portal at{' '}
                <a
                  href="https://schaorlio.me"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#1E5AFF] font-bold underline hover:text-[#1546CC]"
                >
                  schaorlio.me
                </a>
                .
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
            {/* Column 1: Who It's For */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-[#1E5AFF]/15 text-[#0A1330] flex items-center justify-center border border-[#1E5AFF]/30">
                  <GraduationCap className="w-5 h-5 text-[#1E5AFF]" />
                </div>
                <h3 className="font-['Space_Grotesk'] text-lg font-bold text-slate-900">
                  Who Boardly Is For
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Tailored specifically for Matric, FSC Intermediate, and Post-FSC students preparing for high-stakes examinations:
                </p>
                <ul className="space-y-2 text-xs text-slate-700 font-medium">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span><strong>Matric & FSc (Classes 9–12):</strong> Complete FBISE SSC & HSSC curriculum across Science, Pre-Med, Pre-Eng, and ICS streams.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span><strong>Medical Aspirants:</strong> PMDC MDCAT, NUMS (Army Medical College), and Aga Khan University (AKU) entrance preparation.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span><strong>Engineering & Computing:</strong> NUST NET, FAST-NU, UET ECAT, ETEA, GIKI, TCAT, NED University, PIEAS, MUET Jamshoro, HITEC, and NUTECH (NUET).</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span><strong>Aptitude & Undergraduate:</strong> HEC USAT series, NTS NAT (COMSATS, Air, Bahria, IIUI, IST), IBA Karachi, LUMS (LCAT & SBASSE), and NUML.</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Column 2: Key Features */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-[#1E5AFF]/15 text-[#0A1330] flex items-center justify-center border border-[#1E5AFF]/30">
                  <Layers className="w-5 h-5 text-[#1E5AFF]" />
                </div>
                <h3 className="font-['Space_Grotesk'] text-lg font-bold text-slate-900">
                  Core Features & Study Tools
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Structured around active recall and real-world exam conditions for maximum score improvement:
                </p>
                <ul className="space-y-2 text-xs text-slate-700 font-medium">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span><strong>SLO-Mapped Question Banks:</strong> Practice chapter-by-chapter according to official Federal Board Student Learning Outcomes.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span><strong>Timed Mock Simulations:</strong> Customizable question counts, authentic timer countdowns, and real exam conditions.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span><strong>Instant Scoring & Answer Keys:</strong> Immediate diagnostic feedback without waiting days for manual paper grading.</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Column 3: AI Explanations & Analytics */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-[#1E5AFF]/15 text-[#0A1330] flex items-center justify-center border border-[#1E5AFF]/30">
                  <Brain className="w-5 h-5 text-[#1E5AFF]" />
                </div>
                <h3 className="font-['Space_Grotesk'] text-lg font-bold text-slate-900">
                  Step-by-Step AI Solutions
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Understanding why an option is correct transforms practice into actual conceptual mastery:
                </p>
                <ul className="space-y-2 text-xs text-slate-700 font-medium">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span><strong>Formula Derivations:</strong> Clear mathematical steps and scientific reasoning for every question.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span><strong>Study Buddy AI:</strong> 24/7 interactive tutor to ask follow-up questions and clarify doubts anytime.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span><strong>Diagnostic Analytics:</strong> Highlight weak subjects and track historical accuracy trends over time.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Quick Action Band */}
          <div className="p-6 rounded-2xl bg-[#0A1330] text-white flex flex-col sm:flex-row items-center justify-between gap-4 border border-[#1E5AFF]/30">
            <div className="space-y-1 text-center sm:text-left">
              <h3 className="font-['Space_Grotesk'] font-bold text-base sm:text-lg">
                Ready to Start Practicing?
              </h3>
              <p className="text-xs text-slate-300">
                Select your class level or entrance exam series to try free chapter MCQs now.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={onSelectGradesFlow || onContinue}
                className="bg-[#1E5AFF] hover:bg-[#1546CC] text-white font-extrabold px-6 py-3 rounded-full text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer shadow-md"
              >
                <span>Try Free MCQs</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <a
                href="https://shsvirtualacademy.pro"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white/10 hover:bg-white/20 text-white font-bold px-5 py-3 rounded-full text-xs transition-all border border-white/20 flex items-center gap-1.5"
              >
                <span>Visit SHS Virtual Academy</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </section>

        {/* =========================================================================
            SECTION 3: HOW IT WORKS
           ========================================================================= */}
        <LazySection rootMargin="300px" minHeight="260px">
        <section id="how-it-works" className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-[#1E5AFF]">
                <Target className="w-3.5 h-3.5" />
                <span>3-Step Mastery</span>
              </div>
              <h2 className="font-['Space_Grotesk'] text-2xl sm:text-3xl font-black text-slate-900 ">
                How does Boardly work in 3 simple steps?
              </h2>
            </div>
            <span className="text-xs font-bold text-slate-600  hidden sm:inline-block">
              Zero Signup Friction &middot; Instant Practice
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <ScrollFadeInCard delayIndex={0}>
              <div className="bg-white border border-slate-200/80 card-containment rounded-2xl p-5 shadow-sm hover:border-[#1E5AFF]/50 hover:shadow-md transition-all space-y-3 h-full">
                <div className="w-10 h-10 rounded-xl bg-[#1E5AFF]/15 text-[#0A1330]  font-black text-sm flex items-center justify-center border border-[#1E5AFF]/30">
                  1
                </div>
                <h3 className="font-bold text-base text-slate-900 ">Select Your Exam Track</h3>
                <p className="text-xs text-slate-600  leading-relaxed font-normal">
                  Choose from 20 comprehensive tracks: FBISE (9–12), MDCAT, NET, FAST, ECAT, ETEA, NUMS, GIKI, TCAT, USAT, NED, PIEAS, NAT, IBA, AKU, MUET, LUMS, NUML, HITEC, or NUTECH.
                </p>
              </div>
            </ScrollFadeInCard>

            <ScrollFadeInCard delayIndex={1}>
              <div className="bg-white border border-slate-200/80 card-containment rounded-2xl p-5 shadow-sm hover:border-[#1E5AFF]/50 hover:shadow-md transition-all space-y-3 h-full">
                <div className="w-10 h-10 rounded-xl bg-[#1E5AFF]/15 text-[#0A1330]  font-black text-sm flex items-center justify-center border border-[#1E5AFF]/30">
                  2
                </div>
                <h3 className="font-bold text-base text-slate-900 ">Practice Chapter MCQs</h3>
                <p className="text-xs text-slate-600  leading-relaxed font-normal">
                  Attempt chapter-wise tests with real-time timers, authentic exam conditions, and step-by-step AI derivations.
                </p>
              </div>
            </ScrollFadeInCard>

            <ScrollFadeInCard delayIndex={2}>
              <div className="bg-white border border-slate-200/80 card-containment rounded-2xl p-5 shadow-sm hover:border-[#1E5AFF]/50 hover:shadow-md transition-all space-y-3 h-full">
                <div className="w-10 h-10 rounded-xl bg-[#1E5AFF]/15 text-[#0A1330]  font-black text-sm flex items-center justify-center border border-[#1E5AFF]/30">
                  3
                </div>
                <h3 className="font-bold text-base text-slate-900 ">Analyze & Fix Weak Spots</h3>
                <p className="text-xs text-slate-600  leading-relaxed font-normal">
                  Review your topic-wise accuracy breakdown, review flagged errors, and chat 24/7 with Study Buddy AI.
                </p>
              </div>
            </ScrollFadeInCard>
          </div>
        </section>
        </LazySection>

        {/* =========================================================================
            SECTION 4: AVAILABLE TEST TRACKS
           ========================================================================= */}
        <LazySection rootMargin="300px" minHeight="380px">
        <section id="tracks" className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 px-1">
            <div>
              <h2 className="font-['Space_Grotesk'] text-2xl sm:text-3xl font-black text-slate-900 ">
                Which test tracks and classes are available on Boardly?
              </h2>
              <p className="text-xs text-slate-600 ">
                Select your board or entrance test track to begin practicing immediately
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                id: 'fbise',
                categoryBadge: 'Class 9 – 12',
                categoryBadgeClass: 'bg-[#1E5AFF]/15 text-[#0A1330]',
                logoSrc: 'https://pub-51ccade1f191417389ac7df61830c670.r2.dev/file_00000000aa9c8208899ee0e0e9a1a513.png',
                logoAlt: 'FBISE Official Logo',
                fallbackText: 'FBISE',
                bgClass: 'bg-emerald-600',
                textClass: 'text-white',
                hoverBorderClass: 'hover:border-[#1E5AFF]',
                hoverTitleClass: 'group-hover:text-[#1E5AFF]',
                hoverBtnClass: 'group-hover:bg-[#1E5AFF]',
                title: 'FBISE (Classes 9–12)',
                description: 'Complete FBISE question banks covering Physics, Chemistry, Biology, Mathematics, Computer Science, and English mapped to SLO guidelines.',
                features: ['SLO Mapped FBISE Questions', 'Past Paper Solutions with Keys', 'Chapter-wise & Full Tests'],
                buttonText: 'Select FBISE Class',
                onAction: onSelectGradesFlow || onContinue,
              },
              {
                id: 'mdcat',
                categoryBadge: 'Medical Entrance',
                categoryBadgeClass: 'bg-rose-500/15 text-rose-700',
                logoSrc: 'https://pub-51ccade1f191417389ac7df61830c670.r2.dev/PMDC%20Logo-Green.png',
                logoAlt: 'PMDC MDCAT Official Logo',
                fallbackText: 'PMDC',
                bgClass: 'bg-rose-700',
                textClass: 'text-white',
                hoverBorderClass: 'hover:border-rose-500',
                hoverTitleClass: 'group-hover:text-rose-600',
                hoverBtnClass: 'group-hover:bg-rose-600',
                title: 'MDCAT Medical Portal',
                description: 'Dedicated PMDC / PMC Medical entrance test prep covering Biology, Organic/Inorganic Chemistry, Physics & English reasoning.',
                features: ['Bio, Chem, Physics & English', '200-Question Timed Mock Tests', 'Memory Tricks & High-Yield Notes'],
                buttonText: 'Open MDCAT Portal',
                onAction: onSelectMdcat || (() => (onSelectEntranceTrack ? onSelectEntranceTrack('MDCAT') : onContinue())),
              },
              {
                id: 'net',
                categoryBadge: 'NUST Islamabad',
                categoryBadgeClass: 'bg-blue-600/15 text-blue-800',
                logoSrc: 'https://pub-51ccade1f191417389ac7df61830c670.r2.dev/nust-logo-png_seeklogo-234117.png',
                logoAlt: 'NUST Entry Test Logo',
                fallbackText: 'NUST',
                bgClass: 'bg-[#004B87]',
                textClass: 'text-white',
                hoverBorderClass: 'hover:border-blue-600',
                hoverTitleClass: 'group-hover:text-blue-700',
                hoverBtnClass: 'group-hover:bg-blue-600',
                title: 'NUST Entry Test (NET)',
                description: 'National University of Sciences & Technology series: 200 MCQs across Mathematics, Physics, and SAT-I style English with zero negative marking.',
                features: ['200 MCQs in 180 Minutes', 'Math 100, Physics 60, English 40', 'Zero Negative Marking Scheme'],
                buttonText: 'Open NUST NET Portal',
                onAction: () => (onSelectEntranceTrack ? onSelectEntranceTrack('NET') : onContinue()),
              },
              {
                id: 'fast',
                categoryBadge: 'FAST-NUCES',
                categoryBadgeClass: 'bg-cyan-600/15 text-cyan-800',
                logoSrc: 'https://pub-51ccade1f191417389ac7df61830c670.r2.dev/Fast-University-Logo.png',
                logoAlt: 'FAST-NU Official Logo',
                fallbackText: 'FAST',
                bgClass: 'bg-[#003B73]',
                textClass: 'text-white',
                hoverBorderClass: 'hover:border-cyan-600',
                hoverTitleClass: 'group-hover:text-cyan-700',
                hoverBtnClass: 'group-hover:bg-cyan-600',
                title: 'FAST-NU Admission (NAT)',
                description: 'Pakistan premier Computer Science entrance test: 120 MCQs with -0.25 negative marking penalty and advanced analytical reasoning.',
                features: ['120 MCQs: Adv Math, Basic Math, IQ', '-0.25 Negative Marking Penalty', 'Calculators Strictly Prohibited'],
                buttonText: 'Open FAST-NU Portal',
                onAction: () => (onSelectEntranceTrack ? onSelectEntranceTrack('FAST') : onContinue()),
              },
              {
                id: 'ecat',
                categoryBadge: 'Punjab Engineering',
                categoryBadgeClass: 'bg-sky-600/15 text-sky-800',
                logoSrc: 'https://pub-51ccade1f191417389ac7df61830c670.r2.dev/logo-2.png',
                logoAlt: 'UET Lahore ECAT Logo',
                fallbackText: 'ECAT',
                bgClass: 'bg-[#0B1E48]',
                textClass: 'text-cyan-300',
                hoverBorderClass: 'hover:border-sky-600',
                hoverTitleClass: 'group-hover:text-sky-700',
                hoverBtnClass: 'group-hover:bg-sky-600',
                title: 'UET Lahore ECAT',
                description: 'Combined Entry Test for Punjab engineering universities: 100 MCQs for 400 total marks (+4 correct, -1 incorrect) with Pre-Eng & ICS streams.',
                features: ['100 MCQs / 400 Total Marks (+4 each)', 'Pre-Eng (Chem) & ICS (CS) Streams', '100 Minutes Real Exam Pacing'],
                buttonText: 'Open ECAT Portal',
                onAction: () => (onSelectEntranceTrack ? onSelectEntranceTrack('ECAT') : onContinue()),
              },
              {
                id: 'etea',
                categoryBadge: 'KPK Engineering',
                categoryBadgeClass: 'bg-teal-600/15 text-teal-800',
                logoSrc: 'https://pub-51ccade1f191417389ac7df61830c670.r2.dev/uet-02.png',
                logoAlt: 'UET Peshawar ETEA Logo',
                fallbackText: 'ETEA',
                bgClass: 'bg-teal-700',
                textClass: 'text-white',
                hoverBorderClass: 'hover:border-teal-600',
                hoverTitleClass: 'group-hover:text-teal-700',
                hoverBtnClass: 'group-hover:bg-teal-600',
                title: 'UET Peshawar ETEA',
                description: 'Educational Testing and Evaluation Agency entrance exam for KPK colleges mapped directly to KPK Board textbook syllabus.',
                features: ['Physics 40, Math 35, Eng 15, Chem/CS 10', '100 Questions in 100 Minutes', 'KPK Board Textbook Syllabus'],
                buttonText: 'Open ETEA Portal',
                onAction: () => (onSelectEntranceTrack ? onSelectEntranceTrack('ETEA') : onContinue()),
              },
              {
                id: 'nums',
                categoryBadge: 'Army Medical College',
                categoryBadgeClass: 'bg-emerald-600/15 text-emerald-800',
                logoSrc: 'https://pub-51ccade1f191417389ac7df61830c670.r2.dev/nums-logo.png',
                logoAlt: 'NUMS Medical Official Logo',
                fallbackText: 'NUMS',
                bgClass: 'bg-[#006837]',
                textClass: 'text-white',
                hoverBorderClass: 'hover:border-emerald-600',
                hoverTitleClass: 'group-hover:text-emerald-700',
                hoverBtnClass: 'group-hover:bg-emerald-600',
                title: 'NUMS Medical (AMC)',
                description: 'National University of Medical Sciences test for AMC Rawalpindi: Part A (150 MCQs Subject Knowledge) and Part B (50 MCQs Psychological Assessment).',
                features: ['Part A: 150 Subject MCQs (95% Weight)', 'Part B: 50 Psychological MCQs (5%)', 'Mandatory for AMC Open Merit'],
                buttonText: 'Open NUMS Medical Portal',
                onAction: () => (onSelectEntranceTrack ? onSelectEntranceTrack('NUMS') : onContinue()),
              },
              {
                id: 'giki',
                categoryBadge: 'GIKI Topi',
                categoryBadgeClass: 'bg-indigo-600/15 text-indigo-800',
                logoSrc: 'https://pub-51ccade1f191417389ac7df61830c670.r2.dev/cropped-giki-logo-updated.png',
                logoAlt: 'GIKI Official Logo',
                fallbackText: 'GIKI',
                bgClass: 'bg-[#102254]',
                textClass: 'text-blue-200',
                hoverBorderClass: 'hover:border-indigo-600',
                hoverTitleClass: 'group-hover:text-indigo-700',
                hoverBtnClass: 'group-hover:bg-indigo-600',
                title: 'GIKI Admission Test',
                description: 'Ghulam Ishaq Khan Institute test: 80 high-difficulty analytical MCQs across Mathematics, Physics, and English over generous 120-minute timing.',
                features: ['80 Multi-step Conceptual MCQs', 'Generous 120-Minute Time Limit', 'Calculus & Advanced Physics Focus'],
                buttonText: 'Open GIKI Portal',
                onAction: () => (onSelectEntranceTrack ? onSelectEntranceTrack('GIKI') : onContinue()),
              },
              {
                id: 'tcat',
                categoryBadge: 'UET Taxila',
                categoryBadgeClass: 'bg-cyan-500/15 text-cyan-700',
                logoSrc: 'https://pub-51ccade1f191417389ac7df61830c670.r2.dev/logo-2.png',
                logoAlt: 'UET Taxila TCAT Official Logo',
                fallbackText: 'TCAT',
                bgClass: 'bg-sky-900',
                textClass: 'text-cyan-300',
                hoverBorderClass: 'hover:border-cyan-500',
                hoverTitleClass: 'group-hover:text-cyan-600',
                hoverBtnClass: 'group-hover:bg-cyan-600',
                title: 'TCAT / UET Taxila Series',
                description: 'Taxila Combined Admission Test preparation portal featuring FSc group combinations, 100-MCQ full mock tests & 400 total marks scoring.',
                features: ['Math, Physics, CS/Chem & English', '400 Marks Exam Simulation', 'Negative Marking Rules & Timing'],
                buttonText: 'Open TCAT Dashboard',
                onAction: onSelectTcat || (() => (onSelectEntranceTrack ? onSelectEntranceTrack('TCAT') : onContinue())),
              },
              {
                id: 'usat',
                categoryBadge: 'HEC Pakistan',
                categoryBadgeClass: 'bg-violet-600/15 text-violet-800',
                logoSrc: '/logos/academic/hec-usat.png',
                fallbackSrc: 'https://pub-51ccade1f191417389ac7df61830c670.r2.dev/Logos/file_00000000175082118793959c6c498063.png',
                logoAlt: 'HEC USAT Logo',
                fallbackText: 'USAT',
                bgClass: 'bg-indigo-900',
                textClass: 'text-indigo-200',
                hoverBorderClass: 'hover:border-violet-600',
                hoverTitleClass: 'group-hover:text-violet-700',
                hoverBtnClass: 'group-hover:bg-violet-600',
                title: 'HEC USAT Series',
                description: 'Higher Education Commission Undergraduate Studies Admission Test covering Verbal Reasoning, Quantitative Reasoning, and discipline electives.',
                features: ['Verbal (20) & Quantitative (25) Logic', 'Discipline Electives (55 Questions)', '100 Total Marks — 50 to Qualify'],
                buttonText: 'Open HEC USAT Portal',
                onAction: () => (onSelectEntranceTrack ? onSelectEntranceTrack('USAT') : onContinue()),
              },
              {
                id: 'ned',
                categoryBadge: 'NED Karachi',
                categoryBadgeClass: 'bg-[#002D62]/15 text-[#002D62]',
                logoSrc: '/logos/academic/ned.png',
                fallbackSrc: 'https://pub-51ccade1f191417389ac7df61830c670.r2.dev/Logos/file_00000000287482088f11d13f9c658cf4.png',
                logoAlt: 'NED University Official Logo',
                fallbackText: 'NED',
                bgClass: 'bg-[#002D62]',
                textClass: 'text-white',
                hoverBorderClass: 'hover:border-[#002D62]',
                hoverTitleClass: 'group-hover:text-[#002D62]',
                hoverBtnClass: 'group-hover:bg-[#002D62]',
                title: 'NED University Karachi',
                description: '100 MCQs in 2 hours with no negative marking: Math 25, Physics 25, Chemistry 25, and English 25. Merit formula: 60% Entry Test + 40% HSC.',
                features: ['100 MCQs in 2 Hours (120 Mins)', 'Math 25, Phys 25, Chem 25, Eng 25', 'Zero Negative Marking Scheme'],
                buttonText: 'Open NED Portal',
                onAction: () => (onSelectEntranceTrack ? onSelectEntranceTrack('NED') : onContinue()),
              },
              {
                id: 'pieas',
                categoryBadge: 'PIEAS Islamabad',
                categoryBadgeClass: 'bg-[#1E3A8A]/15 text-[#1E3A8A]',
                logoSrc: '/logos/academic/pieas.png',
                fallbackSrc: 'https://pub-51ccade1f191417389ac7df61830c670.r2.dev/Logos/file_00000000748c8211bb5e3cfb31849396.png',
                logoAlt: 'PIEAS Official Logo',
                fallbackText: 'PIEAS',
                bgClass: 'bg-[#1E3A8A]',
                textClass: 'text-white',
                hoverBorderClass: 'hover:border-[#1E3A8A]',
                hoverTitleClass: 'group-hover:text-[#1E3A8A]',
                hoverBtnClass: 'group-hover:bg-[#1E3A8A]',
                title: 'PIEAS Written Test',
                description: '100 MCQs over 3 hours with no negative marking. Pre-Engineering and ICS streams covering Mathematics, Physics, English, and Chemistry or CS.',
                features: ['100 MCQs in 180 Minutes (3 Hours)', 'Pre-Eng & ICS Subject Streams', 'Zero Negative Marking Scheme'],
                buttonText: 'Open PIEAS Portal',
                onAction: () => (onSelectEntranceTrack ? onSelectEntranceTrack('PIEAS') : onContinue()),
              },
              {
                id: 'nat',
                categoryBadge: 'COMSATS / Air / Bahria',
                categoryBadgeClass: 'bg-[#006A4E]/15 text-[#006A4E]',
                logoSrc: '/logos/academic/comsats.png',
                fallbackSrc: 'https://pub-51ccade1f191417389ac7df61830c670.r2.dev/Logos/file_000000008a848208ad6e5ff38e3d1998.png',
                logoAlt: 'COMSATS University / NTS NAT Official Logo',
                fallbackText: 'COMSATS',
                bgClass: 'bg-[#006A4E]',
                textClass: 'text-white',
                hoverBorderClass: 'hover:border-[#006A4E]',
                hoverTitleClass: 'group-hover:text-[#006A4E]',
                hoverBtnClass: 'group-hover:bg-[#006A4E]',
                title: 'NTS NAT Shared Portal (COMSATS)',
                description: 'One shared portal for COMSATS, Air University, Bahria, IIUI, and IST: 90 MCQs in 120 minutes across English, Analytical, Quantitative, and Subject streams.',
                features: ['90 MCQs in 120 Minutes', 'NAT-IE, NAT-IM & NAT-ICS Streams', 'Covers COMSATS, Air, Bahria, IIUI, IST'],
                buttonText: 'Open NTS NAT Portal',
                onAction: () => (onSelectEntranceTrack ? onSelectEntranceTrack('NAT') : onContinue()),
              },
              {
                id: 'iba',
                categoryBadge: 'IBA Karachi',
                categoryBadgeClass: 'bg-[#8B0000]/15 text-[#8B0000]',
                logoSrc: '/logos/academic/iba.png',
                fallbackSrc: 'https://pub-51ccade1f191417389ac7df61830c670.r2.dev/Logos/file_00000000736c82118bb66504edef22ad.png',
                logoAlt: 'IBA Karachi Logo',
                fallbackText: 'IBA',
                bgClass: 'bg-[#8B0000]',
                textClass: 'text-white',
                hoverBorderClass: 'hover:border-[#8B0000]',
                hoverTitleClass: 'group-hover:text-[#8B0000]',
                hoverBtnClass: 'group-hover:bg-[#8B0000]',
                title: 'IBA Karachi Aptitude',
                description: '90 MCQs in 165 minutes with strict sectional cut-offs and -0.25 negative marking: 45 English Verbal Aptitude and 45 Quantitative Mathematics.',
                features: ['90 MCQs in 165 Minutes (2h 45m)', 'Strict Sectional Cut-offs (Both Pass)', '-0.25 Negative Marking Penalty'],
                buttonText: 'Open IBA Portal',
                onAction: () => (onSelectEntranceTrack ? onSelectEntranceTrack('IBA') : onContinue()),
              },
              {
                id: 'aku',
                categoryBadge: 'AKU Medical',
                categoryBadgeClass: 'bg-[#005A36]/15 text-[#005A36]',
                logoSrc: '/logos/academic/aku.png',
                fallbackSrc: 'https://pub-51ccade1f191417389ac7df61830c670.r2.dev/Logos/file_00000000722c8207814e3b5131030edc.png',
                logoAlt: 'Aga Khan University Logo',
                fallbackText: 'AKU',
                bgClass: 'bg-[#005A36]',
                textClass: 'text-white',
                hoverBorderClass: 'hover:border-[#005A36]',
                hoverTitleClass: 'group-hover:text-[#005A36]',
                hoverBtnClass: 'group-hover:bg-[#005A36]',
                title: 'Aga Khan University (AKU)',
                description: 'Premier 100-mark MBBS test: Science Achievement (Bio 16, Chem 12, Phys 12 with -0.25 penalty), Science Reasoning (30), and Mathematical Reasoning (30).',
                features: ['Science Achievement (-0.25 Penalty)', 'Science & Mathematical Reasoning', '100 Questions in 120 Minutes'],
                buttonText: 'Open AKU Portal',
                onAction: () => (onSelectEntranceTrack ? onSelectEntranceTrack('AKU') : onContinue()),
              },
              {
                id: 'muet',
                categoryBadge: 'MUET Jamshoro',
                categoryBadgeClass: 'bg-[#800020]/15 text-[#800020]',
                logoSrc: '/logos/academic/muet.png',
                fallbackSrc: 'https://pub-51ccade1f191417389ac7df61830c670.r2.dev/Logos/file_00000000f8bc82118852ce302ba72b72.png',
                logoAlt: 'Mehran University (MUET) Official Logo',
                fallbackText: 'MUET',
                bgClass: 'bg-[#800020]',
                textClass: 'text-white',
                hoverBorderClass: 'hover:border-[#800020]',
                hoverTitleClass: 'group-hover:text-[#800020]',
                hoverBtnClass: 'group-hover:bg-[#800020]',
                title: 'Mehran University (MUET)',
                description: '100 MCQs in 100 minutes with no negative marking. 25 Math/Bio, 25 Physics, 25 Chem/CS, and 25 English based on Sindh Textbook Board.',
                features: ['100 MCQs in 100 Minutes', 'Pre-Eng, ICS & Pre-Med Options', 'Zero Negative Marking Scheme'],
                buttonText: 'Open MUET Portal',
                onAction: () => (onSelectEntranceTrack ? onSelectEntranceTrack('MUET') : onContinue()),
              },
              {
                id: 'lums',
                categoryBadge: 'LUMS Lahore',
                categoryBadgeClass: 'bg-[#002855]/15 text-[#002855]',
                logoSrc: '/logos/academic/lums.png',
                fallbackSrc: 'https://pub-51ccade1f191417389ac7df61830c670.r2.dev/Logos/file_00000000f29c8211bbac0ae9800006de.png',
                logoAlt: 'LUMS Official Logo',
                fallbackText: 'LUMS',
                bgClass: 'bg-[#002855]',
                textClass: 'text-white',
                hoverBorderClass: 'hover:border-[#002855]',
                hoverTitleClass: 'group-hover:text-[#002855]',
                hoverBtnClass: 'group-hover:bg-[#002855]',
                title: 'LUMS LCAT & SBASSE',
                description: 'LCAT (90 MCQs in 160 mins: Verbal 45 & Quant 45) and SBASSE Scientific Aptitude (Physics, Chem, Math, Bio) for premier undergraduate admissions.',
                features: ['LCAT: Verbal 45 & Quantitative 45', 'SBASSE: Advanced Scientific Aptitude', '160 Minutes Testing Window'],
                buttonText: 'Open LUMS Portal',
                onAction: () => (onSelectEntranceTrack ? onSelectEntranceTrack('LUMS') : onContinue()),
              },
              {
                id: 'numl',
                categoryBadge: 'NUML Islamabad',
                categoryBadgeClass: 'bg-[#155E75]/15 text-[#155E75]',
                logoSrc: '/logos/academic/numl.png',
                fallbackSrc: 'https://pub-51ccade1f191417389ac7df61830c670.r2.dev/Logos/file_000000001f108208b064cbd5b8dc77f5.png',
                logoAlt: 'NUML Official Logo',
                fallbackText: 'NUML',
                bgClass: 'bg-[#155E75]',
                textClass: 'text-white',
                hoverBorderClass: 'hover:border-[#155E75]',
                hoverTitleClass: 'group-hover:text-[#155E75]',
                hoverBtnClass: 'group-hover:bg-[#155E75]',
                title: 'NUML University Entrance',
                description: '75 MCQs in 60 minutes with no negative marking and 50% passing threshold: English 20, Physics 20, Mathematics 20, Computer Science 15.',
                features: ['75 MCQs in 60 Minutes', 'English 20, Phys 20, Math 20, CS 15', '50% Minimum Passing Criteria'],
                buttonText: 'Open NUML Portal',
                onAction: () => (onSelectEntranceTrack ? onSelectEntranceTrack('NUML') : onContinue()),
              },
              {
                id: 'hitec',
                categoryBadge: 'HITEC Taxila',
                categoryBadgeClass: 'bg-[#7C2D12]/15 text-[#7C2D12]',
                logoSrc: '/logos/academic/hitec.png',
                fallbackSrc: 'https://pub-51ccade1f191417389ac7df61830c670.r2.dev/Logos/file_0000000011a08208bd16b443318357b1.png',
                logoAlt: 'HITEC University Logo',
                fallbackText: 'HITEC',
                bgClass: 'bg-[#7C2D12]',
                textClass: 'text-white',
                hoverBorderClass: 'hover:border-[#7C2D12]',
                hoverTitleClass: 'group-hover:text-[#7C2D12]',
                hoverBtnClass: 'group-hover:bg-[#7C2D12]',
                title: 'HITEC University Taxila',
                description: '100 MCQs in 120 minutes with 50% passing mark: Math 30, Physics 30, Chemistry or CS 20, English 20 with zero negative marking.',
                features: ['100 MCQs in 120 Minutes', 'Math 30, Phys 30, Chem/CS 20, Eng 20', '50% Passing Marks Requirement'],
                buttonText: 'Open HITEC Portal',
                onAction: () => (onSelectEntranceTrack ? onSelectEntranceTrack('HITEC') : onContinue()),
              },
              {
                id: 'nutech',
                categoryBadge: 'NUTECH Islamabad',
                categoryBadgeClass: 'bg-[#14532D]/15 text-[#14532D]',
                logoSrc: '/logos/academic/nutech.png',
                fallbackSrc: 'https://pub-51ccade1f191417389ac7df61830c670.r2.dev/Logos/file_0000000098c08211934c88fe8706c744.png',
                logoAlt: 'NUTECH NUET Official Logo',
                fallbackText: 'NUTECH',
                bgClass: 'bg-[#14532D]',
                textClass: 'text-white',
                hoverBorderClass: 'hover:border-[#14532D]',
                hoverTitleClass: 'group-hover:text-[#14532D]',
                hoverBtnClass: 'group-hover:bg-[#14532D]',
                title: 'NUTECH Entry Test (NUET)',
                description: '200 MCQs in 180 minutes with no negative marking. Engineering (Math 80, Phys 60, Chem/CS 40, Eng 20) and Computing (Math 100, CS/Phys 60, Eng 40).',
                features: ['200 MCQs in 180 Minutes (3 Hours)', 'Engineering & Computing Streams', 'No Negative Marking Scheme'],
                buttonText: 'Open NUTECH Portal',
                onAction: () => (onSelectEntranceTrack ? onSelectEntranceTrack('NUTECH') : onContinue()),
              },
            ].map((track, idx) => (
              <ScrollFadeInCard key={track.id} delayIndex={idx % 3} className="h-full">
                <div
                  onClick={track.onAction}
                  className={`bg-white border border-slate-200/80 card-containment ${track.hoverBorderClass} rounded-2xl p-6 shadow-sm hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 cursor-pointer group flex flex-col justify-between gap-6 relative overflow-hidden h-full`}
                >
                  {/* Top-Right Category Badge */}
                  <div className="absolute top-5 right-5 z-10 pointer-events-none">
                    <span className={`${track.categoryBadgeClass} text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider`}>
                      {track.categoryBadge}
                    </span>
                  </div>

                  <div className="space-y-4">
                    {/* Centered Logo */}
                    <div className="flex justify-center pt-2 pb-1">
                      <div className="w-[108px] h-[108px] sm:w-[116px] sm:h-[116px] flex items-center justify-center shrink-0">
                        <CardLogoImage
                          src={track.logoSrc}
                          fallbackSrc={track.fallbackSrc}
                          alt={track.logoAlt}
                          fallbackText={track.fallbackText}
                          bgClass={track.bgClass}
                          textClass={track.textClass}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h3 className={`font-['Space_Grotesk'] font-extrabold text-xl text-slate-900 ${track.hoverTitleClass} transition-colors break-words min-w-0`}>
                        {track.title}
                      </h3>
                      <p className="text-xs text-slate-600 leading-relaxed font-normal">
                        {track.description}
                      </p>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-slate-100 text-xs text-slate-600 font-medium">
                      {track.features.map((feat, fIdx) => (
                        <div key={fIdx} className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button className={`w-full bg-[#0A1330] text-white ${track.hoverBtnClass} group-hover:text-white font-bold py-3 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer`}>
                    <span>{track.buttonText}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </ScrollFadeInCard>
            ))}
          </div>
        </section>
        </LazySection>

        {/* =========================================================================
            SECTION 5: WHY BOARDLY (COMPARISON TABLE / GRID)
           ========================================================================= */}
        <LazySection rootMargin="300px" minHeight="360px">
        <section id="why-boardly" className="space-y-6">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-[#1E5AFF]">
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Smart Comparison</span>
            </div>
            <h2 className="font-['Space_Grotesk'] text-2xl sm:text-3xl font-black text-slate-900 ">
              Why choose Boardly over traditional coaching academies?
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 ">
              Compare how Boardly redefines test prep efficiency compared to expensive physical academies and generic question apps.
            </p>
          </div>

          <div className="bg-white border border-slate-200/80 card-containment rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm border-collapse min-w-[600px]">
                <thead>
                  <tr className="bg-slate-100/70  border-b border-slate-200  text-slate-900 ">
                    <th className="p-4 sm:p-5 font-black text-xs uppercase tracking-wider w-1/3">
                      Feature / Dimension
                    </th>
                    <th className="p-4 sm:p-5 font-black text-xs uppercase tracking-wider text-[#1E5AFF] bg-[#1E5AFF]/10  w-1/3">
                      Boardly Academy Platform
                    </th>
                    <th className="p-4 sm:p-5 font-black text-xs uppercase tracking-wider text-slate-500  w-1/3">
                      Physical Coaching Academies
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/80  text-slate-700 ">
                  {/* Row 1 */}
                  <AnimatedTableRow delayIndex={0}>
                    <td className="p-4 sm:p-5 font-bold text-slate-900  flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-[#1E5AFF]" />
                      Session Fee
                    </td>
                    <td className="p-4 sm:p-5 font-bold text-emerald-600  bg-[#1E5AFF]/5 ">
                      Free Core Access &middot; Low-cost Student Plans
                    </td>
                    <td className="p-4 sm:p-5 text-slate-500 ">
                      50,000 to 120,000 PKR per session
                    </td>
                  </AnimatedTableRow>

                  {/* Row 2 */}
                  <AnimatedTableRow delayIndex={1}>
                    <td className="p-4 sm:p-5 font-bold text-slate-900  flex items-center gap-2">
                      <Target className="w-4 h-4 text-[#1E5AFF]" />
                      Syllabus Alignment
                    </td>
                    <td className="p-4 sm:p-5 font-bold text-slate-900  bg-[#1E5AFF]/5 ">
                      100% FBISE SLO, PMDC & UET Mapped
                    </td>
                    <td className="p-4 sm:p-5 text-slate-500 ">
                      Outdated paper notes & recycled lists
                    </td>
                  </AnimatedTableRow>

                  {/* Row 3 */}
                  <AnimatedTableRow delayIndex={2}>
                    <td className="p-4 sm:p-5 font-bold text-slate-900  flex items-center gap-2">
                      <Brain className="w-4 h-4 text-[#1E5AFF]" />
                      Instant AI Tutor
                    </td>
                    <td className="p-4 sm:p-5 font-bold text-slate-900  bg-[#1E5AFF]/5 ">
                      24/7 Study Buddy AI step-by-step reasoning
                    </td>
                    <td className="p-4 sm:p-5 text-slate-500 ">
                      Wait for next day’s lecture or TA availability
                    </td>
                  </AnimatedTableRow>

                  {/* Row 4 */}
                  <AnimatedTableRow delayIndex={3}>
                    <td className="p-4 sm:p-5 font-bold text-slate-900  flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-[#1E5AFF]" />
                      Mock Test Simulation
                    </td>
                    <td className="p-4 sm:p-5 font-bold text-slate-900  bg-[#1E5AFF]/5 ">
                      Instant scoring, time telemetry & weak topic analytics
                    </td>
                    <td className="p-4 sm:p-5 text-slate-500 ">
                      Manual paper keys delivered days later
                    </td>
                  </AnimatedTableRow>
                </tbody>
              </table>
            </div>
          </div>
        </section>
        </LazySection>

        {/* =========================================================================
            SECTION 6: STUDY BUDDY AI TUTOR SPOTLIGHT & INTERACTIVE PREVIEW
           ========================================================================= */}
        <LazySection rootMargin="300px" minHeight="400px">
        <section id="study-buddy" className="space-y-6">
          <div className="bg-white border border-slate-200/80 card-containment rounded-3xl p-6 sm:p-8 shadow-sm grid grid-cols-1 lg:grid-cols-2 gap-8 items-center relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-72 h-72 bg-[#1E5AFF]/[0.06] rounded-full blur-3xl pointer-events-none animate-pulse" />

            {/* Left Column: Copy & Highlights */}
            <div className="space-y-5">
              <div className="inline-flex items-center gap-2 bg-[#1E5AFF]/15 text-[#0A1330]  px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider border border-[#1E5AFF]/30">
                <Bot className="w-3.5 h-3.5 text-[#1E5AFF]" />
                <span>24/7 Personal AI Tutor</span>
              </div>

              <div className="space-y-2">
                <h2 className="font-['Space_Grotesk'] text-2xl sm:text-3xl font-black text-slate-900 ">
                  How does Study Buddy AI solve complex numericals and concepts?
                </h2>
                <p className="text-xs sm:text-sm text-slate-600  leading-relaxed font-normal">
                  Never get stuck on a difficult numerical or conceptual MCQ again. Study Buddy AI breaks down complex Physics derivations, Organic reaction mechanisms, and Biology memory mnemonics step-by-step.
                </p>
              </div>

              <div className="space-y-3 text-xs font-semibold text-slate-700 ">
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-[#1E5AFF]/20 text-[#0A1330]  flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                  <span>Instant step-by-step derivations & formula breakdowns</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-[#1E5AFF]/20 text-[#0A1330]  flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                  <span>Tailored explanations aligned with FBISE & PMC syllabus</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-[#1E5AFF]/20 text-[#0A1330]  flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                  <span>Available 24 hours a day, 7 days a week on any device</span>
                </div>
              </div>
            </div>

            {/* Right Column: Simulated Chat Preview Box */}
            <motion.div
              initial={{ opacity: 0, x: 25, scale: 0.98 }}
              whileInView={{ opacity: 1, x: 0, scale: 1 }}
              viewport={{ once: true, amount: 0.01 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="bg-slate-50  border border-slate-200  hover:border-[#1E5AFF]/50 rounded-2xl p-4 sm:p-5 shadow-inner hover:shadow-xl hover:shadow-[#1E5AFF]/10 transition-all space-y-3 font-sans relative"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 ">
                <div className="flex items-center gap-2">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    className="w-7 h-7 rounded-lg bg-[#1E5AFF] text-white font-extrabold text-xs flex items-center justify-center shadow-xs"
                  >
                    <Bot className="w-4 h-4" />
                  </motion.div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">Study Buddy AI</span>
                    <span className="text-[10px] text-emerald-600  font-semibold flex items-center gap-1.5">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                      </span>
                      <span>Online & Ready</span>
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-[#1E5AFF] animate-pulse" />
                  <span>Live Preview</span>
                </span>
              </div>

              {/* Chat Message 1: Student */}
              <div className="flex justify-end">
                <div className="bg-[#1E5AFF]/20 text-slate-900  border border-[#1E5AFF]/30 rounded-2xl rounded-tr-xs p-3 text-xs max-w-[85%] font-medium leading-relaxed">
                  Study Buddy, why does the kinetic energy of emitted photoelectrons depend on frequency and not light intensity?
                </div>
              </div>

              {/* Chat Message 2: Study Buddy AI */}
              <div className="flex justify-start">
                <div className="bg-[#0A1330] border border-[#1E5AFF]/30 text-slate-100 rounded-2xl rounded-tl-xs p-3.5 text-xs max-w-[92%] shadow-sm leading-relaxed relative overflow-hidden">
                  <TypewriterChatPreview
                    fullText={`**Great question! Let’s break this down via Einstein’s Photoelectric Equation:**

$$K.E._{\\text{max}} = h\\\\nu - \\\\Phi$$

* **Frequency ($\\\\nu$):** Determines the energy per photon ($E = h\\\\nu$). Higher frequency = higher photon energy = higher electron kinetic energy.
* **Intensity:** Governs the total number of photons hitting the surface per second, increasing emitted electrons, not their kinetic speed!
* **Work Function ($\\\\Phi$):** Threshold energy needed to eject an electron ($\\\\Phi = h\\\\nu_0$).

✓ **FBISE HSSC Physics Chapter 19 SLO Key Point**`}
                  />
                </div>
              </div>
            </motion.div>
          </div>
        </section>
        </LazySection>

        {/* =========================================================================
            SECTION 7: TESTIMONIALS WITH FILTER TABS (9 CARDS)
           ========================================================================= */}
        <LazySection rootMargin="300px" minHeight="450px">
        <section id="testimonials" className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-1">
            <div>
              <div className="inline-flex items-center gap-1 text-[#1E5AFF] text-xs font-bold mb-1">
                <Star className="w-3.5 h-3.5 fill-[#1E5AFF] text-[#1E5AFF]" />
                <Star className="w-3.5 h-3.5 fill-[#1E5AFF] text-[#1E5AFF]" />
                <Star className="w-3.5 h-3.5 fill-[#1E5AFF] text-[#1E5AFF]" />
                <Star className="w-3.5 h-3.5 fill-[#1E5AFF] text-[#1E5AFF]" />
                <Star className="w-3.5 h-3.5 fill-[#1E5AFF] text-[#1E5AFF]" />
                <span className="text-slate-700  ml-1">4.9 / 5.0 Rating</span>
              </div>
              <h2 className="font-['Space_Grotesk'] text-2xl sm:text-3xl font-black text-slate-900 ">
                Student Success Stories
              </h2>
              <p className="text-xs text-slate-600 ">
                Verified outcomes from students who aced their FBISE & entry tests using Boardly
              </p>
            </div>

            {/* Filter Tabs with Smooth Sliding Pill */}
            <div
              ref={testimonialTabsRef}
              className="relative flex items-center gap-1.5 bg-slate-200/80 p-1 rounded-full text-xs font-bold shrink-0 overflow-hidden"
            >
              {/* Separate Absolutely-Positioned Background Pill */}
              <div
                className="absolute bg-[#1E5AFF] rounded-full shadow-xs pointer-events-none"
                style={{
                  transform: `translateX(${testimonialPillStyle.left}px)`,
                  top: `${testimonialPillStyle.top}px`,
                  width: `${testimonialPillStyle.width}px`,
                  height: `${testimonialPillStyle.height}px`,
                  opacity: testimonialPillStyle.ready ? 1 : 0,
                  transition: 'transform 0.3s ease, width 0.3s ease, opacity 0.15s ease',
                }}
              />

              {(['ALL', 'FBISE', 'MDCAT', 'NET', 'FAST', 'ECAT', 'TCAT'] as const).map((filter) => (
                <button
                  key={filter}
                  ref={registerTestimonialTab(filter)}
                  type="button"
                  onClick={() => {
                    triggerHaptic(HAPTIC_PATTERNS.light);
                    setActiveTrackFilter(filter);
                  }}
                  className={`relative z-10 px-3 py-1.5 rounded-full transition-colors duration-200 cursor-pointer select-none ${
                    activeTrackFilter === filter
                      ? 'text-white font-extrabold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          {/* 3x3 Testimonial Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTestimonials.map((item, idx) => (
              <ScrollFadeInCard key={item.id} delayIndex={idx % 3} className="h-full">
                <div className="bg-white border border-slate-200/80 card-containment rounded-2xl p-5 shadow-sm hover:border-[#F2B90C]/50 hover:shadow-md transition-all flex flex-col justify-between gap-4 h-full">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-0.5 text-amber-500">
                        {[...Array(item.rating)].map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                        ))}
                      </div>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-100  text-slate-600  uppercase tracking-wider">
                        {item.track}
                      </span>
                    </div>

                    <p className="text-xs text-slate-700  leading-relaxed font-normal italic">
                      “{item.quote}”
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100  space-y-2">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-full ${item.avatarBg} border font-black text-xs flex items-center justify-center shrink-0`}
                      >
                        {item.avatarText}
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-xs font-bold text-slate-900  truncate">
                          {item.name}
                        </p>
                        <p className="text-[10px] text-slate-500  font-medium truncate">
                          {item.cityBoard}
                        </p>
                      </div>
                    </div>

                    <div className="inline-block bg-emerald-500/10 text-emerald-700  text-[10px] font-extrabold px-2.5 py-0.5 rounded-md border border-emerald-500/20">
                      ✓ {item.outcome}
                    </div>
                  </div>
                </div>
              </ScrollFadeInCard>
            ))}
          </div>
        </section>
        </LazySection>

        {/* =========================================================================
            SECTION 8: ABOUT US & ORIGIN STORY
           ========================================================================= */}
        <LazySection rootMargin="300px" minHeight="360px">
        <section id="about" className="bg-white border border-slate-200/80 card-containment rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 bg-[#1E5AFF]/15 text-[#0A1330]  px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border border-[#1E5AFF]/30">
              <Globe className="w-3 h-3 text-[#1E5AFF]" />
              <span>Our Mission & Roots</span>
            </div>
            <h2 className="font-['Space_Grotesk'] text-2xl sm:text-3xl font-black text-slate-900 ">
              Who built Boardly and what is our mission?
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            {/* Left: Origin Story */}
            <ScrollFadeInCard delayIndex={0}>
              <div className="space-y-4 text-xs sm:text-sm text-slate-600  leading-relaxed font-normal">
                <div className="p-5 rounded-2xl bg-slate-50  border border-slate-200/80  space-y-3">
                  <div className="flex items-center gap-2 text-slate-900  font-bold text-sm">
                    <Award className="w-4 h-4 text-[#1E5AFF]" />
                    <span>From Late-Night Study Groups to Pakistan's Top AI Platform</span>
                  </div>
                  <p>
                    Boardly started as a humble WhatsApp study group where students across Rawalpindi and Islamabad traded past paper solutions, textbook notes, and high-yield MCQs during late-night exam prep.
                  </p>
                  <p>
                    Seeing how commercial academies charged up to 100,000 PKR for basic test series, our team of former board toppers and software engineers built Boardly — giving every student equal access to chapter-wise question banks and instant AI concept explanations.
                  </p>
                </div>
              </div>
            </ScrollFadeInCard>

            {/* Right: Core Values */}
            <div className="space-y-3">
              <ScrollFadeInCard delayIndex={1}>
                <div className="p-4 rounded-2xl bg-slate-50  border border-slate-200/80  flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-xl bg-[#1E5AFF]/15 text-[#0A1330]  font-black text-xs flex items-center justify-center shrink-0 border border-[#1E5AFF]/30 mt-0.5">
                    <CheckCircle2 className="w-4 h-4 text-[#1E5AFF]" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 ">
                      Syllabus-Accuracy over Generic Content
                    </h3>
                    <p className="text-xs text-slate-600  leading-relaxed font-normal">
                      Every MCQ is mapped directly to Student Learning Outcomes (SLOs), textbook chapters, and exact exam guidelines for FBISE, PMDC MDCAT, and UET Taxila.
                    </p>
                  </div>
                </div>
              </ScrollFadeInCard>

              <ScrollFadeInCard delayIndex={2}>
                <div className="p-4 rounded-2xl bg-slate-50  border border-slate-200/80  flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-xl bg-[#1E5AFF]/15 text-[#0A1330]  font-black text-xs flex items-center justify-center shrink-0 border border-[#1E5AFF]/30 mt-0.5">
                    <Zap className="w-4 h-4 text-[#1E5AFF]" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 ">
                      Explanation-First over Answer-Keys
                    </h3>
                    <p className="text-xs text-slate-600  leading-relaxed font-normal">
                      We don't just show correct options. Every question features step-by-step reasoning, formula derivations, and 24/7 AI Study Buddy chat guidance.
                    </p>
                  </div>
                </div>
              </ScrollFadeInCard>

              <ScrollFadeInCard delayIndex={3}>
                <div className="p-4 rounded-2xl bg-slate-50  border border-slate-200/80  flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-xl bg-[#1E5AFF]/15 text-[#0A1330]  font-black text-xs flex items-center justify-center shrink-0 border border-[#1E5AFF]/30 mt-0.5">
                    <Heart className="w-4 h-4 text-[#1E5AFF]" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 ">
                      Priced for Students, Not Academies
                    </h3>
                    <p className="text-xs text-slate-600  leading-relaxed font-normal">
                      Top-grade test prep shouldn't cost 50,000 PKR. Boardly provides full features, mock tests, and past paper analytics completely free or on accessible student plans. All purchases are final — strict no-refunds policy.
                    </p>
                  </div>
                </div>
              </ScrollFadeInCard>
            </div>
          </div>
        </section>
        </LazySection>

        {/* =========================================================================
            SECTION 9: FAQ ACCORDION
           ========================================================================= */}
        <LazySection rootMargin="300px" minHeight="360px">
        <section id="faq" className="space-y-6">
          <div className="text-center space-y-2 max-w-xl mx-auto">
            <div className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-[#1E5AFF]">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Got Questions?</span>
            </div>
            <h2 className="font-['Space_Grotesk'] text-2xl sm:text-3xl font-black text-slate-900 ">
              Frequently Asked Questions
            </h2>
            <p className="text-xs text-slate-600 ">
              Everything you need to know about Boardly question banks, Study Buddy AI, and mock series.
            </p>
          </div>

          <div className="max-w-3xl mx-auto space-y-3">
            {FAQ_DATA.map((faq, idx) => {
              const isOpen = expandedFaq === idx;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.01 }}
                  transition={{ duration: 0.35, delay: idx * 0.03, ease: [0.16, 1, 0.3, 1] }}
                  whileHover={{ y: -2, transition: { duration: 0.15 } }}
                  className="bg-white border border-slate-200/80 card-containment hover:border-[#1E5AFF]/50 rounded-2xl overflow-hidden transition-colors shadow-xs"
                >
                  <button
                    onClick={() => setExpandedFaq(isOpen ? null : idx)}
                    className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 font-bold text-slate-900  text-xs sm:text-sm cursor-pointer hover:text-[#1E5AFF] transition-colors"
                  >
                    <span>{faq.question}</span>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-[#1E5AFF] shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                        className="px-4 sm:px-5 pb-5 text-xs text-slate-600  leading-relaxed border-t border-slate-100  pt-3 font-normal overflow-hidden"
                      >
                        {faq.answer}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </section>
        </LazySection>

        {/* =========================================================================
            SECTION 10: PRIVACY & TRUST
           ========================================================================= */}
        <LazySection rootMargin="300px" minHeight="300px">
        <section id="privacy" className="bg-white border border-slate-200/80 card-containment rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 bg-emerald-500/10 text-emerald-700  px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border border-emerald-500/30">
              <Shield className="w-3 h-3 text-emerald-500" />
              <span>Privacy & Data Protection</span>
            </div>
            <h2 className="font-['Space_Grotesk'] text-2xl sm:text-3xl font-black text-slate-900 ">
              How does Boardly protect student privacy and data?
            </h2>
            <p className="text-xs text-slate-600  max-w-2xl">
              We adhere to strict data privacy principles to protect student identities and study records.
            </p>
          </div>

          {/* 4-Card Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <ScrollFadeInCard delayIndex={0}>
              <div className="p-4 rounded-2xl bg-slate-50  border border-slate-200/80  hover:border-emerald-500/40 space-y-2 h-full transition-all">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600  border border-emerald-500/30 flex items-center justify-center shrink-0">
                  <Eye className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-bold text-slate-900 ">What We Collect</h3>
                <p className="text-[11px] text-slate-600  leading-relaxed font-normal">
                  Minimal account details (Name, Class, Track, Email/Phone) required purely to sync quiz history, Study Buddy conversations, and performance logs across devices.
                </p>
              </div>
            </ScrollFadeInCard>

            <ScrollFadeInCard delayIndex={1}>
              <div className="p-4 rounded-2xl bg-slate-50  border border-slate-200/80  hover:border-rose-500/40 space-y-2 h-full transition-all">
                <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-600  border border-rose-500/30 flex items-center justify-center shrink-0">
                  <Lock className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-bold text-slate-900 ">What We Never Do</h3>
                <p className="text-[11px] text-slate-600  leading-relaxed font-normal">
                  We never sell your personal data, track background device activity, or share your contact information with commercial third-party telemarketers or advertisers.
                </p>
              </div>
            </ScrollFadeInCard>

            <ScrollFadeInCard delayIndex={2}>
              <div className="p-4 rounded-2xl bg-slate-50  border border-slate-200/80  hover:border-[#1E5AFF]/40 space-y-2 h-full transition-all">
                <div className="w-8 h-8 rounded-lg bg-[#1E5AFF]/15 text-[#0A1330]  border border-[#1E5AFF]/30 flex items-center justify-center shrink-0">
                  <Trash2 className="w-4 h-4 text-[#1E5AFF]" />
                </div>
                <h3 className="text-xs font-bold text-slate-900 ">User Data Control</h3>
                <p className="text-[11px] text-slate-600  leading-relaxed font-normal">
                  You retain full ownership of your data. Request instant account wipes or progress erasures anytime directly from your profile settings or support.
                </p>
              </div>
            </ScrollFadeInCard>

            <ScrollFadeInCard delayIndex={3}>
              <div className="p-4 rounded-2xl bg-slate-50  border border-slate-200/80  hover:border-cyan-500/40 space-y-2 h-full transition-all">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-600  border border-cyan-500/30 flex items-center justify-center shrink-0">
                  <CreditCard className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-bold text-slate-900 ">Transparent Payments & No Refunds</h3>
                <p className="text-[11px] text-slate-600  leading-relaxed font-normal">
                  Payment transfers for optional premium unlocks are logged securely with verified admin receipts. All purchases are final — strict no-refunds policy once payment is submitted.
                </p>
              </div>
            </ScrollFadeInCard>
          </div>

          {/* Links to Legal Policies */}
          <div className="pt-4 border-t border-slate-200/80  flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-xs font-bold text-slate-600 ">
            <button
              onClick={() => setActiveLegalModal('privacy')}
              className="hover:text-[#1E5AFF] transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-[#1E5AFF]" />
              <span>Privacy Policy</span>
            </button>
            <span className="text-slate-300 ">•</span>
            <button
              onClick={() => setActiveLegalModal('terms')}
              className="hover:text-[#1E5AFF] transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-[#1E5AFF]" />
              <span>Terms of Service</span>
            </button>
            <span className="text-slate-300 ">•</span>
            <button
              onClick={() => setActiveLegalModal('no-refunds')}
              className="hover:text-[#1E5AFF] transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-[#1E5AFF]" />
              <span>No Refunds Policy</span>
            </button>
          </div>
        </section>
        </LazySection>

        {/* =========================================================================
            SECTION 11: FINAL CTA BAND
           ========================================================================= */}
        <section className="bg-gradient-to-r from-[#0A1330] via-[#0F1C42] to-[#0A1330]    border border-[#1E5AFF]/30 rounded-3xl p-8 sm:p-12 text-center relative overflow-hidden shadow-xl space-y-6">
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#1E5AFF]/[0.15] rounded-full blur-3xl pointer-events-none animate-pulse" />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#1E5AFF]/[0.05] to-transparent pointer-events-none animate-shimmer" />

          <div className="space-y-3 relative z-10 max-w-xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-[#1E5AFF]/20 border border-[#1E5AFF]/40 text-[#1E5AFF] px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-[#1E5AFF]" />
              <span>Start Free Today</span>
            </div>

            <h2 className="font-['Space_Grotesk'] text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white leading-tight">
              Ready to Ace Your FBISE & Entrance Exams?
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm font-normal leading-relaxed">
              Access chapter-wise MCQs, instant AI explanations, 24/7 Study Buddy tutoring, and full past paper model series completely free.
            </p>
          </div>

          <div className="relative z-10 flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={onSelectGradesFlow || onContinue}
              className="w-full sm:w-auto bg-[#1E5AFF] hover:bg-[#1546CC] text-white font-black py-4 px-8 rounded-full transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg hover:shadow-[#1E5AFF]/30 flex items-center justify-center gap-2 text-sm sm:text-base cursor-pointer group"
            >
              <span>Join 12,000+ Students Free</span>
              <ArrowRight className="w-4 h-4 stroke-[3] group-hover:translate-x-1 transition-transform" />
            </button>

            <a
              href="https://chat.whatsapp.com/L3EYfjDXFNOGTzZjAjRuvg?s=cl&p=a&ilr=1"
              target="_blank"
              rel="noreferrer"
              onClick={() => onOpenCommunity && onOpenCommunity()}
              className="w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold py-4 px-6 rounded-full transition-all duration-300 hover:scale-105 active:scale-95 flex items-center justify-center gap-2 text-xs sm:text-sm cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 text-emerald-400" />
              <span>Join WhatsApp Group</span>
            </a>
          </div>

          <div className="relative z-10 pt-1 text-[11px] sm:text-xs text-slate-300 font-medium flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[#1E5AFF] shrink-0" />
            <span>All purchases are final — no refunds.</span>
          </div>
        </section>

        {/* =========================================================================
            SECTION 12: PROFESSIONAL SITEMAP FOOTER
           ========================================================================= */}
        <LazySection rootMargin="300px" minHeight="280px">
        <footer className="bg-white border border-slate-200/80 card-containment rounded-3xl p-6 sm:p-8 shadow-sm space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 text-xs">
            {/* Column 1: Brand Blurb */}
            <div className="space-y-3 sm:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#0A1330] border border-[#1E5AFF]/40 p-0.5 flex items-center justify-center shadow-xs overflow-hidden shrink-0">
                  <img
                    src="https://i.ibb.co/ymPFp2Wb/Chat-Box-1256234838.jpg"
                    alt="Boardly Logo"
                    className="w-full h-full object-cover rounded-md"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.onerror = null;
                      target.src = '/logo.png';
                    }}
                  />
                </div>
                <span
                  className="text-base font-black tracking-tight text-slate-900 "
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  BOARDLY
                </span>
              </div>
              <p className="text-slate-600  leading-relaxed font-normal">
                Pakistan's premier intelligent MCQ practice platform for FBISE (SSC & HSSC), MDCAT, NUST NET, FAST-NU, ECAT, ETEA, NUMS, GIKI, TCAT, USAT, NED, PIEAS, NAT, IBA, AKU, MUET, LUMS, NUML, HITEC, and NUTECH entrance exams. A dedicated project under{' '}
                <a
                  href="https://shsvirtualacademy.pro"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#1E5AFF] font-bold underline hover:text-[#1546CC]"
                >
                  SHS Virtual Academy
                </a>
                .
              </p>
            </div>

            {/* Column 2: Product Links */}
            <div className="space-y-2.5">
              <p className="font-bold text-slate-900  uppercase tracking-wider text-[11px]">
                Product Tracks (20 Portals)
              </p>
              <ul className="space-y-1.5 text-slate-600  font-medium">
                <li>
                  <button
                    onClick={onSelectGradesFlow || onContinue}
                    className="hover:text-[#1E5AFF] transition-colors cursor-pointer"
                  >
                    FBISE Class 9 – 12 MCQs
                  </button>
                </li>
                <li>
                  <button
                    onClick={onSelectMdcat || onContinue}
                    className="hover:text-rose-500 transition-colors cursor-pointer"
                  >
                    MDCAT Medical Portal
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => (onSelectEntranceTrack ? onSelectEntranceTrack('NET') : onContinue())}
                    className="hover:text-blue-600 transition-colors cursor-pointer"
                  >
                    NUST NET Portal
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => (onSelectEntranceTrack ? onSelectEntranceTrack('FAST') : onContinue())}
                    className="hover:text-cyan-600 transition-colors cursor-pointer"
                  >
                    FAST-NU Admission Portal
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => (onSelectEntranceTrack ? onSelectEntranceTrack('ECAT') : onContinue())}
                    className="hover:text-sky-600 transition-colors cursor-pointer"
                  >
                    UET Lahore ECAT
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => (onSelectEntranceTrack ? onSelectEntranceTrack('ETEA') : onContinue())}
                    className="hover:text-teal-600 transition-colors cursor-pointer"
                  >
                    UET Peshawar ETEA
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => (onSelectEntranceTrack ? onSelectEntranceTrack('NUMS') : onContinue())}
                    className="hover:text-emerald-600 transition-colors cursor-pointer"
                  >
                    NUMS Medical (AMC)
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => (onSelectEntranceTrack ? onSelectEntranceTrack('GIKI') : onContinue())}
                    className="hover:text-indigo-600 transition-colors cursor-pointer"
                  >
                    GIKI Admission Test
                  </button>
                </li>
                <li>
                  <button
                    onClick={onSelectTcat || onContinue}
                    className="hover:text-cyan-500 transition-colors cursor-pointer"
                  >
                    TCAT / UET Taxila Series
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => (onSelectEntranceTrack ? onSelectEntranceTrack('USAT') : onContinue())}
                    className="hover:text-violet-600 transition-colors cursor-pointer"
                  >
                    HEC USAT Portal
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => (onSelectEntranceTrack ? onSelectEntranceTrack('NED') : onContinue())}
                    className="hover:text-[#002D62] transition-colors cursor-pointer"
                  >
                    NED University Karachi
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => (onSelectEntranceTrack ? onSelectEntranceTrack('PIEAS') : onContinue())}
                    className="hover:text-[#1E3A8A] transition-colors cursor-pointer"
                  >
                    PIEAS Islamabad
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => (onSelectEntranceTrack ? onSelectEntranceTrack('NAT') : onContinue())}
                    className="hover:text-[#006A4E] transition-colors cursor-pointer"
                  >
                    NTS NAT Shared Portal
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => (onSelectEntranceTrack ? onSelectEntranceTrack('IBA') : onContinue())}
                    className="hover:text-[#8B0000] transition-colors cursor-pointer"
                  >
                    IBA Karachi Aptitude
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => (onSelectEntranceTrack ? onSelectEntranceTrack('AKU') : onContinue())}
                    className="hover:text-[#005A36] transition-colors cursor-pointer"
                  >
                    Aga Khan University (AKU)
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => (onSelectEntranceTrack ? onSelectEntranceTrack('MUET') : onContinue())}
                    className="hover:text-[#800020] transition-colors cursor-pointer"
                  >
                    MUET Jamshoro
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => (onSelectEntranceTrack ? onSelectEntranceTrack('LUMS') : onContinue())}
                    className="hover:text-[#002855] transition-colors cursor-pointer"
                  >
                    LUMS (LCAT &amp; SBASSE)
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => (onSelectEntranceTrack ? onSelectEntranceTrack('NUML') : onContinue())}
                    className="hover:text-[#155E75] transition-colors cursor-pointer"
                  >
                    NUML University
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => (onSelectEntranceTrack ? onSelectEntranceTrack('HITEC') : onContinue())}
                    className="hover:text-[#7C2D12] transition-colors cursor-pointer"
                  >
                    HITEC University Taxila
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => (onSelectEntranceTrack ? onSelectEntranceTrack('NUTECH') : onContinue())}
                    className="hover:text-[#14532D] transition-colors cursor-pointer"
                  >
                    NUTECH Islamabad (NUET)
                  </button>
                </li>
                <li>
                  {onOpenStudyBuddy && (
                    <button
                      onClick={onOpenStudyBuddy}
                      className="hover:text-[#1E5AFF] transition-colors cursor-pointer"
                    >
                      Study Buddy AI Tutor
                    </button>
                  )}
                </li>
                <li>
                  <button
                    onClick={onOpenLmsPortal}
                    className="hover:text-[#1E5AFF] transition-colors cursor-pointer"
                  >
                    Student LMS Portal
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 3: Community & Info */}
            <div className="space-y-2.5">
              <p className="font-bold text-slate-900  uppercase tracking-wider text-[11px]">
                Community & Info
              </p>
              <ul className="space-y-2 text-slate-600  font-medium">
                <li>
                  <a
                    href="https://shsvirtualacademy.pro"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-[#1E5AFF] transition-colors flex items-center gap-1"
                  >
                    <span>SHS Virtual Academy</span>
                    <ExternalLink className="w-3 h-3 text-[#1E5AFF]" />
                  </a>
                </li>
                <li>
                  <a
                    href="https://chat.whatsapp.com/L3EYfjDXFNOGTzZjAjRuvg?s=cl&p=a&ilr=1"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => onOpenCommunity && onOpenCommunity()}
                    className="hover:text-emerald-500 transition-colors cursor-pointer"
                  >
                    WhatsApp Student Group
                  </a>
                </li>
                <li>
                  <button
                    onClick={onOpenHistory}
                    className="hover:text-[#1E5AFF] transition-colors cursor-pointer"
                  >
                    Test Attempt History
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => scrollToSection('about')}
                    className="hover:text-[#1E5AFF] transition-colors cursor-pointer"
                  >
                    About Us & Mission
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => scrollToSection('testimonials')}
                    className="hover:text-[#1E5AFF] transition-colors cursor-pointer"
                  >
                    Student Success Stories
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 4: Legal & Support */}
            <div className="space-y-2.5">
              <p className="font-bold text-slate-900  uppercase tracking-wider text-[11px]">
                Legal & Support
              </p>
              <ul className="space-y-2 text-slate-600  font-medium">
                <li>
                  <button
                    onClick={() => setActiveLegalModal('privacy')}
                    className="hover:text-[#1E5AFF] transition-colors cursor-pointer"
                  >
                    Privacy Policy
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveLegalModal('terms')}
                    className="hover:text-[#1E5AFF] transition-colors cursor-pointer"
                  >
                    Terms of Service
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveLegalModal('no-refunds')}
                    className="hover:text-[#1E5AFF] transition-colors cursor-pointer"
                  >
                    No Refunds Policy
                  </button>
                </li>
                <li>
                  <a
                    href="mailto:support@boardly.pk"
                    className="hover:text-[#1E5AFF] transition-colors"
                  >
                    Contact Support
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-6 border-t border-slate-200/80  flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500  font-medium text-center sm:text-left">
            <div>
              &copy; {new Date().getFullYear()} Boardly. All rights reserved.
            </div>
            <div className="flex items-center gap-1.5">
              <span>Made with</span>
              <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
              <span>for Pakistan's students.</span>
            </div>
          </div>
        </footer>
        </LazySection>
      </main>

      {/* =========================================================================
          FLOATING BACK TO TOP BUTTON
         ========================================================================= */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-20 right-5 sm:bottom-24 sm:right-6 z-40 pointer-events-none"
          >
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={scrollToTop}
              className="pointer-events-auto w-10 h-10 rounded-full bg-[#0A1330] text-white   backdrop-blur-md border border-slate-700  shadow-lg flex items-center justify-center hover:bg-[#1546CC] transition-all cursor-pointer"
              aria-label="Scroll back to top"
              title="Back to Top"
            >
              <ChevronUp className="w-5 h-5" />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* =========================================================================
          LEGAL POLICIES POPUP MODAL
         ========================================================================= */}
      <AnimatePresence>
        {activeLegalModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60  backdrop-blur-md z-50 flex items-center justify-center p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) setActiveLegalModal(null);
            }}
          >
            <motion.div
              initial={{ scale: 0.92, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.92, y: 20, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-white/85  backdrop-blur-xl border border-slate-200/80  rounded-3xl p-6 sm:p-8 max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl relative text-slate-900  space-y-5"
            >
            <button
              onClick={() => setActiveLegalModal(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100  flex items-center justify-center text-slate-600  hover:text-slate-900  transition-all cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Modal Content - Privacy Policy */}
            {activeLegalModal === 'privacy' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-[#1E5AFF] font-bold text-xs uppercase tracking-wider">
                  <Shield className="w-4 h-4" />
                  <span>Boardly Legal</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black">Privacy Policy</h3>
                <div className="space-y-3 text-xs sm:text-sm text-slate-600  leading-relaxed font-normal">
                  <p>
                    Boardly ("we", "our", or "us") is committed to protecting the privacy of students using our academic exam preparation platform. This Privacy Policy explains how we collect, use, and safeguard your data.
                  </p>

                  <h4 className="font-bold text-slate-900  text-sm">1. Information We Collect</h4>
                  <p>
                    We collect minimal personal information necessary to deliver personalized test preparation, including name, email address/phone number, academic grade/track, and quiz attempt logs.
                  </p>

                  <h4 className="font-bold text-slate-900  text-sm">2. Use of AI & Analytics</h4>
                  <p>
                    Quiz responses and Study Buddy AI chat interactions are processed securely to provide personalized concept explanations, identify weak topics, and improve answer key accuracy.
                  </p>

                  <h4 className="font-bold text-slate-900  text-sm">3. Data Sharing & Third Parties</h4>
                  <p>
                    We do not sell, rent, or trade student personal data to any commercial advertisers or telemarketers. All stored user data is encrypted and accessible only by authorized platform administrators.
                  </p>

                  <h4 className="font-bold text-slate-900  text-sm">4. Data Erasure & Support</h4>
                  <p>
                    Students have the right to request full account deletion or test history resets at any time by contacting support@boardly.pk.
                  </p>
                </div>
              </div>
            )}

            {/* Modal Content - Terms of Service */}
            {activeLegalModal === 'terms' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-[#1E5AFF] font-bold text-xs uppercase tracking-wider">
                  <FileText className="w-4 h-4" />
                  <span>Boardly Legal</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black">Terms of Service</h3>
                <div className="space-y-3 text-xs sm:text-sm text-slate-600  leading-relaxed font-normal">
                  <p>
                    By accessing or using Boardly, you agree to comply with these Terms of Service. Please read them carefully.
                  </p>

                  <h4 className="font-bold text-slate-900  text-sm">1. Academic Use License</h4>
                  <p>
                    Boardly provides educational question banks, AI explanations, and mock test tools for individual student preparation. Question content, explanations, and platform materials may not be commercially redistributed or scraped without express written permission.
                  </p>

                  <h4 className="font-bold text-slate-900  text-sm">2. User Conduct</h4>
                  <p>
                    Users must maintain respectful behavior when submitting inquiries or communicating with support and community groups.
                  </p>

                  <h4 className="font-bold text-slate-900  text-sm">3. Disclaimer</h4>
                  <p>
                    While Boardly strives for 100% curriculum accuracy aligned with FBISE, PMDC, and UET Taxila, official exam scoring remains strictly under the jurisdiction of respective testing authorities.
                  </p>
                </div>
              </div>
            )}

            {/* Modal Content - No Refunds Policy */}
            {activeLegalModal === 'no-refunds' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-[#1E5AFF] font-bold text-xs uppercase tracking-wider">
                  <CreditCard className="w-4 h-4" />
                  <span>Boardly Legal</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black">No Refunds Policy</h3>
                <div className="space-y-3 text-xs sm:text-sm text-slate-600  leading-relaxed font-normal">
                  <div className="p-3 bg-[#1E5AFF]/10 border border-[#1E5AFF]/30 rounded-xl text-[#0A1330]  font-bold text-xs flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#1E5AFF] shrink-0" />
                    <span>Notice: All purchases, plan activations, and fee submissions are strictly final and non-refundable.</span>
                  </div>
                  <p>
                    Boardly provides core chapter practice and mock test tools free of charge. For optional paid premium unlocks or specialized LMS access:
                  </p>

                  <h4 className="font-bold text-slate-900  text-sm">1. All Purchases Are Final</h4>
                  <p>
                    Once payment is submitted and verified, your purchase is final. We do not issue full or partial refunds, exchanges, or returns under any circumstances.
                  </p>

                  <h4 className="font-bold text-slate-900  text-sm">2. Immediate Access to Digital Content</h4>
                  <p>
                    Upon payment verification, students receive immediate access to digital materials, AI features, and premium question banks. Because these digital products are delivered instantly, no refunds or chargebacks are provided.
                  </p>

                  <h4 className="font-bold text-slate-900  text-sm">3. Support & Access Help</h4>
                  <p>
                    If you experience any technical issues with payment verification, receipt screenshots, or accessing your activated course features, please contact our support team at <a href="mailto:support@boardly.pk" className="text-[#1E5AFF] underline font-medium">support@boardly.pk</a>. We are happy to assist you in resolving any account access issues.
                  </p>
                </div>
              </div>
            )}

            <button
              onClick={() => setActiveLegalModal(null)}
              className="w-full bg-[#0A1330] text-white  hover:bg-[#1546CC] font-bold py-3 rounded-full cursor-pointer text-xs active:scale-95 transition-all mt-4"
            >
              Close
            </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
