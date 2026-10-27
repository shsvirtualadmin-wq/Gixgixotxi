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
} from 'lucide-react';
import { PageMeta } from '@/components/ui/PageMeta';
import { useAuth } from '@/contexts/AuthContext';

export function CommonsAboutPage() {
  const { user } = useAuth();

  return (
    <>
      <PageMeta
        title="Boardly Commons — Student Learning Community"
        description="Learn why Boardly Commons was built: students helping each other learn so education stays accessible to all. Share material freely, talk with the community, post anonymously, or message peers directly."
      />

      <div className="w-full min-h-[calc(100vh-var(--nav-h))] py-12 md:py-20">
        <div className="boardly-container max-w-5xl mx-auto px-4 sm:px-6 space-y-16 sm:space-y-24">
          {/* Header Section */}
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="flex justify-center">
              <span className="section-chip">
                <span className="w-1.5 h-1.5 rounded-full bg-[#D71921] shadow-[0_0_8px_rgba(215,25,33,0.85)] shrink-0" aria-hidden="true" />
                Community Square
              </span>
            </div>

            <h1
              className="section-heading text-3xl sm:text-5xl font-extrabold tracking-tight text-[var(--text)] leading-tight"
              style={{
                fontFamily: 'var(--font-dot)',
                fontSize: 'clamp(28px, 4.2vw, 48px)',
              }}
            >
              BOARDLY COMMONS
            </h1>

            <p className="text-base sm:text-lg text-[var(--muted)] leading-relaxed max-w-2xl mx-auto">
              Boardly Commons exists so students can learn together and help each other, ensuring quality educational resources remain free and accessible to all.
            </p>
          </div>

          {/* Why Commons Was Made (Large Glass Panel) */}
          <div className="relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] pointer-events-none -z-10 blur-3xl opacity-60">
              <div className="w-full h-full bg-[radial-gradient(ellipse_at_center,rgba(215,25,33,0.12)_0%,rgba(215,25,33,0.03)_50%,transparent_75%)]" />
            </div>

            <div className="glass-panel p-7 sm:p-10 lg:p-12 space-y-4 max-w-4xl mx-auto">
              <div className="flex items-center gap-2.5 mb-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#D71921] shadow-[0_0_8px_rgba(215,25,33,0.85)] shrink-0" />
                <h2 className="text-xl sm:text-2xl font-bold text-[var(--text)] font-heading">
                  Why Boardly Commons Was Made
                </h2>
              </div>
              <p className="text-base sm:text-lg text-[var(--text)] font-medium leading-relaxed">
                Education should not be a lonely struggle or an expensive privilege. We created Boardly Commons as an open space where students help one another understand concepts, solve tough problems, and share study resources without paywalls.
              </p>
              <p className="text-sm sm:text-base text-[var(--muted)] leading-relaxed">
                Whether you are looking for chapter notes, stuck on an equation, or want to discuss solutions with fellow students across Pakistan, Commons gives you a welcoming community to grow together.
              </p>
            </div>
          </div>

          {/* What You Can Do in Commons (The 4 Core Pillars) */}
          <div className="space-y-8">
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <div className="flex justify-center">
                <span className="section-chip">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#D71921] shadow-[0_0_8px_rgba(215,25,33,0.85)] shrink-0" aria-hidden="true" />
                  What You Can Do
                </span>
              </div>
              <h2
                className="section-heading text-2xl sm:text-4xl font-extrabold text-[var(--text)]"
                style={{ fontFamily: 'var(--font-dot)', fontSize: 'clamp(24px, 3.4vw, 38px)' }}
              >
                Four Ways to Learn in Commons
              </h2>
              <p className="text-sm sm:text-base text-[var(--muted)] leading-relaxed">
                Everything you need to share, ask, and collaborate with peers.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
              {/* Pillar 1 */}
              <div className="glass-card rounded-[28px] p-6 sm:p-7 flex items-start gap-4 justify-between flex-col sm:flex-row">
                <div className="w-12 h-12 rounded-2xl bg-white/[0.06] border border-white/12 text-[#D71921] flex items-center justify-center shrink-0 shadow-sm">
                  <Share2 size={24} />
                </div>
                <div className="space-y-2 flex-1">
                  <h3 className="text-base sm:text-lg font-bold text-[var(--text)] font-heading">
                    Share Study Material — Free &amp; No Limit
                  </h3>
                  <p className="text-sm text-[var(--muted)] leading-relaxed">
                    Upload and share handwritten study notes, formula sheets, solved question sets, and chapter summaries. Access and sharing are completely free with no download caps.
                  </p>
                </div>
              </div>

              {/* Pillar 2 */}
              <div className="glass-card rounded-[28px] p-6 sm:p-7 flex items-start gap-4 justify-between flex-col sm:flex-row">
                <div className="w-12 h-12 rounded-2xl bg-white/[0.06] border border-white/12 text-[#D71921] flex items-center justify-center shrink-0 shadow-sm">
                  <EyeOff size={24} />
                </div>
                <div className="space-y-2 flex-1">
                  <h3 className="text-base sm:text-lg font-bold text-[var(--text)] font-heading">
                    Talk Anonymously
                  </h3>
                  <p className="text-sm text-[var(--muted)] leading-relaxed">
                    Never feel shy asking a basic question. Post doubts or questions anonymously to the community without your name or profile being visible to other students.
                  </p>
                </div>
              </div>

              {/* Pillar 3 */}
              <div className="glass-card rounded-[28px] p-6 sm:p-7 flex items-start gap-4 justify-between flex-col sm:flex-row">
                <div className="w-12 h-12 rounded-2xl bg-white/[0.06] border border-white/12 text-[#D71921] flex items-center justify-center shrink-0 shadow-sm">
                  <MessageCircle size={24} />
                </div>
                <div className="space-y-2 flex-1">
                  <h3 className="text-base sm:text-lg font-bold text-[var(--text)] font-heading">
                    Message Each Other Directly, One to One
                  </h3>
                  <p className="text-sm text-[var(--muted)] leading-relaxed">
                    Connect with fellow learners one-to-one to discuss problems in depth, compare solution approaches, and build private study partnerships.
                  </p>
                </div>
              </div>

              {/* Pillar 4 */}
              <div className="glass-card rounded-[28px] p-6 sm:p-7 flex items-start gap-4 justify-between flex-col sm:flex-row">
                <div className="w-12 h-12 rounded-2xl bg-white/[0.06] border border-white/12 text-[#D71921] flex items-center justify-center shrink-0 shadow-sm">
                  <Users size={24} />
                </div>
                <div className="space-y-2 flex-1">
                  <h3 className="text-base sm:text-lg font-bold text-[var(--text)] font-heading">
                    Talk to the Whole Community
                  </h3>
                  <p className="text-sm text-[var(--muted)] leading-relaxed">
                    Engage in open discussions across all subjects. Filter posts by Mathematics, Physics, Chemistry, Biology, or Computer Science to find exactly what you need.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Simple Community Rules (Large Glass Panel) */}
          <div className="glass-panel p-7 sm:p-10 lg:p-12 space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center gap-2.5">
              <ShieldCheck size={22} className="text-[#D71921]" />
              <h3 className="text-xl font-bold text-[var(--text)] font-heading">
                Simple Community Rules
              </h3>
            </div>

            <p className="text-sm text-[var(--muted)] leading-relaxed">
              To keep Boardly Commons safe, welcoming, and productive for all students, everyone must follow these clear rules:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="glass-row p-5 flex items-start gap-3.5">
                <CheckCircle2 size={19} className="text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-semibold text-[var(--text)]">1. Be Respectful</div>
                  <div className="text-xs text-[var(--muted)] mt-1.5 leading-relaxed">
                    Treat every fellow student with kindness and patience. Disagree politely and support beginners.
                  </div>
                </div>
              </div>

              <div className="glass-row p-5 flex items-start gap-3.5">
                <CheckCircle2 size={19} className="text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-semibold text-[var(--text)]">2. Stay On Topic</div>
                  <div className="text-xs text-[var(--muted)] mt-1.5 leading-relaxed">
                    Keep posts and discussions focused on academic subjects, problem-solving, study methods, and educational material.
                  </div>
                </div>
              </div>

              <div className="glass-row p-5 flex items-start gap-3.5">
                <AlertCircle size={19} className="text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-semibold text-[var(--text)]">3. No Spam</div>
                  <div className="text-xs text-[var(--muted)] mt-1.5 leading-relaxed">
                    Do not flood feeds with duplicate posts, unrelated links, or commercial promotions.
                  </div>
                </div>
              </div>

              <div className="glass-row p-5 flex items-start gap-3.5">
                <AlertCircle size={19} className="text-red-500 shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-semibold text-[var(--text)]">4. No Bullying or Harassment</div>
                  <div className="text-xs text-[var(--muted)] mt-1.5 leading-relaxed">
                    Zero tolerance for bullying, abuse, insults, or harassment — including when posting anonymously. Boardly maintains internal author records for safety, and violators will be removed.
                  </div>
                </div>
              </div>

              <div className="glass-row p-5 flex items-start gap-3.5 sm:col-span-2">
                <AlertCircle size={19} className="text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-semibold text-[var(--text)]">5. No Sharing Personal Details</div>
                  <div className="text-xs text-[var(--muted)] mt-1.5 leading-relaxed">
                    For your own privacy and safety, never post phone numbers, personal WhatsApp links, residential addresses, or sensitive private information.
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-3 text-xs text-[var(--muted)] flex items-center justify-between flex-wrap gap-2 border-t border-white/[0.08]">
              <span>Any post or comment violating rules can be reported and will be promptly reviewed.</span>
              <Link to="/commons/guidelines" className="text-[#D71921] font-semibold hover:underline">
                View Academic Guidelines &rarr;
              </Link>
            </div>
          </div>

          {/* Action Call to Action (Matching Panel A) */}
          <div className="relative overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] pointer-events-none -z-10 blur-3xl opacity-75">
              <div className="w-full h-full bg-[radial-gradient(ellipse_at_center,rgba(215,25,33,0.18)_0%,rgba(215,25,33,0.04)_50%,transparent_75%)]" />
            </div>

            <div className="glass-panel p-8 sm:p-12 lg:p-14 text-center space-y-4 max-w-4xl mx-auto">
              <h3
                className="section-heading text-2xl sm:text-3xl md:text-4xl font-extrabold text-[var(--text)]"
                style={{ fontFamily: 'var(--font-dot)', fontSize: 'clamp(24px, 3.2vw, 36px)' }}
              >
                Ready to Join the Discussion?
              </h3>
              <p className="text-sm sm:text-base text-[var(--muted)] max-w-md mx-auto">
                Jump into Boardly Commons to share study notes, ask questions, or help a fellow student today.
              </p>

              <div className="pt-2 flex flex-wrap items-center justify-center gap-3.5">
                {user ? (
                  <Link to="/dashboard/commons" className="btn-primary group">
                    <span>Enter Boardly Commons</span>
                    <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                  </Link>
                ) : (
                  <>
                    <Link to="/login" className="btn-primary group">
                      <span>Sign In to Join Commons</span>
                      <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                    </Link>
                    <Link to="/signup" className="btn-secondary">
                      <span>Create Free Account</span>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default CommonsAboutPage;
