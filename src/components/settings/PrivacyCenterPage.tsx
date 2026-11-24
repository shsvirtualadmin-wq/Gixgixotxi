import React from 'react';
import {
  FileText,
  HelpCircle,
  Lock,
  Mail,
  Scale,
  Shield,
  ShieldCheck,
  Sparkles,
  UserCheck,
} from 'lucide-react';
import { SettingsPage } from './SettingsPage';
import { SettingsGroup } from './SettingsGroup';
import { SettingsRow } from './SettingsRow';
import { LEGAL_LAST_UPDATED_LABEL, LEGAL_VERSION_DISPLAY } from '@/constants/legalConsent';
import { useLanguage } from '@/contexts/LanguageContext';

export interface PrivacyCenterPageProps {
  onBack: () => void;
  onNavigate: (path: string) => void;
  onOpenAiPrivacy?: () => void;
  scrollContainer?: 'window' | 'self';
}

const PRIVACY_APPROACH_CARDS = [
  {
    icon: ShieldCheck,
    title: 'Your real name stays private',
    body: 'Boardly keeps your public display name, @username handle, and private real name separate. Only the display name you choose appears across leaderboards, Commons, and profiles.',
  },
  {
    icon: Lock,
    title: 'Encrypted security credentials',
    body: 'Two-step verification secrets are encrypted at rest, verification codes are stored strictly as one-way HMAC hashes, and passkeys never leave your device.',
  },
  {
    icon: UserCheck,
    title: 'Control your active sessions',
    body: 'See every device signed into your Boardly account, remove trusted devices individually, or sign out everywhere in one tap with immediate API enforcement.',
  },
  {
    icon: Sparkles,
    title: 'Built for Pakistani students',
    body: 'We collect only the study progress, test attempts, and account details needed to run your mock tests, rewards, and Study Crews — never sold to third-party brokers.',
  },
];

export const PrivacyCenterPage: React.FC<PrivacyCenterPageProps> = ({
  onBack,
  onNavigate,
  onOpenAiPrivacy,
  scrollContainer = 'window',
}) => {
  const { t } = useLanguage();
  return (
    <SettingsPage title={t('settings.privacy')} onBack={onBack} scrollContainer={scrollContainer}>
      {/* Centered 72px round shield+lock hero */}
      <div className="flex flex-col items-center px-2 pt-4 pb-7 text-center">
        <div
          className="relative flex h-[72px] w-[72px] items-center justify-center rounded-full"
          style={{
            backgroundColor: 'var(--card)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--settings-card-shadow)',
          }}
          aria-hidden="true"
        >
          <Shield className="h-9 w-9" style={{ color: 'var(--accent)' }} strokeWidth={1.75} />
          <Lock
            className="absolute h-4 w-4"
            style={{ color: 'var(--text)' }}
            strokeWidth={2.25}
          />
        </div>

        <h2
          className="mt-4 text-[32px] font-semibold leading-tight tracking-tight"
          style={{ color: 'var(--text)' }}
        >
          {t('settings.privacy')}
        </h2>
        <p
          className="mt-2 max-w-[440px] text-[15px] leading-relaxed"
          style={{ color: 'var(--text-muted)' }}
        >
          {t('settings.privacySub')}
        </p>
      </div>

      {/* Explore your options */}
      <SettingsGroup label={t('settings.groupPrivacySecurity')}>
        <SettingsRow
          icon={<FileText />}
          label={t('settings.privacyPolicy')}
          onClick={() => onNavigate('/privacy')}
        />
        <SettingsRow
          icon={<Scale />}
          label={t('settings.termsOfService')}
          onClick={() => onNavigate('/terms')}
        />
        <SettingsRow
          icon={<Shield />}
          label={t('settings.aboutBoardly')}
          subtitle={LEGAL_LAST_UPDATED_LABEL}
          value={LEGAL_VERSION_DISPLAY}
          chevron="none"
        />
        {onOpenAiPrivacy && (
          <SettingsRow
            icon={<Sparkles />}
            label={t('settings.boardlyAi')}
            subtitle={t('settings.boardlyAiSub')}
            onClick={onOpenAiPrivacy}
          />
        )}
        <SettingsRow
          icon={<Mail />}
          label={t('settings.contactSupport')}
          subtitle={t('settings.privacySub')}
          onClick={() => onNavigate('/contact?topic=privacy')}
        />
      </SettingsGroup>

      {/* Our approach to privacy — horizontal scroll-snap carousel clipped cleanly inside itself */}
      <section className="mb-6">
        <h2
          className="mb-2 ps-4 text-start text-[14px] font-medium leading-snug"
          style={{ color: 'var(--text-muted)' }}
        >
          {t('settings.privacy')}
        </h2>

        <div className="overflow-hidden rounded-[28px]">
          <div
            className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 pe-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            style={{ overscrollBehaviorX: 'contain' }}
          >
            {PRIVACY_APPROACH_CARDS.map((card) => {
              const IconComp = card.icon;
              return (
                <article
                  key={card.title}
                  className="w-[82%] max-w-[320px] shrink-0 snap-start rounded-[28px] p-5"
                  style={{
                    backgroundColor: 'var(--card)',
                    border: '1px solid var(--border)',
                    boxShadow: 'var(--settings-card-shadow)',
                  }}
                >
                  <div
                    className="mb-3 flex h-10 w-10 items-center justify-center rounded-full"
                    style={{
                      backgroundColor: 'var(--bg)',
                      border: '1px solid var(--border)',
                      color: 'var(--accent)',
                    }}
                    aria-hidden="true"
                  >
                    <IconComp className="h-5 w-5" strokeWidth={1.85} />
                  </div>
                  <h3
                    className="text-[16px] font-semibold leading-snug"
                    style={{ color: 'var(--text)' }}
                  >
                    {card.title}
                  </h3>
                  <p
                    className="mt-1.5 text-[14px] leading-relaxed"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {card.body}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* Helpful resources */}
      <SettingsGroup label={t('settings.groupSupport')}>
        <SettingsRow
          icon={<HelpCircle />}
          label={t('settings.contactSupport')}
          onClick={() => onNavigate('/faq')}
        />
        <SettingsRow
          icon={<FileText />}
          label={t('settings.aboutBoardly')}
          subtitle={t('settings.aboutBoardlySub')}
          onClick={() => onNavigate('/about')}
        />
      </SettingsGroup>
    </SettingsPage>
  );
};
