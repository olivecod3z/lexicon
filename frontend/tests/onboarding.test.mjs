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
