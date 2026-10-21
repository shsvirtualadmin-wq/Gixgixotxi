import React from 'react';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';
import { HeartHandshake } from 'lucide-react';

export function MissionSection() {
  return (
    <section id="mission" className="landing-section relative">
      <div className="boardly-container">
        <div className="max-w-3xl mx-auto">
          <Card className="p-7 sm:p-10 space-y-6 text-center border-[var(--border)] bg-[var(--card)]">
            <div className="flex justify-center">
              <Badge color="red-outline" dot>
                Why We Built Boardly
              </Badge>
            </div>

            <h2
              className="font-dot text-2xl sm:text-4xl font-extrabold text-[var(--text)] tracking-tight leading-tight"
              style={{
                fontFamily: 'var(--font-dot)',
                letterSpacing: '0.01em',
                fontWeight: 900,
              }}
            >
              Our Mission
            </h2>

            <div className="space-y-4 text-sm sm:text-base text-[var(--text)] leading-relaxed max-w-2xl mx-auto">
              <p>
                Boardly was made to make education accessible to everyone, no matter who they are, where they live, or what they can afford.
              </p>
              <p className="text-[var(--muted)]">
                Good practice and learning tools should not be a privilege for a few students.
              </p>
              <p className="text-[var(--muted)]">
                This is why Boardly has a free tier that is enough for students, very low prices for anything extra, and free, unlimited sharing of study material in Commons.
              </p>
              <p className="text-[var(--muted)]">
                Boardly Commons exists so students can learn together and help each other.
              </p>
            </div>

            <div className="pt-4 border-t border-[var(--border)] flex flex-col sm:flex-row items-center justify-center gap-2 text-xs sm:text-sm text-[var(--muted)]">
              <div className="flex items-center gap-1.5 text-[var(--text)] font-semibold">
                <HeartHandshake size={16} className="text-[var(--red)]" />
                <span>Founded by Muhammad Hashir</span>
              </div>
              <span className="hidden sm:inline">&bull;</span>
              <span>
                A project of{' '}
                <a
                  href="https://shsvirtualacademy.pro"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--red)] font-semibold hover:underline"
                >
                  SHS Virtual Academy
                </a>
              </span>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}

export default MissionSection;
