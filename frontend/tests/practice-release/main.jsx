import React from 'react'
import { createRoot } from 'react-dom/client'
import App from '../../src/App'
import '../../src/index.css'
import '../../../shared/motion.css'
import '../../src/interaction-motion.css'
function Fixture() {
  return <><aside style={{padding:12,background:'#fff3c4'}}>Local release fixture: synthetic identity and questions. <label>Test plan <select defaultValue={selectedPlan} onChange={async event => { const plan = event.target.value; const response = await fetch('/fixture/plan', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({plan})}); if (!response.ok) throw new Error('Could not switch fixture plan'); selectedPlan = plan; createRootState() }}><option>Free</option><option>Student</option><option>Pro</option></select></label></aside><App key={version} /></>
}
let selectedPlan = 'Free'
let version = 0
const root = createRoot(document.getElementById('root'))
function createRootState() { version += 1; root.render(<Fixture key={version} />) }
createRootState()
