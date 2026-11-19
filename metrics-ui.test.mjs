import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('./metrics.js',import.meta.url),'utf8');
test('main dashboard automatically fetches and renders real-source starter comparison',async()=>{
 const elements=new Map();let url,inserted=false;
 const get=id=>{if(!elements.has(id))elements.set(id,{innerHTML:'',textContent:'',style:{},addEventListener(){},before(){inserted=true},click(){return this.onclick?.()}});return elements.get(id)};
 const context=vm.createContext({document:{querySelector:get,createElement:()=>get('panel')},fetch:async u=>{url=u;return {ok:true,json:async()=>({artists:[{id:'381086ea-f511-4aba-bdf9-71c753dc5077',listens:101,listeners:12},{id:'272989c8-5535-492d-a25c-9f58803e027f',listens:null,listeners:null}],asOf:'2026-11-19T10:33:01Z',cached:false})}},URLSearchParams,AbortSignal,URL,Blob,setTimeout,console});
 vm.runInContext(source,context);await new Promise(r=>setTimeout(r,20));
 assert.ok(inserted);assert.match(url,/op=metrics/);assert.match(url,/381086ea-f511-4aba-bdf9-71c753dc5077/);
 assert.match(get('#live-cards').innerHTML,/Kendrick Lamar/);assert.match(get('#live-cards').innerHTML,/101/);assert.match(get('#live-cards').innerHTML,/Unavailable/);assert.match(get('#live-metrics').innerHTML,/Unique listeners/);
});
