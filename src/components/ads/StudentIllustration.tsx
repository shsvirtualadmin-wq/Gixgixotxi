import React from 'react';

export type StudentIllustrationId =
  | 'girl-books'
  | 'boy-phone'
  | 'crew-together'
  | 'girl-laptop'
  | 'boy-trophy'
  | 'girl-celebrating'
  | 'boy-notes'
  | 'girl-phone'
  | 'boy-laptop'
  | 'girl-trophy'
  | 'crew-celebrate'
  | 'boy-books';

export interface StudentIllustrationProps {
  illustrationId: StudentIllustrationId;
  /** Optional real student photo URL (for future use with permission) */
  imageUrl?: string | null;
  imageAlt?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZE_CLASSES: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'w-[74px] h-[74px] sm:w-[88px] sm:h-[88px]',
  md: 'w-[92px] h-[92px] sm:w-[116px] sm:h-[116px]',
  lg: 'w-[168px] h-[168px] sm:w-[210px] sm:h-[210px]',
};

/**
 * Consistent flat/vector student character illustrations drawn as lightweight inline SVGs.
 * Original characters (boys & girls studying, celebrating, holding books/phone/laptop/trophy).
 * Accepts an optional `imageUrl` prop so real student photos with permission can drop right in.
 */
export const StudentIllustration: React.FC<StudentIllustrationProps> = ({
  illustrationId,
  imageUrl,
  imageAlt = 'Student studying with Boardly',
  size = 'md',
  className = '',
}) => {
  const sizeClass = SIZE_CLASSES[size];

  if (imageUrl) {
    return (
      <div
        className={`relative shrink-0 overflow-hidden rounded-2xl border-2 border-white/35 bg-white/15 shadow-lg ${sizeClass} ${className}`}
      >
        <img
          src={imageUrl}
          alt={imageAlt}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  return (
    <div
      aria-hidden="true"
      className={`relative shrink-0 select-none ${sizeClass} ${className}`}
    >
      <svg
        viewBox="0 0 160 160"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-full w-full drop-shadow-[0_8px_16px_rgba(18,6,38,0.28)]"
      >
        {/* Soft circular backdrop badge */}
        <circle cx="80" cy="84" r="64" fill="rgba(255,255,255,0.16)" />
        <circle cx="80" cy="84" r="54" fill="rgba(255,210,63,0.18)" />
        {renderCharacter(illustrationId)}
      </svg>
    </div>
  );
};

function renderCharacter(id: StudentIllustrationId): React.ReactNode {
  switch (id) {
    case 'girl-books':
      return (
        <>
          {/* Hijab / hair back */}
          <path d="M48 64C48 40 62 28 80 28C98 28 112 40 112 64V94H48V64Z" fill="#2A1B4E" />
          {/* Scarf accent */}
          <path d="M52 68C52 46 64 34 80 34C96 34 108 46 108 68V102H52V68Z" fill="#FF7EB6" />
          {/* Shoulders / sweater */}
          <path d="M40 138C42 108 58 96 80 96C102 96 118 108 120 138H40Z" fill="#FFFFFF" />
          <path d="M58 98L80 112L102 98" stroke="#5B14B8" strokeWidth="4" strokeLinecap="round" />
          {/* Face */}
          <ellipse cx="80" cy="64" rx="20" ry="22" fill="#F2B88B" />
          {/* Eyes & smile */}
          <circle cx="72" cy="63" r="2.6" fill="#1E1030" />
          <circle cx="88" cy="63" r="2.6" fill="#1E1030" />
          <path d="M74 73C77 77 83 77 86 73" stroke="#1E1030" strokeWidth="2.6" strokeLinecap="round" />
          <circle cx="66" cy="69" r="3" fill="#FF8DA1" opacity="0.55" />
          <circle cx="94" cy="69" r="3" fill="#FF8DA1" opacity="0.55" />
          {/* Stack of books held in front */}
          <rect x="44" y="106" width="72" height="14" rx="4" fill="#FFD23F" stroke="#1A0B2E" strokeWidth="2" />
          <rect x="48" y="94" width="64" height="13" rx="4" fill="#38BDF8" stroke="#1A0B2E" strokeWidth="2" />
          <rect x="52" y="83" width="56" height="12" rx="4" fill="#A855F7" stroke="#1A0B2E" strokeWidth="2" />
          {/* Hands */}
          <circle cx="52" cy="113" r="7" fill="#F2B88B" />
          <circle cx="108" cy="113" r="7" fill="#F2B88B" />
          {/* Floating stars */}
          <circle cx="30" cy="48" r="4" fill="#FFD23F" />
          <circle cx="132" cy="54" r="3.5" fill="#FFFFFF" />
        </>
      );

    case 'boy-phone':
      return (
        <>
          {/* Hoodie body */}
          <path d="M40 140C42 108 58 96 80 96C102 96 118 108 120 140H40Z" fill="#38BDF8" />
          <path d="M62 98H98L92 126H68L62 98Z" fill="#1E3A8A" opacity="0.3" />
          {/* Neck */}
          <rect x="73" y="84" width="14" height="16" rx="6" fill="#E3A476" />
          {/* Head */}
          <ellipse cx="80" cy="64" rx="21" ry="23" fill="#E3A476" />
          {/* Curly hair */}
          <path d="M58 58C56 40 68 30 82 31C96 32 104 42 102 58C97 48 88 45 78 46C69 47 63 51 58 58Z" fill="#1C1427" />
          {/* Glasses */}
          <rect x="65" y="57" width="12" height="9" rx="3" stroke="#1C1427" strokeWidth="2.4" fill="rgba(255,255,255,0.25)" />
          <rect x="83" y="57" width="12" height="9" rx="3" stroke="#1C1427" strokeWidth="2.4" fill="rgba(255,255,255,0.25)" />
          <line x1="77" y1="61" x2="83" y2="61" stroke="#1C1427" strokeWidth="2.2" />
          <circle cx="71" cy="61.5" r="2" fill="#1C1427" />
          <circle cx="89" cy="61.5" r="2" fill="#1C1427" />
          <path d="M75 74C78 77 83 77 86 74" stroke="#1C1427" strokeWidth="2.4" strokeLinecap="round" />
          {/* Smartphone in hands */}
          <rect x="63" y="96" width="34" height="48" rx="7" fill="#1A0B2E" stroke="#FFFFFF" strokeWidth="2.5" />
          <rect x="67" y="102" width="26" height="34" rx="3" fill="#FFD23F" />
          <rect x="70" y="107" width="20" height="4" rx="2" fill="#5B14B8" />
          <rect x="70" y="114" width="14" height="4" rx="2" fill="#5B14B8" opacity="0.65" />
          <circle cx="80" cy="127" r="4" fill="#10B981" />
          {/* Hands gripping phone */}
          <circle cx="62" cy="120" r="6.5" fill="#E3A476" />
          <circle cx="98" cy="120" r="6.5" fill="#E3A476" />
          {/* Spark accents */}
          <rect x="118" y="42" width="14" height="14" rx="4" fill="#FFD23F" transform="rotate(15 118 42)" />
        </>
      );

    case 'crew-together':
      return (
        <>
          {/* Left student (boy) */}
          <path d="M24 140C26 112 38 102 54 102C70 102 80 112 82 140H24Z" fill="#FFD23F" />
          <ellipse cx="54" cy="74" rx="17" ry="19" fill="#DDA070" />
          <path d="M36 70C36 55 45 48 56 49C66 50 72 57 71 70C65 62 58 60 49 61C43 62 39 65 36 70Z" fill="#1E142B" />
          <circle cx="48" cy="74" r="2.3" fill="#1E142B" />
          <circle cx="60" cy="74" r="2.3" fill="#1E142B" />
          <path d="M50 82C52 85 56 85 58 82" stroke="#1E142B" strokeWidth="2.2" strokeLinecap="round" />

          {/* Right student (girl) */}
          <path d="M84 56C84 42 94 34 108 34C122 34 132 44 132 62V94H84V56Z" fill="#2A1645" />
          <path d="M78 140C80 112 92 102 108 102C124 102 136 112 138 140H78Z" fill="#FF7EB6" />
          <ellipse cx="108" cy="74" rx="17" ry="19" fill="#F4BE94" />
          <path d="M91 66C95 54 105 51 118 54C123 56 125 62 125 68C118 62 107 60 91 66Z" fill="#2A1645" />
          <circle cx="102" cy="74" r="2.3" fill="#1E142B" />
          <circle cx="114" cy="74" r="2.3" fill="#1E142B" />
          <path d="M104 82C106 85 110 85 112 82" stroke="#1E142B" strokeWidth="2.2" strokeLinecap="round" />

          {/* Shared open notebook */}
          <path d="M50 116L80 124L110 116V140L80 144L50 140V116Z" fill="#FFFFFF" stroke="#1A0B2E" strokeWidth="2" />
          <line x1="80" y1="124" x2="80" y2="144" stroke="#5B14B8" strokeWidth="2" />
          {/* Streak badge floating above */}
          <circle cx="80" cy="40" r="14" fill="#FFD23F" stroke="#FFFFFF" strokeWidth="2.5" />
          <path d="M80 31C84 36 86 39 85 43C84 46 82 48 80 48C78 48 75 46 75 42C75 39 77 36 80 31Z" fill="#D6247A" />
        </>
      );

    case 'girl-laptop':
      return (
        <>
          {/* Long hair */}
          <path d="M48 64C48 38 62 28 80 28C98 28 112 38 112 64V104H48V64Z" fill="#1F1233" />
          {/* Top */}
          <path d="M40 138C42 108 58 96 80 96C102 96 118 108 120 138H40Z" fill="#A855F7" />
          {/* Face */}
          <ellipse cx="80" cy="64" rx="20" ry="22" fill="#F1B68A" />
          <path d="M60 58C64 46 76 42 94 48C99 50 100 56 100 60C90 54 74 52 60 58Z" fill="#1F1233" />
          <circle cx="72" cy="64" r="2.5" fill="#1F1233" />
          <circle cx="88" cy="64" r="2.5" fill="#1F1233" />
          <path d="M74 74C77 77 83 77 86 74" stroke="#1F1233" strokeWidth="2.4" strokeLinecap="round" />
          {/* Open laptop */}
          <rect x="42" y="100" width="76" height="40" rx="7" fill="#FFFFFF" stroke="#1A0B2E" strokeWidth="2.5" />
          <rect x="48" y="106" width="64" height="28" rx="4" fill="#2A124C" />
          {/* Formula graphic on screen */}
          <path d="M56 124L68 114L78 122L94 110L104 118" stroke="#FFD23F" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="80" cy="103" r="1.5" fill="#5B14B8" />
          <rect x="34" y="138" width="92" height="7" rx="3.5" fill="#E2E8F0" />
        </>
      );

    case 'boy-trophy':
      return (
        <>
          {/* Jacket */}
          <path d="M40 140C42 108 58 96 80 96C102 96 118 108 120 140H40Z" fill="#FFFFFF" />
          <path d="M66 96H94L88 140H72L66 96Z" fill="#5B14B8" />
          {/* Head */}
          <ellipse cx="80" cy="64" rx="20" ry="22" fill="#DE9D6E" />
          <path d="M59 58C59 42 70 32 84 33C97 34 103 44 101 58C95 49 85 46 74 48C66 49 62 53 59 58Z" fill="#1A1226" />
          <circle cx="72" cy="63" r="2.5" fill="#1A1226" />
          <circle cx="88" cy="63" r="2.5" fill="#1A1226" />
          <path d="M73 72C77 77 83 77 87 72" stroke="#1A1226" strokeWidth="2.6" strokeLinecap="round" />
          {/* Raised trophy on right */}
          <path d="M108 76H136L131 98C130 103 126 106 122 106C118 106 114 103 113 98L108 76Z" fill="#FFD23F" stroke="#1A0B2E" strokeWidth="2" />
          <rect x="118" y="106" width="8" height="10" fill="#F59E0B" />
          <rect x="111" y="116" width="22" height="7" rx="3" fill="#FFD23F" stroke="#1A0B2E" strokeWidth="2" />
          {/* Hand holding trophy */}
          <circle cx="122" cy="112" r="6" fill="#DE9D6E" />
          {/* Stars */}
          <circle cx="36" cy="46" r="4.5" fill="#FFD23F" />
          <circle cx="128" cy="44" r="4" fill="#FFD23F" />
          <circle cx="114" cy="34" r="2.5" fill="#FFFFFF" />
        </>
      );

    case 'girl-celebrating':
      return (
        <>
          {/* Raised celebrating arms */}
          <path d="M46 114L30 76" stroke="#F4BE94" strokeWidth="11" strokeLinecap="round" />
          <path d="M114 114L130 76" stroke="#F4BE94" strokeWidth="11" strokeLinecap="round" />
          {/* Hair ponytail */}
          <circle cx="106" cy="48" r="14" fill="#23123A" />
          <path d="M56 64C56 42 66 32 80 32C94 32 104 42 104 64V88H56V64Z" fill="#23123A" />
          {/* Sweater */}
          <path d="M44 140C46 110 60 98 80 98C100 98 114 110 116 140H44Z" fill="#FFD23F" />
          {/* Face */}
          <ellipse cx="80" cy="66" rx="19" ry="21" fill="#F4BE94" />
          <path d="M68 62C70 59 74 59 76 62" stroke="#1E1030" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M84 62C86 59 90 59 92 62" stroke="#1E1030" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M72 73C76 79 84 79 88 73Z" fill="#D6247A" />
          {/* Confetti dots */}
          <rect x="28" y="42" width="8" height="8" rx="2" fill="#FFD23F" transform="rotate(20 28 42)" />
          <rect x="124" y="40" width="8" height="8" rx="2" fill="#38BDF8" transform="rotate(-18 124 40)" />
          <circle cx="52" cy="32" r="4" fill="#FF7EB6" />
          <circle cx="114" cy="30" r="3.5" fill="#FFFFFF" />
        </>
      );

    case 'boy-notes':
      return (
        <>
          {/* Shirt */}
          <path d="M40 140C42 108 58 96 80 96C102 96 118 108 120 140H40Z" fill="#10B981" />
          <path d="M68 96L80 110L92 96" fill="#FFFFFF" />
          {/* Head */}
          <ellipse cx="80" cy="64" rx="20" ry="22" fill="#E6A97C" />
          <path d="M58 58C60 40 72 30 86 32C98 34 103 44 101 58C94 48 82 46 70 49C64 51 61 54 58 58Z" fill="#1F162B" />
          <circle cx="72" cy="64" r="2.5" fill="#1F162B" />
          <circle cx="88" cy="64" r="2.5" fill="#1F162B" />
          <path d="M75 74C78 76.5 82 76.5 85 74" stroke="#1F162B" strokeWidth="2.4" strokeLinecap="round" />
          {/* Notebook & pencil */}
          <rect x="48" y="102" width="58" height="40" rx="6" fill="#FFFFFF" stroke="#1A0B2E" strokeWidth="2.2" />
          <line x1="56" y1="114" x2="96" y2="114" stroke="#8A2BE2" strokeWidth="3" strokeLinecap="round" />
          <line x1="56" y1="123" x2="88" y2="123" stroke="#8A2BE2" strokeWidth="3" strokeLinecap="round" opacity="0.6" />
          <line x1="56" y1="132" x2="78" y2="132" stroke="#D6247A" strokeWidth="3" strokeLinecap="round" />
          {/* Pencil */}
          <path d="M100 124L122 96L128 101L106 129L98 131L100 124Z" fill="#FFD23F" stroke="#1A0B2E" strokeWidth="2" />
        </>
      );

    case 'girl-phone':
      return (
        <>
          {/* Hijab / scarf */}
          <path d="M50 64C50 40 64 28 80 28C96 28 110 40 110 64V98H50V64Z" fill="#38BDF8" />
          {/* Cardigan */}
          <path d="M40 140C42 108 58 96 80 96C102 96 118 108 120 140H40Z" fill="#F8FAFC" />
          {/* Face */}
          <ellipse cx="80" cy="64" rx="19" ry="21" fill="#F0B488" />
          {/* Round glasses */}
          <circle cx="72" cy="63" r="6" stroke="#1A0B2E" strokeWidth="2.2" fill="rgba(255,255,255,0.25)" />
          <circle cx="88" cy="63" r="6" stroke="#1A0B2E" strokeWidth="2.2" fill="rgba(255,255,255,0.25)" />
          <line x1="78" y1="63" x2="82" y2="63" stroke="#1A0B2E" strokeWidth="2" />
          <circle cx="72" cy="63" r="2" fill="#1A0B2E" />
          <circle cx="88" cy="63" r="2" fill="#1A0B2E" />
          <path d="M75 74C78 77 82 77 85 74" stroke="#1A0B2E" strokeWidth="2.3" strokeLinecap="round" />
          {/* Smartphone with checkmark */}
          <rect x="64" y="98" width="32" height="44" rx="7" fill="#1A0B2E" stroke="#FFFFFF" strokeWidth="2.2" />
          <rect x="68" y="104" width="24" height="32" rx="3" fill="#A855F7" />
          <path d="M74 120L78.5 124.5L87 115" stroke="#FFD23F" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="62" cy="122" r="6" fill="#F0B488" />
          <circle cx="98" cy="122" r="6" fill="#F0B488" />
        </>
      );

    case 'boy-laptop':
      return (
        <>
          {/* Hoodie */}
          <path d="M38 140C40 108 56 96 80 96C104 96 120 108 122 140H38Z" fill="#FF7EB6" />
          {/* Head */}
          <ellipse cx="80" cy="62" rx="20" ry="22" fill="#D9986A" />
          <path d="M58 56C59 39 70 30 83 31C96 32 103 42 101 56C94 46 82 44 69 47C63 49 60 52 58 56Z" fill="#1B1228" />
          <circle cx="72" cy="62" r="2.5" fill="#1B1228" />
          <circle cx="88" cy="62" r="2.5" fill="#1B1228" />
          <path d="M74 72C77 75 83 75 86 72" stroke="#1B1228" strokeWidth="2.4" strokeLinecap="round" />
          {/* Laptop */}
          <rect x="44" y="100" width="72" height="38" rx="6" fill="#FFFFFF" stroke="#1A0B2E" strokeWidth="2.2" />
          <rect x="50" y="106" width="60" height="26" rx="3" fill="#1E1036" />
          {/* Timer pill on laptop */}
          <rect x="60" y="113" width="40" height="12" rx="6" fill="#FFD23F" />
          <rect x="68" y="117" width="24" height="4" rx="2" fill="#1A0B2E" />
          <rect x="36" y="138" width="88" height="6" rx="3" fill="#E2E8F0" />
        </>
      );

    case 'girl-trophy':
      return (
        <>
          {/* Hair */}
          <path d="M48 64C48 38 62 28 80 28C98 28 112 38 112 64V96H48V64Z" fill="#23123A" />
          {/* Blazer */}
          <path d="M40 140C42 108 58 96 80 96C102 96 118 108 120 140H40Z" fill="#FFFFFF" />
          <path d="M68 96L80 116L92 96" fill="#FFD23F" />
          {/* Face */}
          <ellipse cx="80" cy="64" rx="19" ry="21" fill="#F2B88B" />
          <path d="M61 56C66 44 78 41 95 48C99 50 100 55 100 58C90 52 74 51 61 56Z" fill="#23123A" />
          <circle cx="72" cy="64" r="2.5" fill="#1E1030" />
          <circle cx="88" cy="64" r="2.5" fill="#1E1030" />
          <path d="M74 73C77 77 83 77 86 73" stroke="#1E1030" strokeWidth="2.4" strokeLinecap="round" />
          {/* Certificate / Captain Badge */}
          <rect x="46" y="106" width="68" height="34" rx="6" fill="#FFD23F" stroke="#1A0B2E" strokeWidth="2.2" />
          <line x1="56" y1="118" x2="88" y2="118" stroke="#1A0B2E" strokeWidth="3" strokeLinecap="round" />
          <line x1="56" y1="127" x2="80" y2="127" stroke="#5B14B8" strokeWidth="3" strokeLinecap="round" />
          <circle cx="100" cy="123" r="8" fill="#D6247A" stroke="#FFFFFF" strokeWidth="2" />
        </>
      );

    case 'crew-celebrate':
      return (
        <>
          {/* High-five burst in center */}
          <circle cx="80" cy="54" r="16" fill="#FFD23F" />
          <path d="M80 43V65M69 54H91" stroke="#5B14B8" strokeWidth="3.5" strokeLinecap="round" />
          {/* Left girl */}
          <path d="M26 140C28 112 38 102 54 102C68 102 78 112 80 140H26Z" fill="#38BDF8" />
          <ellipse cx="54" cy="78" rx="16" ry="18" fill="#F2B88B" />
          <path d="M38 72C40 58 48 52 58 54C67 56 71 64 70 74C63 66 53 64 38 72Z" fill="#23123A" />
          <circle cx="49" cy="78" r="2.2" fill="#1E1030" />
          <circle cx="59" cy="78" r="2.2" fill="#1E1030" />
          <path d="M50 86C52 89 56 89 58 86" stroke="#1E1030" strokeWidth="2.2" strokeLinecap="round" />
          {/* Right boy */}
          <path d="M80 140C82 112 92 102 106 102C122 102 132 112 134 140H80Z" fill="#FFFFFF" />
          <ellipse cx="106" cy="78" rx="16" ry="18" fill="#DC9C6E" />
          <path d="M90 74C91 59 100 52 110 54C119 56 123 64 122 74C116 66 105 64 90 74Z" fill="#1A1226" />
          <circle cx="101" cy="78" r="2.2" fill="#1A1226" />
          <circle cx="111" cy="78" r="2.2" fill="#1A1226" />
          <path d="M102 86C104 89 108 89 110 86" stroke="#1A1226" strokeWidth="2.2" strokeLinecap="round" />
        </>
      );

    case 'boy-books':
    default:
      return (
        <>
          {/* Backpack straps */}
          <rect x="44" y="96" width="72" height="44" rx="14" fill="#5B14B8" />
          {/* Shirt */}
          <path d="M44 140C46 110 60 98 80 98C100 98 114 110 116 140H44Z" fill="#FFD23F" />
          <rect x="54" y="100" width="7" height="36" rx="3.5" fill="#1A0B2E" />
          <rect x="99" y="100" width="7" height="36" rx="3.5" fill="#1A0B2E" />
          {/* Head */}
          <ellipse cx="80" cy="64" rx="20" ry="22" fill="#E3A476" />
          <path d="M58 58C59 41 70 31 83 32C96 33 103 43 101 58C94 48 82 46 69 49C63 50 60 53 58 58Z" fill="#1E142B" />
          <circle cx="72" cy="64" r="2.5" fill="#1E142B" />
          <circle cx="88" cy="64" r="2.5" fill="#1E142B" />
          <path d="M74 74C77 77 83 77 86 74" stroke="#1E142B" strokeWidth="2.5" strokeLinecap="round" />
          {/* Textbook held */}
          <rect x="52" y="108" width="56" height="30" rx="5" fill="#FFFFFF" stroke="#1A0B2E" strokeWidth="2.2" />
          <rect x="58" y="114" width="22" height="6" rx="2" fill="#D6247A" />
          <rect x="58" y="124" width="38" height="4" rx="2" fill="#5B14B8" opacity="0.55" />
        </>
      );
  }
}

export default StudentIllustration;
