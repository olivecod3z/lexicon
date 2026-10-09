'use client';

import './OriginalOnboarding.css';
import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';

import { auth } from '../firebase';
import { ArrowRight, BookOpen, Check, CheckCircle2, ChevronLeft, Layers, Sun } from './onboarding-icons';



const stages = ['University', 'Secondary school', 'Postgraduate', 'Independent learning'] as const;
const goals = [
  { id: 'understand', title: 'Understand my lectures', icon: BookOpen, color: 'mint' },
  { id: 'remember', title: 'Remember what I learn', icon: Layers, color: 'blue' },
  { id: 'exams', title: 'Feel ready for exams', icon: CheckCircle2, color: 'rose' },
  { id: 'routine', title: 'Build a study routine', icon: Sun, color: 'yellow' },
] as const;
const colors = [
  { id: 'green', label: 'Leaf', value: '#d9edc6', ink: '#38532c' },
  { id: 'blue', label: 'Sage', value: '#e0ead8', ink: '#405c35' },
  { id: 'rose', label: 'Rose', value: '#f7dfe2', ink: '#7d424b' },
  { id: 'yellow', label: 'Sunshine', value: '#f5ecc5', ink: '#6d5b25' },
] as const;
const steps = ['A little about you', 'Your study goals', 'Your studies'];
type GoalId = typeof goals[number]['id'];
type Profile = {
  name: string;
  institution: string;
  stage: string;
  goals: GoalId[];
  minutes: number;
  course: string;
  courseCode: string;
  color: string;
  level: string;
};
type Setup = { version: 1; step: number; complete: boolean; profile: Profile };
type FieldErrors = Partial<Record<'name' | 'goals' | 'course', string>>;
const initialProfile: Profile = {
  name: '', institution: '', stage: 'University', goals: [], minutes: 20,
  course: '', courseCode: '', color: 'green', level: '',
};

function parseSetup(raw: string | null): Setup | null {
  if (!raw) return null;
  try {
    const data = JSON.parse(raw);
    const p = data?.profile;
    if (data?.version !== 1 || !p || !Number.isInteger(data.step) || data.step < 0 || data.step > 2 || typeof data.complete !== 'boolean') return null;
    if (!['name', 'institution', 'stage', 'course', 'courseCode', 'color', 'level'].every(key => typeof p[key] === 'string')) return null;
    if (p.name.length > 40 || p.institution.length > 100 || p.course.length > 100 || p.courseCode.length > 16) return null;
    if (!stages.includes(p.stage) || !colors.some(color => color.id === p.color) || ![10, 20, 30].includes(p.minutes)) return null;
    if (!Array.isArray(p.goals) || p.goals.length > goals.length || new Set(p.goals).size !== p.goals.length || !p.goals.every((id: unknown) => goals.some(goal => goal.id === id))) return null;
    if ((data.step > 0 || data.complete) && !p.name.trim()) return null;
    if ((data.step > 1 || data.complete) && !p.goals.length) return null;
    return data as Setup;
  } catch {
    return null;
  }
}

