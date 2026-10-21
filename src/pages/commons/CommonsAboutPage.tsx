import { Link } from 'react-router-dom';
import {
  Share2,
  EyeOff,
  MessageCircle,
  Users,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  BookOpen,
} from 'lucide-react';
import { PageMeta } from '@/components/ui/PageMeta';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/contexts/AuthContext';

export function CommonsAboutPage() {
  const { user } = useAuth();

  return (
    <>
      <PageMeta
        title="Boardly Commons — Student Learning Community"
        description="Learn why Boardly Commons was built: students helping each other learn so education stays accessible to all. Share material freely, talk with the community, post anonymously, or message peers directly."
      />

      <div className="w-full min-h-[calc(100vh-var(--nav-h))] py-12 md:py-16">
        <div className="boardly-container max-w-5xl mx-auto px-4 sm:px-6 space-y-16">
          {/* Header Section */}
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="flex justify-center">
              <Badge color="red-outline" dot>
                Community Square
              </Badge>
            </div>

            <h1
              className="font-dot text-3xl sm:text-5xl font-extrabold tracking-tight text-[var(--text)] leading-tight"
              style={{
                fontFamily: 'var(--font-dot)',
                letterSpacing: '0.01em',
                fontWeight: 900,
              }}
            >
              BOARDLY COMMONS
            </h1>

            <p className="text-base sm:text-lg text-[var(--muted)] leading-relaxed">
              Boardly Commons exists so students can learn together and help each other, ensuring quality educational resources remain free and accessible to all.
            </p>
          </div>

          {/* Why Commons Was Made */}
          <Card className="p-7 sm:p-10 border-[var(--border)] bg-[var(--card)] space-y-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[var(--red)]" />
              <h2 className="text-xl font-bold text-[var(--text)] font-heading">
                Why Boardly Commons Was Made
              </h2>
            </div>
            <p className="text-sm sm:text-base text-[var(--text)] leading-relaxed">
              Education should not be a lonely struggle or an expensive privilege. We created Boardly Commons as an open space where students help one another understand concepts, solve tough problems, and share study resources without paywalls.
            </p>
            <p className="text-sm text-[var(--muted)] leading-relaxed">
              Whether you are looking for chapter notes, stuck on an equation, or want to discuss solutions with fellow students across Pakistan, Commons gives you a welcoming community to grow together.
            </p>
          </Card>

          {/* What You Can Do in Commons (The 4 Core Pillars) */}
          <div className="space-y-6">
            <div className="section-header">
              <Badge color="muted">What You Can Do</Badge>
              <h2>Four Ways to Learn in Commons</h2>
              <p>Everything you need to share, ask, and collaborate with peers.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Pillar 1 */}
              <div className="p-6 rounded-2xl bg-[var(--card)] border border-[var(--border)] flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-[var(--surface-2)] text-[var(--red)] flex items-center justify-center shrink-0">
                  <Share2 size={24} />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-base font-bold text-[var(--text)] font-heading">
                    Share Study Material — Free &amp; No Limit
                  </h3>
                  <p className="text-sm text-[var(--muted)] leading-relaxed">
                    Upload and share handwritten study notes, formula sheets, solved question sets, and chapter summaries. Access and sharing are completely free with no download caps.
                  </p>
                </div>
              </div>

              {/* Pillar 2 */}
              <div className="p-6 rounded-2xl bg-[var(--card)] border border-[var(--border)] flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-[var(--surface-2)] text-[var(--red)] flex items-center justify-center shrink-0">
                  <EyeOff size={24} />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-base font-bold text-[var(--text)] font-heading">
                    Talk Anonymously
                  </h3>
                  <p className="text-sm text-[var(--muted)] leading-relaxed">
                    Never feel shy asking a basic question. Post doubts or questions anonymously to the community without your name or profile being visible to other students.
                  </p>
                </div>
              </div>

              {/* Pillar 3 */}
              <div className="p-6 rounded-2xl bg-[var(--card)] border border-[var(--border)] flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-[var(--surface-2)] text-[var(--red)] flex items-center justify-center shrink-0">
                  <MessageCircle size={24} />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-base font-bold text-[var(--text)] font-heading">
                    Message Each Other Directly, One to One
                  </h3>
                  <p className="text-sm text-[var(--muted)] leading-relaxed">
                    Connect with fellow learners one-to-one to discuss problems in depth, compare solution approaches, and build private study partnerships.
                  </p>
                </div>
              </div>

              {/* Pillar 4 */}
              <div className="p-6 rounded-2xl bg-[var(--card)] border border-[var(--border)] flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-[var(--surface-2)] text-[var(--red)] flex items-center justify-center shrink-0">
                  <Users size={24} />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-base font-bold text-[var(--text)] font-heading">
                    Talk to the Whole Community
                  </h3>
                  <p className="text-sm text-[var(--muted)] leading-relaxed">
                    Engage in open discussions across all subjects. Filter posts by Mathematics, Physics, Chemistry, Biology, or Computer Science to find exactly what you need.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Simple Community Rules */}
          <div className="p-6 sm:p-8 rounded-[24px] bg-[var(--card)] border border-[var(--border)] space-y-6">
            <div className="flex items-center gap-2">
              <ShieldCheck size={20} className="text-[var(--red)]" />
              <h3 className="text-lg font-bold text-[var(--text)] font-heading">
                Simple Community Rules
              </h3>
            </div>

            <p className="text-sm text-[var(--muted)] leading-relaxed">
              To keep Boardly Commons safe, welcoming, and productive for all students, everyone must follow these clear rules:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] flex items-start gap-3">
                <CheckCircle2 size={18} className="text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-semibold text-[var(--text)]">1. Be Respectful</div>
                  <div className="text-xs text-[var(--muted)] mt-1 leading-relaxed">
                    Treat every fellow student with kindness and patience. Disagree politely and support beginners.
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] flex items-start gap-3">
                <CheckCircle2 size={18} className="text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-semibold text-[var(--text)]">2. Stay On Topic</div>
                  <div className="text-xs text-[var(--muted)] mt-1 leading-relaxed">
                    Keep posts and discussions focused on academic subjects, problem-solving, study methods, and educational material.
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] flex items-start gap-3">
                <AlertCircle size={18} className="text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-semibold text-[var(--text)]">3. No Spam</div>
                  <div className="text-xs text-[var(--muted)] mt-1 leading-relaxed">
                    Do not flood feeds with duplicate posts, unrelated links, or commercial promotions.
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] flex items-start gap-3">
                <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-semibold text-[var(--text)]">4. No Bullying or Harassment</div>
                  <div className="text-xs text-[var(--muted)] mt-1 leading-relaxed">
                    Zero tolerance for bullying, abuse, insults, or harassment — including when posting anonymously. Boardly maintains internal author records for safety, and violators will be removed.
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] flex items-start gap-3 sm:col-span-2">
                <AlertCircle size={18} className="text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-semibold text-[var(--text)]">5. No Sharing Personal Details</div>
                  <div className="text-xs text-[var(--muted)] mt-1 leading-relaxed">
                    For your own privacy and safety, never post phone numbers, personal WhatsApp links, residential addresses, or sensitive private information.
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2 text-xs text-[var(--muted)] flex items-center justify-between flex-wrap gap-2">
              <span>Any post or comment violating rules can be reported and will be promptly reviewed.</span>
              <Link to="/commons/guidelines" className="text-[var(--red)] font-semibold hover:underline">
                View Academic Guidelines &rarr;
              </Link>
            </div>
          </div>

          {/* Action Call to Action */}
          <div className="text-center p-8 rounded-[24px] bg-[var(--surface-2)] border border-[var(--border)] space-y-4 max-w-2xl mx-auto">
            <h3
              className="text-2xl font-bold text-[var(--text)]"
              style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}
            >
              Ready to Join the Discussion?
            </h3>
            <p className="text-sm text-[var(--muted)] max-w-md mx-auto">
              Jump into Boardly Commons to share study notes, ask questions, or help a fellow student today.
            </p>

            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              {user ? (
                <Link to="/dashboard/commons" className="btn-red group">
                  <span>Enter Boardly Commons</span>
                  <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                </Link>
              ) : (
                <>
                  <Link to="/login" className="btn-red group">
                    <span>Sign In to Join Commons</span>
                    <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                  </Link>
                  <Link to="/signup" className="btn-outline">
                    <span>Create Free Account</span>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default CommonsAboutPage;
