const KEY = 'lexicon-onboarding-v1'
export function readSetup() {
  let setup = { courses: [], resources: {} }
  try {
    const stored = JSON.parse(localStorage.getItem(KEY))
    if (stored && typeof stored === 'object' && !Array.isArray(stored)) {
      setup = { ...stored, courses: Array.isArray(stored.courses) ? stored.courses : [], resources: stored.resources && typeof stored.resources === 'object' && !Array.isArray(stored.resources) ? stored.resources : {} }
    }
  } catch { /* The dashboard can open even when browser storage is unavailable. */ }

  try {
    const onboarding = JSON.parse(localStorage.getItem('lexicon.onboarding.v1'))
    const profile = onboarding?.profile
    if (onboarding?.version !== 1 || onboarding.complete !== true || !profile) return setup
    if (typeof profile.name !== 'string' || !profile.name.trim() || profile.name.length > 40) return setup
    if (typeof profile.course !== 'string' || profile.course.length > 100 || typeof profile.courseCode !== 'string' || profile.courseCode.length > 16) return setup
    if (!Array.isArray(profile.goals) || !profile.goals.length || !profile.goals.every(goal => ['understand', 'remember', 'exams', 'routine'].includes(goal)) || ![10, 20, 30].includes(profile.minutes)) return setup

    // Keep existing lectures and courses; edits replace only the new setup's course.
    const courses = setup.courses.filter(course => course?.id !== 'onboarding-first-course')
    if (profile.course.trim()) courses.push({ id: 'onboarding-first-course', name: profile.course.trim(), code: profile.courseCode.trim(), color: ['green', 'blue', 'rose', 'yellow'].includes(profile.color) ? profile.color : 'green' })
    return { ...setup, name: profile.name.trim(), completed: true, goals: profile.goals, dailyMinutes: profile.minutes, courses }
  } catch { return setup }
}
export function saveSetup(value) {
  try { localStorage.setItem(KEY, JSON.stringify(value)) }
  catch { throw Error('Your browser could not save your workspace. Allow site storage, then try again.') }
}
export const sampleText = 'Active recall means retrieving an idea from memory before checking your notes. Spaced repetition means revisiting material across several sessions with time between reviews. Practice questions help reveal gaps in understanding. Reviewing mistakes helps you decide what to study next. Explaining an idea in your own words can reveal what you understand.'
export const sampleResources = {
  notes: { title: 'A little practice. A stronger memory.', overview: sampleText, learning_objectives: ['Explain active recall.', 'Plan a spaced review.', 'Use mistakes to guide revision.'], sections: [
    { heading: 'Start with what you remember', explanation: 'Close your notes and explain one idea from memory. Then check your explanation against the lecture.', key_points: ['Retrieving an idea is active recall.', 'Check your explanation and fill in the gaps.'] },
    { heading: 'Come back to it', explanation: 'Spread your reviews across separate study sessions. Use practice questions and mistakes to decide what needs another look.', key_points: ['Revisit material with time between reviews.', 'Mistakes are useful feedback.'] }
  ] },
  cards: { title: 'The science of studying', flashcards: [
    { topic: 'Active recall', question: 'What does active recall mean?', answer: 'Retrieving an idea from memory before checking your notes.' },
    { topic: 'Spaced repetition', question: 'How are spaced reviews organised?', answer: 'Across several sessions with time between reviews.' },
    { topic: 'Revision', question: 'Why review mistakes?', answer: 'They help you decide what to study next.' }
  ] }
}
