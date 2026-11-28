import { useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PageMeta } from '@/components/ui/PageMeta';
import { AiMentorsOverlay } from '@/components/ai/AiMentorsOverlay';
import { AiErrorBoundary } from '@/components/ai/AiErrorBoundary';
import { resolveMentorIdFromParam } from '@/utils/aiMentorsLogic';

export function AiMentorsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialMentor = resolveMentorIdFromParam(searchParams.get('mentor'));

  const handleClose = useCallback(() => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/dashboard', { replace: true });
    }
  }, [navigate]);

  return (
    <>
      <PageMeta
        title="AI Mentors — Boardly"
        description="Chat with Noor, Zain, Sehar, Hamza, Mahnoor, and Aisha — your Boardly AI Mentors."
        noindex={true}
      />
      <AiErrorBoundary scope="chat" onClose={handleClose}>
        <AiMentorsOverlay initialMentor={initialMentor} onClose={handleClose} />
      </AiErrorBoundary>
    </>
  );
}

export default AiMentorsPage;
