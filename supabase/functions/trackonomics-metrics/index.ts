// Open music catalogue and community listening metrics only; no Spotify analytics.
const base=Deno.env.get('SUPABASE_URL')!,serviceKey=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const keys=new Set<string>(Object.values(JSON.parse(Deno.env.get('SUPABASE_PUBLISHABLE_KEYS')||'{}')) as string[]);
const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
const ua='Trackonomics/1.1 (https://github.com/Allablur/Trackonomics)';
async function db(path:string,method='GET',body?:unknown){
 const r=await fetch(base+'/rest/v1/'+path,{method,headers:{apikey:serviceKey,Authorization:'Bearer '+serviceKey,'Content-Type':'application/json',...(path==='sampletrail_mb_cache'&&method==='POST'?{Prefer:'resolution=merge-duplicates,return=minimal'}:{})},...(body===undefined?{}:{body:JSON.stringify(body)})});
 if(!r.ok)throw Error('Storage unavailable');return [201,204].includes(r.status)?null:await r.json();
}
const count=(n:unknown)=>typeof n==='number'&&Number.isFinite(n)&&n>=0?n:null;
Deno.serve(async req=>{
 const origin=req.headers.get('origin')||'',cors={'Access-Control-Allow-Origin':'https://allablur.github.io','Access-Control-Allow-Methods':'GET, OPTIONS','Access-Control-Allow-Headers':'apikey, content-type','Vary':'Origin'};
 const send=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...cors,'Content-Type':'application/json','Cache-Control':'no-store'}});
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers:cors});
 if(req.method!=='GET'||(origin&&origin!=='https://allablur.github.io'))return send({error:'Request not allowed'},403);
 if(!keys.has(req.headers.get('apikey')||''))return send({error:'Project key required'},401);
 try{
  const params=new URL(req.url).searchParams,op=params.get('op');let url:string,keyData:unknown,ids:string[]=[],options:RequestInit={};
  if(op==='search'){
    const q=(params.get('q')||'').trim().replace(/\s+/g,' ');if(q.length<2||q.length>100)return send({error:'Enter 2–100 characters.'},400);
    const literal=q.replace(/[\\"]/g,'\\$&');url='https://musicbrainz.org/ws/2/artist?fmt=json&limit=12&query='+encodeURIComponent(`artist:"${literal}"`);keyData=q.toLowerCase();
  }else if(op==='metrics'){
    ids=[...new Set((params.get('ids')||'').toLowerCase().split(',').filter(Boolean))];if(!ids.length||ids.length>10||!ids.every(id=>uuid.test(id)))return send({error:'Choose 1–10 valid MusicBrainz artists.'},400);
    ids.sort();keyData=ids;url='https://api.listenbrainz.org/1/popularity/artist';options={method:'POST',body:JSON.stringify({artist_mbids:ids})};
  }else if(op==='recordings'){
    const id=params.get('id')||'';if(!uuid.test(id))return send({error:'Invalid artist ID.'},400);keyData=id.toLowerCase();url='https://api.listenbrainz.org/1/popularity/top-recordings-for-artist/'+id;
  }else return send({error:'Unknown operation'},400);
  const hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(keyData))),key='trackonomics-'+op+'-'+Array.from(new Uint8Array(hash),b=>b.toString(16).padStart(2,'0')).join('');
  const cached=await db('sampletrail_mb_cache?cache_key=eq.'+key+'&expires_at=gt.'+encodeURIComponent(new Date().toISOString())+'&select=payload');if(cached?.length)return send({...cached[0].payload,cached:true});
  // Shared global gate: never exceed the MusicBrainz quota across apps; also bounds ListenBrainz traffic.
  if(await db('rpc/sampletrail_mb_claim','POST',{})!==true)return send({error:'Catalogue is busy. Wait a moment and retry.'},429);
  const upstream=await fetch(url,{...options,headers:{'User-Agent':ua,Accept:'application/json',...(options.method==='POST'?{'Content-Type':'application/json'}:{})},signal:AbortSignal.timeout(12000)});
  if(!upstream.ok)return send({error:'The music data source is temporarily unavailable.'},upstream.status===429?429:503);
  const data=await upstream.json();let payload:any;
  if(op==='search')payload={artists:(data.artists||[]).filter((a:any)=>uuid.test(a.id)).map((a:any)=>({id:a.id,name:a.name,disambiguation:a.disambiguation||'',country:a.country||null,type:a.type||null})) ,source:'MusicBrainz'};
  else if(op==='metrics')payload={artists:ids.map(id=>{const a=(Array.isArray(data)?data:[]).find((r:any)=>r.artist_mbid===id);return{id,listens:count(a?.total_listen_count),listeners:count(a?.total_user_count)}}),source:'ListenBrainz',asOf:new Date().toISOString()};
  else payload={recordings:(Array.isArray(data)?data:[]).slice(0,20).map((r:any)=>({id:r.recording_mbid,title:r.recording_name||'Unknown',album:r.release_name||null,listens:count(r.total_listen_count),listeners:count(r.total_user_count)})),source:'ListenBrainz',asOf:new Date().toISOString()};
  await db('sampletrail_mb_cache','POST',{cache_key:key,payload,expires_at:new Date(Date.now()+3600000*6).toISOString()});return send({...payload,cached:false});
 }catch{return send({error:'Live metrics unavailable. The illustrative catalogue remains accessible.'},503)}
});
