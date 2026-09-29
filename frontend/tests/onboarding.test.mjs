import { test, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { readSetup, saveSetup, sampleResources } from '../src/onboarding-data.js'
beforeEach(() => { const values = new Map(); globalThis.localStorage = { getItem: key => values.get(key) ?? null, setItem: (key,value) => values.set(key,value) } })
test('setup and prepared resources survive a fresh read', () => {
  saveSetup({ name:'Alex', completed:true, courses:[{id:'course',name:'Study skills',materialId:'lecture'}], resources:{lecture:sampleResources} })
  const reopened=readSetup()
  assert.equal(reopened.courses[0].materialId,'lecture')
  assert.equal(reopened.resources.lecture.cards.flashcards.length,3)
  assert.equal(reopened.resources.lecture.notes.sections.length,2)
})
test('unavailable browser storage produces a recoverable error', () => {
  globalThis.localStorage.setItem=()=>{throw Error('QuotaExceededError')}
  assert.throws(()=>saveSetup({name:'Alex'}),/Allow site storage/)
  assert.deepEqual(readSetup(),{courses:[],resources:{}})
})
test('invalid stored setup falls back to an empty workspace',()=>{
  globalThis.localStorage.setItem('lexicon-onboarding-v1','not json')
  assert.deepEqual(readSetup(),{courses:[],resources:{}})
})

const profile = { name: 'Ada', course: 'Psychology', courseCode: 'PSY 101', goals: ['understand', 'exams'], minutes: 20, color: 'blue' }
function completeProfile(changes = {}, complete = true) {
  localStorage.setItem('lexicon.onboarding.v1', JSON.stringify({ version: 1, complete, profile: { ...profile, ...changes } }))
}

test('new onboarding hands its profile to the dashboard without losing existing work', () => {
  saveSetup({ name: 'Alex', completed: true, courses: [{ id: 'existing', name: 'Economics', materialId: 'lecture' }], resources: { lecture: sampleResources } })
  completeProfile()
  const setup = readSetup()
  assert.equal(setup.name, 'Ada')
  assert.equal(setup.dailyMinutes, 20)
  assert.deepEqual(setup.goals, ['understand', 'exams'])
  assert.equal(setup.courses.length, 2)
  assert.equal(setup.courses[0].materialId, 'lecture')
  assert.equal(setup.courses[1].name, 'Psychology')
  assert.equal(setup.courses[1].color, 'blue')
  assert.deepEqual(setup.resources.lecture, sampleResources)
})

test('editing and skipping the first course do not duplicate courses', () => {
  completeProfile()
  saveSetup(readSetup())
  completeProfile({ course: 'Biology' })
  assert.equal(readSetup().courses.length, 1)
  assert.equal(readSetup().courses[0].name, 'Biology')
  completeProfile({ course: '', courseCode: '' })
  assert.equal(readSetup().courses.length, 0)
})

test('unfinished or invalid new profiles leave the existing dashboard intact', () => {
  saveSetup({ name: 'Alex', courses: [], resources: {} })
  completeProfile({}, false)
  assert.equal(readSetup().name, 'Alex')
  completeProfile({ goals: 'exams' })
  assert.equal(readSetup().name, 'Alex')
  localStorage.setItem('lexicon.onboarding.v1', '{invalid')
  assert.equal(readSetup().name, 'Alex')
})
