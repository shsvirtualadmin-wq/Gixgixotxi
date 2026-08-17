export interface StudyStickyNote {
  id: string;
  resourceId: string;
  pageNumber: number;
  text: string;
  color: 'yellow' | 'pink' | 'blue' | 'green' | 'amber';
  xPercent: number; // 0 to 100 relative to page container
  yPercent: number; // 0 to 100 relative to page container
  createdAt: string;
}

export interface StudyHighlight {
  id: string;
  resourceId: string;
  pageNumber: number;
  selectedText: string;
  note?: string;
  color: 'yellow' | 'green' | 'pink' | 'cyan' | 'purple';
  createdAt: string;
}

const STORAGE_KEY_STICKIES = 'boardly_pdf_study_notes_v1';
const STORAGE_KEY_HIGHLIGHTS = 'boardly_pdf_study_highlights_v1';

export function getStudyNotesForResource(resourceId: string): StudyStickyNote[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_STICKIES);
    if (!raw) return [];
    const all: StudyStickyNote[] = JSON.parse(raw);
    return all.filter(n => n.resourceId === resourceId);
  } catch {
    return [];
  }
}

export function saveStudyNotesForResource(resourceId: string, notes: StudyStickyNote[]): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_STICKIES);
    const all: StudyStickyNote[] = raw ? JSON.parse(raw) : [];
    const other = all.filter(n => n.resourceId !== resourceId);
    localStorage.setItem(STORAGE_KEY_STICKIES, JSON.stringify([...other, ...notes]));
  } catch (err) {
    console.error('Failed to save study notes to localStorage:', err);
  }
}

export function getStudyHighlightsForResource(resourceId: string): StudyHighlight[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_HIGHLIGHTS);
    if (!raw) return [];
    const all: StudyHighlight[] = JSON.parse(raw);
    return all.filter(h => h.resourceId === resourceId);
  } catch {
    return [];
  }
}

export function saveStudyHighlightsForResource(resourceId: string, highlights: StudyHighlight[]): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_HIGHLIGHTS);
    const all: StudyHighlight[] = raw ? JSON.parse(raw) : [];
    const other = all.filter(h => h.resourceId !== resourceId);
    localStorage.setItem(STORAGE_KEY_HIGHLIGHTS, JSON.stringify([...other, ...highlights]));
  } catch (err) {
    console.error('Failed to save highlights to localStorage:', err);
  }
}
