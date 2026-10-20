export type CommonsPostType =
  | 'notes'
  | 'past_paper'
  | 'solved_paper'
  | 'formula_sheet'
  | 'doubt'
  | 'resource_link'
  | 'discussion';

export interface CommonsPostTypeMeta {
  type: CommonsPostType;
  label: string;
  badgeLabel: string;
  iconName: string;
  color: string;
  description: string;
}

export const COMMONS_POST_TYPES: Record<CommonsPostType, CommonsPostTypeMeta> = {
  notes: {
    type: 'notes',
    label: 'Class & Prep Notes',
    badgeLabel: 'Notes',
    iconName: 'BookOpen',
    color: '#D71921',
    description: 'Comprehensive handwritten or typed study summaries & chapter notes',
  },
  past_paper: {
    type: 'past_paper',
    label: 'Past Paper',
    badgeLabel: 'Past Paper',
    iconName: 'FileText',
    color: '#2563EB',
    description: 'Authentic previous year university admission or board exam question papers',
  },
  solved_paper: {
    type: 'solved_paper',
    label: 'Solved Paper & Key',
    badgeLabel: 'Solved Paper',
    iconName: 'CheckCircle2',
    color: '#059669',
    description: 'Worked solutions, step-by-step calculations, and verified answer keys',
  },
  formula_sheet: {
    type: 'formula_sheet',
    label: 'Formula Sheet',
    badgeLabel: 'Formula Sheet',
    iconName: 'Code',
    color: '#7C3AED',
    description: 'High-yield formula cheat sheets, shortcuts, and equation sheets',
  },
  doubt: {
    type: 'doubt',
    label: 'Doubt / Question',
    badgeLabel: 'Question',
    iconName: 'HelpCircle',
    color: '#EA580C',
    description: 'Tricky question, ambiguous option, or concept doubt needing peer breakdown',
  },
  resource_link: {
    type: 'resource_link',
    label: 'Resource Link',
    badgeLabel: 'Resource',
    iconName: 'Link',
    color: '#0D9488',
    description: 'External video lecture, drive folder, textbook link, or simulation',
  },
  discussion: {
    type: 'discussion',
    label: 'Discussion & Strategy',
    badgeLabel: 'Discussion',
    iconName: 'MessageSquare',
    color: '#4B5563',
    description: 'Aggregate merit cutoff queries, preparation strategy, and study schedules',
  },
};

export const COMMONS_POST_TYPES_LIST: CommonsPostTypeMeta[] = Object.values(COMMONS_POST_TYPES);

export function getCommonsPostTypeMeta(type?: string | null): CommonsPostTypeMeta {
  if (type && COMMONS_POST_TYPES && typeof COMMONS_POST_TYPES === 'object' && (COMMONS_POST_TYPES as Record<string, CommonsPostTypeMeta>)[type]) {
    return (COMMONS_POST_TYPES as Record<string, CommonsPostTypeMeta>)[type];
  }
  return (
    COMMONS_POST_TYPES?.notes || {
      type: 'notes',
      label: 'Class & Prep Notes',
      badgeLabel: 'Notes',
      iconName: 'BookOpen',
      color: '#D71921',
      description: 'Comprehensive handwritten or typed study summaries & chapter notes',
    }
  );
}

export interface CommonsFileAttachment {
  name: string;
  size: number;
  type: string;
  url: string;
  storagePath?: string;
  thumbnailUrl?: string;
}

export interface CommonsPost {
  id: string;
  type: CommonsPostType;
  title: string;
  description: string;
  subject: string;
  chapter: string;
  target: string;
  tags: string[];
  files: CommonsFileAttachment[];
  isAnonymous: boolean;
  authorUid: string | null;
  authorName: string;
  authorAvatar: string | null;
  authorFrame?: string | null;
  authorEquippedAvatar?: string | null;
  authorPhotoURL?: string | null;
  authorAlias?: string;
  upvotes: number;
  commentCount: number;
  saveCount: number;
  reportCount: number;
  isHidden: boolean;
  searchKeywords: string[];
  createdAt: any;
  updatedAt: any;
}

export interface CommonsPrivatePost {
  postId: string;
  authorUid: string;
  authorEmail?: string;
  authorName: string;
  createdAt: any;
  isAnonymous: boolean;
}

export interface CommonsComment {
  id: string;
  postId: string;
  authorUid: string | null;
  authorName: string;
  authorAvatar: string | null;
  authorFrame?: string | null;
  authorEquippedAvatar?: string | null;
  authorPhotoURL?: string | null;
  isAnonymous: boolean;
  text: string;
  createdAt: any;
}

export interface CommonsReport {
  id: string;
  postId: string;
  reporterUid: string;
  reason: 'spam' | 'harassment' | 'copyright' | 'inaccurate' | 'other';
  details?: string;
  createdAt: any;
  status: 'pending' | 'reviewed' | 'dismissed';
}

export interface CommonsUserPreview {
  uid: string;
  displayName: string;
  shortId?: string;
  avatarUrl?: string;
  targetUniversity?: string;
  streak?: number;
}
