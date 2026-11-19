import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

// Browser-independent smoke tests for the shared demo dashboard. No live user data.
const source=fs.readFileSync(new URL(process.env.DEMO_FILE || './demo.js',import.meta.url),'utf8');
function boot(project){
  const elements=new Map(); let copied='',exported='';
  const get=id=>{if(!elements.has(id))elements.set(id,{value:'',innerHTML:'',textContent:'',type:id==='#q'?'search':'select',addEventListener(){},click(){}});return elements.get(id)};
  get('#dimension').value='artist'; if(project==='soundprint'){get('#from').value='2026-10-21';get('#to').value='2026-11-19'}
  const doc={body:{dataset:{project}},querySelector:get,querySelectorAll:s=>s.split(',').map(get),createElement:()=>({click(){}})};
  const context=vm.createContext({document:doc,navigator:{clipboard:{writeText:async s=>{copied=s}}},alert:()=>{},prompt:()=>{},Blob:class{constructor(parts){exported=parts.join('')}},URL:{createObjectURL:()=>'',revokeObjectURL:()=>{}},console});
  vm.runInContext(source,context);return {get,run:s=>vm.runInContext(s,context),copied:()=>copied,exported:()=>exported};
}
test('SoundPrint generates 146 simulated listening events and date filters',()=>{const x=boot('soundprint');assert.equal(x.get('#results').textContent,'146 results');x.get('#from').value='2026-11-19';x.run('update()');assert.ok(x.run('filtered.length')>0);assert.ok(x.run('filtered.every(r=>r.date==="2026-11-19")'));});
test('Trackonomics catalogue search, year and genre filters',()=>{const x=boot('trackonomics');assert.equal(x.get('#results').textContent,'12 results');x.get('#q').value='Kendrick';x.run('update()');assert.equal(x.get('#results').textContent,'2 results');x.get('#q').value='';x.get('#genre').value='R&B';x.get('#period').value='2020';x.run('update()');assert.ok(x.run('filtered.every(r=>r.genre==="R&B" && r.year>=2020)'));});
test('Catalogue compares artist counts and exports an illustrative report',()=>{const x=boot('trackonomics');x.get('#a').value='Kendrick Lamar';x.get('#b').value='SZA';x.run('compare()');assert.match(x.get('#compare').innerHTML,/Kendrick Lamar/);assert.match(x.get('#compare').innerHTML,/SZA/);x.get('#share').onclick();assert.match(x.exported(),/Illustrative data/);assert.match(x.exported(),/Money Trees/);});
test('SoundPrint shares simulated insight and handles no matches',async()=>{const x=boot('soundprint');x.get('#share').onclick();assert.match(x.copied(),/146 plays/);assert.match(x.copied(),/Illustrative data/);x.get('#q').value='missing track';x.run('update()');assert.equal(x.get('#results').textContent,'0 results');assert.match(x.get('#analytics').innerHTML,/No data/);});
