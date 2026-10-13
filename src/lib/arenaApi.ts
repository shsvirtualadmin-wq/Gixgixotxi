export interface ArenaSessionConfig {
  registrationOpen: boolean;
  sessionName: string;
  subject: string;
  startsAt: string;
  durationMinutes: number;
  questionCount: number;
}

export interface ArenaStats {
  studentsRegistered: number | null;
  sessionsRun: number | null;
  questionsAnswered: number | null;
}

export interface ArenaRegistrationPayload {
  fullName: string;
  email: string;
  phone: string;
  campus: string;
  city?: string;
  academicLevel?: string;
  consent: boolean;
  honeypot?: string;
  formLoadedAt?: number;
}

export const DEFAULT_ARENA_CONFIG: ArenaSessionConfig = {
  registrationOpen: true,
  sessionName: 'Arena Sprint #1',
  subject: 'Physics & Mathematics',
  startsAt: 'Saturday, 8:00 PM PKT',
  durationMinutes: 45,
  questionCount: 40,
};

export async function getArenaConfig(): Promise<ArenaSessionConfig> {
  try {
    const res = await fetch('/api/arena/config');
    if (!res.ok) throw new Error('Failed to load arena config');
    const data = await res.json();
    if (data.success && data.config) {
      return data.config;
    }
  } catch (err) {
    console.warn('[arenaApi] config fetch fallback:', err);
  }
  return DEFAULT_ARENA_CONFIG;
}

export async function getArenaStats(): Promise<ArenaStats> {
  try {
    const res = await fetch('/api/arena/stats');
    if (!res.ok) throw new Error('Failed to load arena stats');
    const data = await res.json();
    if (data.success && data.stats) {
      return data.stats;
    }
  } catch (err) {
    console.warn('[arenaApi] stats fetch fallback:', err);
  }
  return {
    studentsRegistered: null,
    sessionsRun: null,
    questionsAnswered: null,
  };
}

export async function submitArenaRegistration(payload: ArenaRegistrationPayload): Promise<{ success: boolean; message: string; error?: string }> {
  const res = await fetch('/api/arena/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to complete registration. Please try again.');
  }

  return data;
}
