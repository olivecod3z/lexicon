import { Check } from './icons';

const plans = [
  {
    name: 'Free', price: '0', description: 'Start with a lecture. Find your way to study.',
    features: ['3 learning packs per month', 'Basic notes, flashcards, and MCQs', 'One balanced practice set per pack: 5 MCQs, 3 fill-in-the-gap questions, and 2 theory prompts', 'Unlimited retries on generated practice', 'Limited saved-material and quiz history'],
    note: 'Ask My Material is not included at launch.', planned: [],
  },
  {
    name: 'Student', price: '3,000', description: 'Make room for a steady study routine.',
    features: ['30 learning packs per month', 'Saved materials and learning history', 'Custom practice mixes of up to 10 prompts', 'Balanced, Theory-heavy, and MCQ revision presets'],
    note: '', planned: ['Flashcard review controls', 'Basic progress and weak-topic feedback', 'Up to 50 Ask My Material questions per month', 'Exam Mode'],
  },
  {
    name: 'Pro', price: '7,000', description: 'More material. More practice. More room to learn.',
    features: ['75 learning packs per month', 'Everything in Student, with higher limits', 'Custom practice sets of up to 20 prompts'],
    note: '', planned: ['Up to 100 Ask My Material questions per month', 'Saved practice templates', 'Larger and longer lecture-material support', 'Advanced weak-topic analytics and targeted practice', 'Higher storage'],
  },
];

export default function Pricing() {
  return <section id="pricing" className="pricing-section wrap" aria-labelledby="pricing-title">
    <div className="pricing-heading"><h2 id="pricing-title">A plan for your study rhythm</h2><p>Start small, or make space for the whole semester.</p></div>
    <p className="pricing-availability">Plans for launch. Explore the sample today; subscriptions aren’t open yet.</p>
    <div className="pricing-grid">{plans.map(plan => <article className="pricing-card" key={plan.name} aria-label={`${plan.name} plan`}>
      <div className="pricing-card-top"><h3>{plan.name}</h3><p>{plan.description}</p><div className="plan-price"><span>₦{plan.price}</span><small>/month</small></div><div className="plan-action"><a className="button charcoal" href="#demo" aria-label={`Explore the sample study pack from the ${plan.name} plan`}>Explore sample</a>{plan.name === 'Free' && <span>No payment needed</span>}</div></div>
      <div className="pricing-card-details"><h4>What’s included</h4><ul>{plan.features.map(feature => <li key={feature}><Check size={14} aria-hidden="true" /><span>{feature}</span></li>)}</ul>
      {plan.note && <p className="plan-note">{plan.note}</p>}
      {plan.planned.length > 0 && <div className="plan-planned"><h4>Planned additions</h4><ul>{plan.planned.map(feature => <li key={feature}><span className="planned-mark" aria-hidden="true" /><span>{feature}</span></li>)}</ul></div>}
      </div>
    </article>)}</div>
    <p className="pricing-footnote">Planned additions will be available when released. Each plan’s pack and question limits are monthly.</p>
  </section>;
}
