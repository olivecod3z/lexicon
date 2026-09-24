import 'fake-indexeddb/auto'
import { beforeEach, test } from 'node:test'
import assert from 'node:assert/strict'
import { getDocument, listDocuments, removeDocument, saveDocument, validateDocument, MAX_FILE_BYTES } from '../src/browser-library.js'

beforeEach(async () => {
  await new Promise((resolve,reject) => { const request=indexedDB.deleteDatabase('lexicon-device-library-v1'); request.onsuccess=resolve; request.onerror=reject })
})
test('save, reopen and remove preserve the original and omit content from metadata', async () => {
  const file=new File(['Recall means retrieving ideas.'], 'lecture.txt', {type:'text/plain'})
  const stages=[]
  const saved=await saveDocument(file, value=>stages.push(value))
  assert.equal(saved.character_count,30)
  assert.equal('source_text' in saved,false)
  assert.equal('file' in saved,false)
  const listing=await listDocuments()
  assert.equal(listing.length,1)
  assert.equal('source_text' in listing[0],false)
  const reopened=await getDocument(saved.id)
  assert.equal(reopened.source_text,'Recall means retrieving ideas.')
  assert.equal(await reopened.file.text(), await file.text())
  assert.ok(stages.includes('Saving to this browser…'))
  await removeDocument(saved.id)
  assert.equal((await listDocuments()).length,0)
  await assert.rejects(getDocument(saved.id),/no longer/)
})
test('reject unsupported, empty and oversized files before reading', () => {
  assert.throws(()=>validateDocument(new File(['x'],'lecture.exe')),/pdf or/)
  assert.throws(()=>validateDocument(new File([],'lecture.pdf')),/empty/)
  assert.throws(()=>validateDocument({name:'lecture.pdf',size:MAX_FILE_BYTES+1}),/25 megabytes/)
})
test('invalid UTF-8 leaves the library unchanged',async () => {
  await assert.rejects(saveDocument(new File([new Uint8Array([255,254])],'lecture.txt')),/utf-8/)
  assert.equal((await listDocuments()).length,0)
})
test('storage cap is checked before committing a new document',async () => {
  await listDocuments()
  await new Promise((resolve,reject)=>{
    const request=indexedDB.open('lexicon-device-library-v1',1)
    request.onsuccess=()=>{const db=request.result; const tx=db.transaction('materials','readwrite');tx.objectStore('materials').put({id:'existing',filename:'existing.pdf',storage_bytes:100*1024*1024,created_at:'2026-01-01'});tx.oncomplete=()=>{db.close();resolve()};tx.onerror=reject}
    request.onerror=reject
  })
  await assert.rejects(saveDocument(new File(['New lecture'],'new.txt')),/100.megabyte/)
  assert.equal((await listDocuments()).length,1)
})
