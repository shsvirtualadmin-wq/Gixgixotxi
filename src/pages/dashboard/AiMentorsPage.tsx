import { useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PageMeta } from '@/components/ui/PageMeta';
import { AiMentorsOverlay } from '@/components/ai/AiMentorsOverlay';
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
        description="Chat with Noor, Zain, Sehar, Hamza, and Mahnoor — your Boardly AI Mentors."
        noindex={true}
      />
      <AiMentorsOverlay initialMentor={initialMentor} onClose={handleClose} />
    </>
  );
}

export default AiMentorsPage;
