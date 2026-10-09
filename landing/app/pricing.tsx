import { Check } from './icons';
import policy from '../../shared/plan-policy.json';

const plans = [
  { name: 'Free' as const, headline: 'Start learning, completely free.',
    description: 'Turn your lectures into useful study materials and discover a better way to revise.',
    features: ['Study notes and flashcards', '5 MCQs, 3 fill-in-the-gap questions, and 2 theory prompts', 'Unlimited retries of generated practice', 'Saved lecture materials'],
    planned: [] as string[], cta: 'Get started free' },
  { name: 'Student' as const, headline: 'Build a better study routine.',
    description: 'More practice, more flexibility, and the tools to stay consistent throughout the semester.',
    features: ['Everything in Free', 'Custom practice mixes with a question-count selector', 'Balanced, MCQ-heavy, and theory-heavy presets', 'Balanced or selected-section coverage and exam-style practice'],
    planned: ['Practice history and basic progress tracking', 'Basic weak-topic feedback', 'Scheduled daily recall and optional reminders'], cta: 'Choose Student' },
  { name: 'Pro' as const, headline: 'Prepare smarter. Perform better.',
    description: 'Turn your course materials into a personalized exam-preparation experience.',
    features: ['Everything in Student', 'Larger custom practice sets'],
    planned: ['Exam Simulator: timed mock tests with corrections', 'Study Insights: detailed performance analytics', 'Smart Revision: evidence-based weak-topic practice', 'Adaptive recall sessions', 'Ask My Material: 100 questions per month'], cta: 'Unlock Pro' },
];

export default function Pricing() {
  return <section id="pricing" className="pricing-section wrap" aria-labelledby="pricing-title">
    <div className="pricing-heading"><h2 id="pricing-title">A plan for your study rhythm</h2><p>Everything you need to build a consistent study routine.</p></div>
    <p className="pricing-availability">Free study tools are available. Student and Pro are launch plans; paid subscriptions are not open yet.</p>
    <div className="pricing-grid">{plans.map(plan => <article className={`pricing-card ${plan.name === 'Pro' ? 'pricing-pro' : ''}`} key={plan.name} aria-label={`${plan.name} plan`}>
      <div className="pricing-card-top">{plan.name === 'Pro' && <span className="plan-note">Best for exam preparation</span>}<h3>{plan.name}</h3><p><strong>{plan.headline}</strong><br />{plan.description}</p><div className="plan-price"><span>₦{policy[plan.name].monthly_price.toLocaleString('en-NG')}</span><small>/month</small></div><div className="plan-action">{plan.name === 'Free' ? <a className="button charcoal" href="/dashboard/">{plan.cta}</a> : <><button className="button charcoal" disabled>{plan.cta}</button><span>Subscriptions coming soon</span></>}</div></div>
      <div className="pricing-card-details"><h4>{plan.name === 'Free' ? 'Available now' : 'Launch allowance — not yet available'}</h4><ul><li><Check size={14} aria-hidden="true" /><span>{policy[plan.name].packs_per_month} learning packs per month</span></li><li><Check size={14} aria-hidden="true" /><span>Up to {policy[plan.name].practice_questions} questions per practice set</span></li>{plan.features.map(feature => <li key={feature}><Check size={14} aria-hidden="true" /><span>{feature}</span></li>)}</ul>
      {plan.name !== 'Free' && <p className="plan-note">Custom practice becomes available when paid subscriptions launch.</p>}
      {plan.planned.length > 0 && <div className="plan-planned"><h4>Coming soon — planned</h4><ul>{plan.planned.map(feature => <li key={feature}><span className="planned-mark" aria-hidden="true" /><span>{feature}</span></li>)}</ul></div>}
      </div>
    </article>)}</div>
    <p className="pricing-footnote">Learning-pack allowances reset monthly. Question limits apply per generated set. Saved retries do not call AI or use another pack. New custom mixes remain subject to generation safety limits. Planned features are unavailable until released.</p>
  </section>;
}
