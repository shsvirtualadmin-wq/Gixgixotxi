import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import { debugTracker, type RedirectEvent, type UserDocFetchStatus } from '@/utils/debugTracker';
import { Activity, ChevronDown, ChevronUp, AlertCircle, RefreshCw } from 'lucide-react';

export function DebugPanel() {
  const location = useLocation();
  const { user, profileLoading: authLoading } = useAuth();
  const { profile, loading: profileHookLoading } = useUserProfile();

  const [isOpen, setIsOpen] = useState(true);
  const [redirects, setRedirects] = useState<RedirectEvent[]>(() => debugTracker.getRedirects());
  const [fetchStatus, setFetchStatus] = useState<UserDocFetchStatus>(() => debugTracker.getUserFetchStatus());
  const [visible, setVisible] = useState(() => debugTracker.isDebugMode());

  useEffect(() => {
    const checkVisibility = () => {
      setVisible(debugTracker.isDebugMode());
    };
    checkVisibility();

    const unsub = debugTracker.subscribe(() => {
      setRedirects([...debugTracker.getRedirects()]);
      setFetchStatus({ ...debugTracker.getUserFetchStatus() });
      checkVisibility();
    });

    return () => unsub();
  }, [location.search]);

  if (!visible) return null;

  const currentRoute = `${location.pathname}${location.search}`;
  const targetExam = profile?.targetExam || profile?.targetUniversity || '(none)';
  const targetTestDate = profile?.targetTestDate || '(none)';
  const role = profile?.role || '(none)';
  const plan = profile?.plan || (profile?.isPremium ? 'pro' : '(none)');
  const profileCompleted = profile?.profileCompleted !== undefined
    ? String(profile.profileCompleted)
    : profile?.onboardingCompleted !== undefined
    ? String(profile.onboardingCompleted)
    : '(unset)';

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 12,
        right: 12,
        zIndex: 99999,
        maxWidth: 380,
        width: 'calc(100vw - 24px)',
        fontSize: '11px',
        fontFamily: 'monospace',
        backgroundColor: '#09090b',
        border: '1px solid #27272a',
        borderRadius: '12px',
        color: '#e4e4e7',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.8), 0 8px 10px -6px rgba(0, 0, 0, 0.8)',
        overflow: 'hidden',
      }}
    >
      {/* Header bar */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px',
          backgroundColor: '#18181b',
          cursor: 'pointer',
          borderBottom: isOpen ? '1px solid #27272a' : 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}>
          <Activity size={13} style={{ color: '#ef4444' }} />
          <span style={{ color: '#ffffff' }}>BOARDLY LIVE DEBUG (?debug=1)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span
            style={{
              padding: '1px 6px',
              borderRadius: '999px',
              backgroundColor: user ? '#064e3b' : '#7f1d1d',
              color: user ? '#6ee7b7' : '#fca5a5',
              fontSize: '10px',
            }}
          >
            {user ? 'AUTH OK' : 'NO AUTH'}
          </span>
          {isOpen ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
        </div>
      </div>

      {isOpen && (
        <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8, maxHeight: '65vh', overflowY: 'auto' }}>
          {/* Auth & Profile Fetch Status */}
          <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: '4px 8px', borderBottom: '1px solid #27272a', paddingBottom: 8 }}>
            <span style={{ color: '#71717a' }}>Auth state:</span>
            <span style={{ color: authLoading ? '#f59e0b' : user ? '#10b981' : '#ef4444' }}>
              {authLoading ? 'loading...' : user ? `signed_in (${user.uid.slice(0, 8)}...)` : 'signed_out'}
            </span>

            <span style={{ color: '#71717a' }}>Email:</span>
            <span style={{ color: '#f4f4f5', wordBreak: 'break-all' }}>{user?.email || 'null'}</span>

            <span style={{ color: '#71717a' }}>users/{'{uid}'}:</span>
            <span style={{ color: fetchStatus.status === 'error' ? '#ef4444' : fetchStatus.status === 'success' ? '#10b981' : '#f59e0b' }}>
              {fetchStatus.status}
              {fetchStatus.durationMs !== undefined ? ` (${fetchStatus.durationMs}ms)` : ''}
              {fetchStatus.code ? ` [${fetchStatus.code}]` : ''}
            </span>

            <span style={{ color: '#71717a' }}>Doc exists:</span>
            <span style={{ color: fetchStatus.docExists ? '#10b981' : '#f59e0b' }}>
              {fetchStatus.docExists === true ? 'Yes (Firestore)' : fetchStatus.docExists === false ? 'No (created/pending)' : 'checking...'}
            </span>

            <span style={{ color: '#71717a' }}>Hook loading:</span>
            <span style={{ color: profileHookLoading ? '#f59e0b' : '#10b981' }}>
              {profileHookLoading ? 'true (fetching)' : 'false (ready)'}
            </span>
          </div>

          {/* Profile fields */}
          <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: '4px 8px', borderBottom: '1px solid #27272a', paddingBottom: 8 }}>
            <span style={{ color: '#71717a' }}>profileCompleted:</span>
            <span style={{ color: profileCompleted === 'true' ? '#10b981' : '#f59e0b', fontWeight: 600 }}>
              {profileCompleted}
            </span>

            <span style={{ color: '#71717a' }}>targetExam:</span>
            <span style={{ color: '#f4f4f5' }}>{targetExam}</span>

            <span style={{ color: '#71717a' }}>targetTestDate:</span>
            <span style={{ color: '#f4f4f5' }}>{targetTestDate}</span>

            <span style={{ color: '#71717a' }}>role:</span>
            <span style={{ color: role === 'superadmin' || role === 'admin' ? '#ef4444' : '#60a5fa' }}>{role}</span>

            <span style={{ color: '#71717a' }}>plan:</span>
            <span style={{ color: '#f4f4f5' }}>{plan}</span>

            <span style={{ color: '#71717a' }}>Current route:</span>
            <span style={{ color: '#38bdf8', wordBreak: 'break-all' }}>{currentRoute}</span>
          </div>

          {/* Last 5 redirects */}
          <div>
            <div style={{ color: '#a1a1aa', fontWeight: 600, marginBottom: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>Last 5 Redirects:</span>
              <span style={{ fontSize: '10px', color: '#71717a' }}>{redirects.length} recorded</span>
            </div>
            {redirects.length === 0 ? (
              <div style={{ color: '#71717a', fontStyle: 'italic' }}>No redirects recorded yet</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {redirects.map((r) => (
                  <div
                    key={r.id}
                    style={{
                      padding: '4px 6px',
                      backgroundColor: '#18181b',
                      borderRadius: '6px',
                      border: '1px solid #27272a',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#f87171' }}>
                      <span>{r.from} &rarr; {r.to}</span>
                      <span style={{ color: '#71717a', fontSize: '9px' }}>{r.timeStr}</span>
                    </div>
                    <div style={{ color: '#a1a1aa', fontSize: '10px', marginTop: 2 }}>
                      trigger: <span style={{ color: '#fbbf24' }}>{r.trigger}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {fetchStatus.status === 'error' && (
            <div style={{ padding: '6px 8px', backgroundColor: '#450a0a', border: '1px solid #991b1b', borderRadius: '6px', color: '#fca5a5' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 700 }}>
                <AlertCircle size={12} />
                <span>Error details:</span>
              </div>
              <div style={{ marginTop: 2, fontSize: '10px', wordBreak: 'break-word' }}>
                {fetchStatus.code}: {fetchStatus.message}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 4 }}>
            <span style={{ fontSize: '9px', color: '#52525b' }}>Boardly Engine v2.4</span>
            <button
              type="button"
              onClick={() => window.location.reload()}
              style={{
                background: '#27272a',
                border: 'none',
                color: '#e4e4e7',
                padding: '2px 8px',
                borderRadius: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                fontSize: '10px',
              }}
            >
              <RefreshCw size={10} /> Reload
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
