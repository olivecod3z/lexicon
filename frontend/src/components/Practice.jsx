import Icon from './Icon'

const ArrowIcon = () => <Icon name="arrow" />

export default function Practice({ practice, mcqAnswers, setMcqAnswers, gapAnswers, setGapAnswers, theoryAnswers, setTheoryAnswers, result, setResult, isSubmitting, submitPractice }) {
  const hasCompleteGradableAnswers = practice.mcqs.every((_, index) => mcqAnswers[index]) && practice.fill_in_the_gaps.every((_, index) => gapAnswers[index]?.trim())
  return <section className="quiz"><fieldset className="practice-fields" disabled={isSubmitting}><legend className="sr-only">Mixed practice answers</legend>
      <div className="quiz-heading"><div><p className="eyebrow">MIXED PRACTICE</p><h1>{practice.title}</h1><p>Answer the objective questions first, then use the theory prompts to deepen your recall.</p></div><div className="progress-note"><span>8</span><small>gradable<br />answers</small></div></div>
      <h2 className="section-title">Objective practice</h2>
      {practice.mcqs.map((q, i) => <article key={`m${i}`}><small>QUESTION {i + 1} OF 5</small><h3>{q.question}</h3>{q.options.map(o => <button aria-pressed={mcqAnswers[i] === o.label} className={mcqAnswers[i] === o.label ? 'selected' : ''} key={o.label} onClick={() => { setMcqAnswers({ ...mcqAnswers, [i]: o.label }); setResult() }}><b>{o.label}</b><span>{o.text}</span></button>)}</article>)}
      <h2 className="section-title">Keyword recall</h2>
      {practice.fill_in_the_gaps.map((q, i) => <article key={`g${i}`}><small>FILL THE GAP {i + 1} OF 3</small><h3>{q.prompt}</h3><label className="sr-only" htmlFor={`gap-${i}`}>Answer for gap {i + 1}</label><input id={`gap-${i}`} value={gapAnswers[i] || ''} onChange={e => { setGapAnswers({ ...gapAnswers, [i]: e.target.value }); setResult() }} placeholder="Type the missing keyword" /></article>)}
      <div className="submit-area"><button className="primary" disabled={!hasCompleteGradableAnswers || isSubmitting} onClick={submitPractice}>{isSubmitting ? 'Checking answers…' : 'Check objective answers'}<ArrowIcon /></button>{!hasCompleteGradableAnswers && <p>Complete all 8 gradable answers to see your score.</p>}</div>
      {result && <section className="score" role="status" aria-live="polite"><p className="eyebrow">OBJECTIVE PRACTICE SCORE</p><h2>{result.percentage}%</h2><p>{result.correct_mcqs} of 5 MCQs correct <span>·</span> {result.correct_gaps} of 3 keyword gaps correct</p><p className="score-note">{result.correct_mcqs + result.correct_gaps} of {result.total_gradable} gradable answers correct</p></section>}
      <h2 className="section-title theory-title">Theory practice</h2>
      <p className="section-description">Use these prompts for active recall. Your written answers are not included in the objective score.</p>
      {practice.theory_questions.map((q, i) => <article key={`t${i}`}><small>THEORY PROMPT {i + 1} OF 2</small><h3>{q.prompt}</h3><label className="sr-only" htmlFor={`theory-${i}`}>Theory answer {i + 1}</label><textarea id={`theory-${i}`} value={theoryAnswers[i] || ''} onChange={e => setTheoryAnswers({ ...theoryAnswers, [i]: e.target.value })} placeholder="Write your answer in your own words" /></article>)}
    </fieldset></section>
}
