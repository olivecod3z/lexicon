import { useEffect, useRef, useState } from 'react'
import { api, browserLibrary } from '../api'
import { readSetup, saveSetup, sampleText, sampleResources } from '../onboarding-data'
import Icon from './Icon'
import './Onboarding.css'
const steps = ['Your space', 'Your course', 'Your lecture', 'Ready to study']
export default function Onboarding({ onFinish, onExit }) {
  const [step, setStep] = useState(0)
  const [name, setName] = useState(() => readSetup().name || '')
  const [course, setCourse] = useState('')
  const [code, setCode] = useState('')
  const [file, setFile] = useState(null)
  const [sample, setSample] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)
  const [answer, setAnswer] = useState(null)
  const [uploaded, setUploaded] = useState(false)
  const heading = useRef(null)
  const input = useRef(null)
  const pending = useRef(false)
  const saved = useRef(null)
  const courseId = useRef(null)
  useEffect(() => { heading.current?.focus() }, [step])
  function next() { setError(''); setStep(step + 1) }
  function choose(value) { setFile(value); setSample(false); saved.current = null; setUploaded(false); setError('') }
  async function prepare() {
    if (pending.current) return
    if (!file && !sample) { setError('Choose a lecture or try the sample to continue.'); return }
    pending.current = true; setBusy(true); setError('')
    try {
      let material = saved.current
      if (!material) {
        setStatus('Reading and saving your lecture…')
        const body = new FormData()
        body.append('file', sample ? new File([sampleText], 'The science of studying.txt', { type: 'text/plain' }) : file)
        material = await api('/materials', { method: 'POST', body, onProgress: setStatus })
        saved.current = material; setUploaded(true)
      }
      let resources = sample ? sampleResources : {}
      if (!browserLibrary && !sample) {
        setStatus('Organising the key ideas in your lecture…')
        resources = { notes: await api(`/materials/${material.id}/study-pack`, { method: 'POST' }) }
      }
      const existing = readSetup()
      if (!courseId.current) courseId.current = crypto.randomUUID()
      const setup = { ...existing, name: name.trim(), completed: true,
        courses: [...(existing.courses || []).filter(c => c.id !== courseId.current), { id: courseId.current, name: course.trim(), code: code.trim(), materialId: material.id }],
        resources: { ...existing.resources, [material.id]: resources } }
      saveSetup(setup)
      setResult({ material, resources, setup, sample }); setStep(3)
    } catch (e) { setError(e.message) }
    finally { pending.current = false; setBusy(false); setStatus('') }
  }
  return <div className="onboarding">
    <header className="onboarding-header"><a href="/" className="onboarding-brand">lexicon.</a><button className="text-button" disabled={busy} onClick={onExit}>Go to dashboard <Icon name="arrow" /></button></header>
    <main className="onboarding-shell">
      <aside className="onboarding-aside" aria-label="Your setup progress">
        <p className="onboarding-kicker">A little clearer, every day.</p><h2>Your next<br />lightbulb moment<br /><span>starts here.</span></h2>
        <ol>{steps.map((label, i) => <li key={label} aria-current={step === i ? 'step' : undefined} className={step === i ? 'current' : step > i ? 'complete' : ''}><span>{step > i ? <Icon name="check" /> : i + 1}</span><div>{label}<small>{['Make yourself at home', 'Keep your learning together', 'Start with what you have', 'Find your next step'][i]}</small></div></li>)}</ol>
        <div className="onboarding-art" aria-hidden="true"><div className="onboarding-art-sheet"><Icon name="file" /><span>Your lecture</span><i /><i /><i /></div><div className="onboarding-art-tag"><Icon name="leaf" /> A little progress.</div></div>
        <p className="onboarding-aside-note">Your notes. Your pace.</p>
      </aside>
      <section className="onboarding-content" aria-busy={busy}>
        <p className="onboarding-step">Step {step + 1} of 4 · {steps[step]}</p>
        <h1 ref={heading} tabIndex={-1}>{['Let’s make your next lecture clearer.', 'What are you studying?', 'Start with one lecture.', result?.resources.notes ? 'Your first study pack is ready.' : 'Your lecture is ready to read.'][step]}</h1>
        {step === 0 && <><p className="onboarding-lead">Bring your course and a lecture. Build a study routine around understanding, recall, and practice.</p><div className="onboarding-benefits">{[['file','Understand','Find the key ideas.'],['layers','Remember','Practise recalling concepts.'],['practice','Improve','Check what’s sticking.']].map(([icon,title,text]) => <div key={title}><Icon name={icon} /><strong>{title}</strong><p>{text}</p></div>)}</div><form onSubmit={e => { e.preventDefault(); next() }}><label htmlFor="onboard-name">What should we call you? <span>Optional</span></label><input id="onboard-name" autoComplete="given-name" maxLength={60} placeholder="Your first name" value={name} onChange={e=>setName(e.target.value)} /><p className="onboarding-note">Start as a guest. Your setup is saved in this browser; an online account is not created.</p><button className="button primary" type="submit">Set up my study space <Icon name="arrow" /></button></form></>}
        {step === 1 && <><p className="onboarding-lead">Give your first course a home. We’ll connect this lecture to it so you can pick up where you left off.</p><form onSubmit={e=>{e.preventDefault(); if (!course.trim()) { setError('Enter a course name to continue.'); return }; next()}}><label htmlFor="onboard-course">Course name</label><input id="onboard-course" required maxLength={100} placeholder="Introduction to psychology" value={course} onChange={e=>setCourse(e.target.value)} /><label htmlFor="onboard-code">Course code <span>Optional</span></label><input id="onboard-code" maxLength={25} placeholder="Psy 101" value={code} onChange={e=>setCode(e.target.value)} /><div className="onboarding-tip"><Icon name="book" /><p>One course is enough to begin. You can return to this setup to add another.</p></div><div className="onboarding-actions"><button type="button" className="button secondary" onClick={()=>setStep(0)}>Back</button><button className="button primary" type="submit">Add my first lecture <Icon name="arrow" /></button></div></form></>}
        {step === 2 && <><p className="onboarding-lead">Choose something you’d like to understand better. A single lecture is a good place to start.</p><p className="onboarding-course"><Icon name="book" />{course}{code && ` · ${code}`}</p><div className={`onboarding-drop ${dragging ? 'dragging' : ''}`} onDragOver={e=>{e.preventDefault();if(!busy)setDragging(true)}} onDragLeave={()=>setDragging(false)} onDrop={e=>{e.preventDefault();setDragging(false);if(!busy&&e.dataTransfer.files[0])choose(e.dataTransfer.files[0])}}><Icon name={file || sample ? 'file' : 'upload'} size={32}/><strong>{sample ? 'The science of studying.txt' : file ? file.name : 'Drop your lecture here'}</strong><span>{file ? `${(file.size/1024/1024).toFixed(2)} megabytes` : 'Or choose a file from your device'}</span><input ref={input} type="file" hidden accept={browserLibrary ? '.pdf,.txt' : '.pdf,.txt,.docx,.pptx'} onChange={e=>{if(e.target.files[0])choose(e.target.files[0]);e.target.value=''}}/><button className="button secondary" disabled={busy} onClick={()=>input.current?.click()}>{file || sample ? 'Choose another file' : 'Choose a lecture'}</button><small>{browserLibrary ? 'pdf or txt' : 'pdf, txt, docx or pptx'} · Up to 25 megabytes</small></div><button className="onboarding-sample" disabled={busy} onClick={()=>{setSample(true);setFile(null);saved.current=null;setUploaded(false);setError('')}}><Icon name="leaf"/><span>No lecture handy? <strong>Try a sample lecture</strong></span><Icon name="arrow"/></button><p className="onboarding-note">{sample ? 'Explore a prepared example of notes and flashcards. No generation needed.' : browserLibrary ? 'Your lecture stays in this browser. Automated notes and quizzes for your own files are not connected online yet.' : 'Your lecture text is sent to OpenAI to prepare notes. Check important details against your original.'}</p><div className="onboarding-actions"><button className="button secondary" disabled={busy} onClick={()=>setStep(1)}>Back</button><button className="button primary" disabled={busy || (!file&&!sample)} onClick={prepare}>{busy ? 'Preparing your lecture…' : sample ? 'Explore my sample study pack' : browserLibrary ? 'Save my lecture' : 'Create my study pack'}{!busy&&<Icon name="arrow"/>}</button></div></>}
        {step === 3 && result && <><p className="onboarding-lead">{name ? `${name.trim()}, you` : 'You'} have taken the first step. Here’s how to make the most of it.</p><div className="onboarding-ready"><span><Icon name="check"/></span><div><strong>{result.material.filename}</strong><p>{course} · {result.sample ? 'Sample study pack' : result.resources.notes ? 'Study notes prepared' : 'Saved in this browser'}</p></div></div><div className="onboarding-lessons">{[['file','Start with understanding','Read a section, then explain the idea in your own words.'],['layers','Give your memory a turn','Try recalling an answer before revealing it.'],['practice','Let mistakes guide you','Use practice results to choose what to review next.']].map(([icon,title,text])=><div key={title}><Icon name={icon}/><div><h2>{title}</h2><p>{text}</p></div></div>)}</div>{result.sample && <fieldset className="onboarding-check"><legend>A quick practice</legend><p>Which action is active recall?</p>{['Rereading a paragraph','Explaining an idea with your notes closed'].map((text,i)=><button key={text} className="button secondary" aria-pressed={answer===i} onClick={()=>setAnswer(i)}>{text}</button>)}{answer!==null&&<p role="status">{answer===1?'That’s it. Retrieving the idea from memory is active recall.':'Try again. Active recall means retrieving the idea before checking your notes.'}</p>}</fieldset>}<button className="button primary" onClick={()=>onFinish(result)}>{result.resources.notes ? 'Start with study notes' : 'Read my lecture'}<Icon name="arrow"/></button><p className="onboarding-note">You can switch tools and return to your materials whenever you need.</p></>}
        {busy && <p className="onboarding-status" role="status"><span className="onboarding-pulse"/>{status}</p>}
        {error && <div className="onboarding-error" role="alert">{error}{uploaded&&<p>Your upload is saved. Retry to continue without uploading it again.</p>}</div>}
      </section>
    </main><footer className="onboarding-footer">Small steps. Stronger understanding.</footer>
  </div>
}
