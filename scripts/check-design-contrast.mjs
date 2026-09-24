import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const css = readFileSync(new URL('../shared/design-system.css', import.meta.url), 'utf8');
const tokens = Object.fromEntries([...css.matchAll(/--([\w-]+):\s*(#[\da-f]{3,6})\s*;/gi)].map(m => [m[1], m[2]]));
const luminance = hex => {
  let value = hex.slice(1); if (value.length === 3) value = [...value].map(c => c+c).join('');
  const channels = value.match(/../g).map(c => parseInt(c,16)/255).map(c => c <= .04045 ? c/12.92 : ((c+.055)/1.055)**2.4);
  return channels.reduce((sum,c,i)=>sum+c*[.2126,.7152,.0722][i],0);
};
for (const [foreground,background] of [
  ['text-primary','background'],['text-secondary','background'],['text-muted','surface'],
  ['text-muted','surface-muted'],['text-secondary','surface-blue'],['on-forest','forest'],
  ['on-lime','brand-primary'],['success','surface'],['danger','surface'],
]) {
  const values=[luminance(tokens[foreground]),luminance(tokens[background])].sort((a,b)=>b-a);
  const ratio=(values[0]+.05)/(values[1]+.05);
  assert.ok(ratio>=4.5,`${foreground}/${background}: ${ratio.toFixed(2)} fails 4.5:1`);
  console.log(`${foreground} / ${background}: ${ratio.toFixed(2)}:1`);
}