export default function Onboarding({ onSave, onOpen, existingCourse, savedProfile }) {
  const STORAGE_KEY = `lexycon.original-onboarding.${auth.currentUser?.uid}`;
  const [draft] = useState(() => {
    try { return parseSetup(window.localStorage.getItem(STORAGE_KEY)); } catch { return null; }
  });
  const [profile, setProfile] = useState<Profile>(() => ({ ...initialProfile, ...draft?.profile, ...savedProfile,
    ...(existingCourse ? { course: existingCourse.name, courseCode: existingCourse.code, color: existingCourse.color } : {}),
  }));
  const [step, setStep] = useState(savedProfile ? 0 : draft?.step || 0);
  const [complete, setComplete] = useState(false);
  const ready = true;
  const [saveError, setSaveError] = useState(false);
  const [finishError, setFinishError] = useState('');
  const [isFinishing, setIsFinishing] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [direction, setDirection] = useState('forward');
  const heading = useRef<HTMLHeadingElement>(null);
  const shouldFocus = useRef(false);
  const pendingSetup = useRef<Setup | null>(null);
  const lastSaved = useRef('');
  const selectedColor = colors.find(color => color.id === profile.color) ?? colors[0];

  const saveSetup = useCallback(() => {
    if (!pendingSetup.current) return;
    const serialized = JSON.stringify(pendingSetup.current);
    if (serialized === lastSaved.current) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, serialized);
      lastSaved.current = serialized;
      setSaveError(false);
    } catch {
      setSaveError(true);
    }
  }, [STORAGE_KEY]);

  useEffect(() => {
    if (!ready) return;
    pendingSetup.current = { version: 1, step, complete, profile };
    const timer = window.setTimeout(saveSetup, 200);
    return () => window.clearTimeout(timer);
  }, [profile, step, complete, ready, saveSetup]);

  useEffect(() => {
    if (!ready) return;
    // Flush the pending draft when leaving, without writing on every keystroke.
    const flush = () => saveSetup();
    const onVisibilityChange = () => { if (document.visibilityState === 'hidden') flush(); };
    window.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      flush();
      window.removeEventListener('pagehide', flush);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [ready, saveSetup]);

  useEffect(() => {
    if (shouldFocus.current) {
      heading.current?.focus({ preventScroll: true });
      const main = document.getElementById('setup-main');
      if (main && main.getBoundingClientRect().top < 0) {
        main.scrollIntoView({ block: 'start', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
      }
      shouldFocus.current = false;
    }
  }, [step, complete]);

  function update<K extends keyof Profile>(key: K, value: Profile[K]) {
    setProfile(current => ({ ...current, [key]: value }));
    if (key === 'name' || key === 'course' || key === 'goals') {
      setErrors(current => ({ ...current, [key]: undefined }));
    }
  }

  function goTo(next: number) {
    setDirection(next < step ? 'back' : 'forward');
    shouldFocus.current = true;
    setErrors({});
    setStep(next);
  }

  async function finish() {
    if (!profile.name.trim() || !profile.level) { goTo(0); return; }
    if (!profile.goals.length) { goTo(1); return; }
    if (isFinishing) return;
    setIsFinishing(true);
    setFinishError('');
    setDirection('forward');
    const cleanedProfile = {
      ...profile,
      name: profile.name.trim(), institution: profile.institution.trim(),
      course: profile.course.trim(),
      courseCode: profile.courseCode.trim(),
    };
    try {
      await onSave(cleanedProfile);
      setProfile(cleanedProfile);
      setErrors({});
      shouldFocus.current = true;
      setComplete(true);
    } catch (error) {
      setFinishError(error instanceof Error ? error.message : 'Lexycon could not save your setup. Please try again.');
    } finally {
      setIsFinishing(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (step === 0 && (!profile.name.trim() || !profile.level)) {
      setErrors({ name: 'Add your name and select your degree level.' });
      document.getElementById('setup-name')?.focus();
      return;
    }
    if (step === 1 && profile.goals.length === 0) {
      setErrors({ goals: 'Choose at least one study goal.' });
      document.getElementById('goal-understand')?.focus();
      return;
    }
    if (step === 2 && !profile.course.trim()) {
      setErrors({ course: 'Add your starting course.' });
      document.getElementById('setup-course')?.focus();
      return;
    }
    if (step < 2) goTo(step + 1);
    else void finish();
  }



  return (
    <div className="onboarding-shell">
      <a className="setup-skip-link" href="#setup-main">Skip to setup</a>
      <header className="setup-header">
        <a className="setup-brand" href="https://lexycon.site/" aria-label="Lexycon home"><Layers size={22} /><span>lexycon<span className="setup-dot">.</span></span></a>
        <a className="setup-exit" href="https://lexycon.site/"><ChevronLeft size={16} /> Back to home</a>
      </header>

      <div className="setup-layout">
        <aside className="setup-sidebar" aria-label="Setup progress">
          <div className="setup-sidebar-content">
            <ol className="setup-steps">
              {steps.map((label, index) => {
                const done = ready && (complete || index < step);
                const current = ready && !complete && index === step;
                return <li key={label} className={`${done ? 'is-done' : ''} ${current ? 'is-current' : ''}`}>
                  <button type="button" disabled={!ready || complete || index >= step} onClick={() => goTo(index)} aria-current={current ? 'step' : undefined}>
                    <span className="setup-step-number">{done ? <Check size={16} /> : `0${index + 1}`}</span>
                    <strong>{label}</strong>
                    {current && <span className="setup-current-dot" aria-hidden="true" />}
                    {done && <span className="setup-sr-only">Completed</span>}
                  </button>
                </li>;
              })}
            </ol>
          </div>
          <div className="setup-landscape">
            <img src="/images/study-landscape-mobile.webp" alt="" width="768" height="1024" decoding="async" />
          </div>
        </aside>

        <main id="setup-main" className="setup-main" aria-busy={!ready}>
          {!ready ? <div className="setup-form-wrap setup-loading" role="status">
            <span className="setup-sr-only">Opening your study space...</span>
            <div className="setup-skeleton" aria-hidden="true">
              <span className="setup-skeleton-meta" /><span className="setup-skeleton-title" /><span className="setup-skeleton-intro" />
              {[0, 1, 2].map(field => <div className="setup-skeleton-field" key={field}><span /><span /></div>)}
              <div className="setup-skeleton-actions"><span /></div>
            </div>
          </div> : (
            <div className="setup-form-wrap">
              <div className="setup-mobile-progress" aria-label={complete ? 'Setup complete' : `Step ${step + 1} of 3`}>
                {steps.map((label, index) => <span key={label} className={complete || index <= step ? 'filled' : ''} />)}
              </div>

              <div className="setup-step-content" key={complete ? 'complete' : step} data-direction={direction}>
              {complete ? <>
                <div className="setup-complete-icon"><Check size={30} /></div>
                <h1 ref={heading} tabIndex={-1}>All set, {profile.name.trim()}.</h1>
                <dl className="setup-summary">
                  <div><dt>Your studies</dt><dd>{profile.stage}{profile.institution.trim() && <small>{profile.institution.trim()}</small>}</dd></div>
                  <div><dt>Your focus</dt><dd>{goals.filter(goal => profile.goals.includes(goal.id)).map(goal => <span key={goal.id}>{goal.title}</span>)}</dd></div>
                  <div><dt>Your daily pace</dt><dd>{profile.minutes} minutes</dd></div>
                  <div><dt>What you are studying</dt><dd>{profile.course.trim() || 'Taking this step later'}{profile.courseCode.trim() && <small>{profile.courseCode.trim()}</small>}</dd></div>
                </dl>
                <button className="setup-primary setup-complete-action" type="button" onClick={onOpen}>Open my dashboard <ArrowRight size={18} /></button>
                <button className="setup-edit" type="button" onClick={() => { shouldFocus.current = true; setDirection('back'); setComplete(false); setStep(0); }}>Edit my setup</button>
              </> : <form noValidate onSubmit={handleSubmit}><fieldset disabled={isFinishing} style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}>
                <div className="setup-step-meta"><span>Step {step + 1} of 3</span></div>
                <h1 ref={heading} tabIndex={-1}>{['First, a little about you.', 'What brings you here?', 'What are you studying?'][step]}</h1>
                {step === 2 && <p className="setup-intro">Your free plan includes one course.</p>}

                {step === 0 && <div className="setup-fields">
                  <div className="setup-field">
                    <label htmlFor="setup-name">What should we call you?</label>
                    <input id="setup-name" name="given-name" autoComplete="given-name" value={profile.name} onChange={event => update('name', event.target.value)} placeholder="Your first name" maxLength={40} required aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? 'name-error' : undefined} />
                    {errors.name && <p id="name-error" className="setup-field-error" role="alert">{errors.name}</p>}
                  </div>
                  <div className="setup-field">
                    <label htmlFor="setup-stage">Where are you in your learning?</label>
                    <select id="setup-stage" name="study-stage" value={profile.stage} onChange={event => update('stage', event.target.value)}>{stages.map(stage => <option key={stage}>{stage}</option>)}</select>
                  </div>
                  <div className="setup-field"><label htmlFor="setup-level">Degree level</label><select id="setup-level" required value={profile.level} onChange={event => update('level', event.target.value)}><option value="">Select your level</option>{['100 Level', '200 Level', '300 Level', '400 Level', '500 Level', '600 Level', 'Postgraduate', 'Other'].map(level => <option key={level}>{level}</option>)}</select></div>
                  <div className="setup-field">
                    <label htmlFor="setup-institution">School or university <span>Optional</span></label>
                    <input id="setup-institution" name="organization" autoComplete="organization" value={profile.institution} onChange={event => update('institution', event.target.value)} placeholder="e.g. University of Lagos" maxLength={100} />
                  </div>
                </div>}

                {step === 1 && <>
                  <fieldset className="setup-goals" aria-describedby={errors.goals ? 'goals-error' : undefined}>
                    <legend>Your goals <span>Choose all that fit</span></legend>
                    {goals.map(goal => <label className={`setup-goal ${profile.goals.includes(goal.id) ? 'is-selected' : ''}`} key={goal.id}>
                      <span className={`setup-goal-icon ${goal.color}`}><goal.icon size={22} /></span>
                      <span className="setup-goal-copy"><strong>{goal.title}</strong></span>
                      <input id={`goal-${goal.id}`} type="checkbox" name="goals" value={goal.id} checked={profile.goals.includes(goal.id)} aria-invalid={Boolean(errors.goals)} aria-describedby={errors.goals ? 'goals-error' : undefined} onChange={event => update('goals', event.target.checked ? [...profile.goals, goal.id] : profile.goals.filter(id => id !== goal.id))} />
                    </label>)}
                    {errors.goals && <p id="goals-error" className="setup-field-error" role="alert">{errors.goals}</p>}
                  </fieldset>
                  <fieldset className="setup-pace">
                    <legend>Daily study time</legend>
                    <div className="setup-pace-options">{[10, 20, 30].map(minutes => <label key={minutes} className={profile.minutes === minutes ? 'is-selected' : ''}>
                      <input type="radio" name="minutes" value={minutes} checked={profile.minutes === minutes} onChange={() => update('minutes', minutes)} />
                      <span>{minutes} min</span>
                    </label>)}</div>
                  </fieldset>
                </>}

                {step === 2 && <>
                  <div className="setup-fields">
                    <div className="setup-field"><label htmlFor="setup-course">Starting course</label><input readOnly={Boolean(existingCourse)} id="setup-course" name="course" value={profile.course} onChange={event => update('course', event.target.value)} maxLength={100} placeholder="e.g. Introduction to Computer Science" required aria-invalid={Boolean(errors.course)} aria-describedby={errors.course ? 'course-error' : undefined} />{errors.course && <p id="course-error" className="setup-field-error" role="alert">{errors.course}</p>}</div>
                    <div className="setup-course-options">
                      <div className="setup-field"><label htmlFor="setup-course-code">Course code <span>Optional</span></label><input readOnly={Boolean(existingCourse)} id="setup-course-code" name="course-code" value={profile.courseCode} onChange={event => update('courseCode', event.target.value)} maxLength={16} placeholder="e.g. csc 201" /></div>
                      <fieldset className="setup-colors"><legend>Study space color</legend><div>{colors.map(color => <label key={color.id} title={color.label} style={{ background: color.value, color: color.ink }} className={profile.color === color.id ? 'is-selected' : ''}>
                        <input type="radio" name="course-color" value={color.id} checked={profile.color === color.id} onChange={() => update('color', color.id)} aria-label={color.label} />{profile.color === color.id && <Check size={18} />}
                      </label>)}</div></fieldset>
                    </div>
                  </div>
                  <div className="setup-course-preview" style={{ borderTopColor: selectedColor.value }}>
                    <span className="setup-course-symbol" style={{ background: selectedColor.value, color: selectedColor.ink }}><BookOpen size={25} /></span>
                    {profile.courseCode.trim() && <span className="setup-preview-code">{profile.courseCode.trim()}</span>}
                    <h2>{profile.course.trim() || 'Your course'}</h2>
                  </div>
                </>}

                <div className="setup-actions">
                  {step > 0 && <button type="button" className="setup-back" onClick={() => goTo(step - 1)}><ChevronLeft size={17} /> Back</button>}
                  <button type="submit" className="setup-primary" disabled={isFinishing}>{step === 2 && isFinishing ? 'Saving your study space…' : step === 2 ? 'Finish setup' : 'Continue'}<ArrowRight size={18} /></button>
                </div>
                {step === 2 && <>{finishError && <p className="setup-field-error" role="alert">{finishError}</p>}</>}
              </fieldset></form>}
              </div>
              {saveError && <p className="setup-save-note has-error" role="status">Your draft cannot be saved in this browser. Finish setup to save your profile to your account.</p>}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
