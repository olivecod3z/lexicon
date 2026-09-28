const KEY = 'lexicon-onboarding-v1'
export function readSetup() {
  try { return JSON.parse(localStorage.getItem(KEY)) || { courses: [], resources: {} } }
  catch { return { courses: [], resources: {} } }
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
