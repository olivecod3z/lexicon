import { BookOpen, Check } from './icons';

export default function FocusFeatures() {
  return <section id="features" className="section wrap focus-section">
    <div className="center-heading"><div className="eyebrow">Room to focus</div><h2>A clearer head.<br /><span className="heading-continuation">A calmer study space.</span></h2><p>From the first upload to the last revision, keep your learning connected.</p></div>
    <div className="focus-feature-grid">
      <article className="focus-feature-card">
        <div className="focus-feature-copy"><h3>A home for every course</h3><p>Keep lectures and study packs together. Pick up where you left off without the folder hunt.</p></div>
        <div role="img" className="focus-feature-art courses-art" aria-label="Sample courses organized in one workspace">
          <div className="course-preview">
            <div className="feature-preview-label">Your courses<span>This semester</span></div>
            <div className="focus-course"><span className="focus-course-icon"><BookOpen size={21} /></span><div><strong>Introduction to Psychology</strong><small>Psy 101</small></div></div>
            <div className="focus-course"><span className="focus-course-icon"><BookOpen size={21} /></span><div><strong>Principles of Economics</strong><small>Eco 102</small></div></div>
            <div className="course-preview-footer">Everything you need, in its place</div>
          </div>
        </div>
      </article>
      <article className="focus-feature-card">
        <div className="focus-feature-copy"><h3>Know where to go next</h3><p>See what you understand and what needs another look, then give your next study session a clear focus.</p></div>
        <div role="img" className="focus-feature-art revision-art" aria-label="Sample revision feedback">
          <div className="revision-preview">
            <div className="feature-preview-label">Your revision overview</div>
            <div className="revision-topic"><span>Active recall</span><span className="revision-status"><Check size={13} /> Looking good</span></div>
            <div className="revision-topic"><span>Spaced repetition</span><span className="revision-status review-status">Review next</span></div>
            <div className="revision-next"><small>Your next session</small><strong>Revisit spaced repetition</strong><p>Build on what you know, one topic at a time.</p></div>
          </div>
        </div>
      </article>
    </div>
  </section>;
}
