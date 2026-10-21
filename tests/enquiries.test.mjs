import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync,readdirSync} from 'node:fs';
import {authorizeOwner,formSession,listEnquiries,notifyEnquiry,respond,submitEnquiry,updateEnquiry} from '../server/enquiries.mjs';

const origin='https://tivoro.test';
const owner={userId:'site-owner-identity',email:'owner@example.com'};
function fixture(t){
 const sql=new DatabaseSync(':memory:');
 for(const file of readdirSync(new URL('../drizzle/',import.meta.url)).filter(n=>n.endsWith('.sql')))sql.exec(readFileSync(new URL('../drizzle/'+file,import.meta.url),'utf8'));
 t.after(()=>sql.close());
 const DB={prepare(query){let args=[];const statement=sql.prepare(query);return {bind(...values){args=values;return this;},async first(){return statement.get(...args)||null;},async all(){return {results:statement.all(...args)};},async run(){const result=statement.run(...args);return {meta:{changes:Number(result.changes)}};}};}};
 return {sql,env:{DB,ADMIN_EMAILS:'owner@example.com',PUBLIC_SITE_ORIGIN:origin,ENQUIRY_TOKEN_SECRET:'unit-test-only-long-secret-value-1234567890',ENQUIRY_EMAIL_TO:'tivorosupport@gmail.com'}};
}
async function session(env){const response=await formSession(new Request(origin+'/api/enquiries/session'),env);return {token:(await response.json()).token,cookie:response.headers.get('set-cookie').split(';')[0],headers:response.headers};}
function payload(extra={}){return {name:'Frontend Verification',business:'Example Organisation',email:'verification@example.com',service:'Website design & development',message:'Synthetic project enquiry for application verification only.',website:'',submissionId:crypto.randomUUID(),...extra};}
function post(data,s,headers={}){return new Request(origin+'/api/enquiries',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json',Cookie:s.cookie,'CF-Connecting-IP':'192.0.2.10',...headers},body:JSON.stringify({...data,token:s.token})});}
const submit=(request,env)=>respond(()=>submitEnquiry(request,env));

test('form tokens use a private, secure cookie and never expose the signing secret',async t=>{
 const {env}=fixture(t),s=await session(env);
 assert.match(s.headers.get('set-cookie'),/^__Host-tivoro-form=/);assert.match(s.headers.get('set-cookie'),/HttpOnly; SameSite=Strict/);assert.match(s.headers.get('set-cookie'),/Secure/);assert.equal(s.headers.get('cache-control'),'private, no-store');assert.ok(!s.token.includes(env.ENQUIRY_TOKEN_SECRET));
});
test('successful enquiries persist once, with the same reference on network retries',async t=>{
 const {env,sql}=fixture(t),s=await session(env),data=payload();
 const first=await submit(post(data,s),env);assert.equal(first.status,201);const result=await first.json();assert.equal(result.saved,true);
 const second=await submit(post(data,s),env);assert.equal(second.status,200);assert.equal((await second.json()).reference,result.reference);assert.equal(sql.prepare('SELECT count(*) AS n FROM enquiries').get().n,1);
 const changed=await submit(post({...data,message:'Different project details under the same request id.'},s),env);assert.equal(changed.status,409);
 const row=sql.prepare('SELECT * FROM enquiries').get();assert.equal(row.email,data.email);assert.equal(row.notification_state,'not_configured');
});
test('concurrent duplicate requests cannot create two records',async t=>{
 const {env,sql}=fixture(t),s=await session(env),data=payload();
 const responses=await Promise.all([submit(post(data,s),env),submit(post(data,s),env)]);
 assert.deepEqual(responses.map(r=>r.status).sort(),[200,201]);assert.equal(sql.prepare('SELECT count(*) AS n FROM enquiries').get().n,1);
});
test('invalid fields, unsupported services and honeypots are rejected without storage',async t=>{
 const {env,sql}=fixture(t),s=await session(env);
 const invalid=await submit(post(payload({email:'not-an-email',message:'short'}),s),env);assert.equal(invalid.status,422);assert.ok((await invalid.json()).fields.email);
 assert.equal((await submit(post(payload({service:'unlisted service'}),s),env)).status,422);
 assert.equal((await submit(post(payload({website:'spam.example'}),s),env)).status,400);
 assert.equal(sql.prepare('SELECT count(*) AS n FROM enquiries').get().n,0);
});
test('cross-origin, missing-cookie and forged-token submissions fail closed',async t=>{
 const {env,sql}=fixture(t),s=await session(env);
 assert.equal((await submit(post(payload(),s,{Origin:'https://elsewhere.test'}),env)).status,403);
 assert.equal((await submit(post(payload(),s,{Cookie:''}),env)).status,403);
 assert.equal((await submit(post(payload(),{...s,token:s.token+'forged'}),env)).status,403);
 assert.equal((await respond(()=>formSession(new Request(origin+'/api/enquiries/session',{headers:{'Sec-Fetch-Site':'cross-site'}}),env))).status,403);
 assert.equal(sql.prepare('SELECT count(*) AS n FROM enquiries').get().n,0);
});
test('expired signed tokens are rejected',async t=>{
 const {env}=fixture(t),s=await session(env),nonce=s.cookie.split('=')[1],issued=Date.now()-3601000;
 const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(env.ENQUIRY_TOKEN_SECRET),{name:'HMAC',hash:'SHA-256'},false,['sign']);
 const bytes=await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(nonce+'|'+issued));
 const token=issued+'.'+Buffer.from(bytes).toString('base64url');assert.equal((await submit(post(payload(),{...s,token}),env)).status,403);
});
test('request-size and content-type limits are enforced',async t=>{
 const {env}=fixture(t),s=await session(env);
 assert.equal((await submit(post(payload({message:'x'.repeat(17000)}),s),env)).status,413);
 assert.equal((await submit(post(payload(),s,{'Content-Type':'text/plain'}),env)).status,415);
});
test('rate limits bound unique submissions without penalising idempotent retries',async t=>{
 const {env,sql}=fixture(t),s=await session(env),first=payload();
 assert.equal((await submit(post(first,s),env)).status,201);assert.equal((await submit(post(first,s),env)).status,200);
 for(let i=0;i<4;i++)assert.equal((await submit(post(payload(),s),env)).status,201);
 const limited=await submit(post(payload(),s),env);assert.equal(limited.status,429);assert.equal(limited.headers.get('retry-after'),'900');assert.equal(sql.prepare('SELECT count(*) AS n FROM enquiries').get().n,5);
 assert.ok(!JSON.stringify(sql.prepare('SELECT * FROM enquiry_limits').all()).includes('192.0.2.10'));
});
test('inbox reads require the owner on every request and are never publicly cached',async t=>{
 const {env}=fixture(t),s=await session(env);await submit(post(payload(),s),env);
 const request=new Request(origin+'/api/inbox/enquiries');
 assert.equal((await respond(()=>listEnquiries(request,env,null))).status,401);
 assert.equal((await respond(()=>listEnquiries(request,env,{userId:'other',email:'other@example.com'}))).status,403);
 const response=await listEnquiries(request,env,owner);assert.equal(response.status,200);assert.equal(response.headers.get('cache-control'),'private, no-store');assert.equal((await response.json()).items.length,1);
 assert.throws(()=>authorizeOwner({...env,ADMIN_EMAILS:''},owner),error=>error.status===403);
});
test('search treats SQL syntax and wildcard characters as data',async t=>{
 const {env}=fixture(t),s=await session(env);await submit(post(payload({business:'100% Example'}),s),env);
 const search=async q=>(await listEnquiries(new Request(origin+'/api/inbox/enquiries?'+new URLSearchParams({q})),env,owner)).json();
 assert.equal((await search("' OR 1=1 --")).items.length,0);assert.equal((await search('%')).items.length,1);
 assert.equal((await respond(()=>listEnquiries(new Request(origin+'/api/inbox/enquiries?status=invalid'),env,owner))).status,400);
});
test('status updates enforce identity and origin and preserve an audit identity',async t=>{
 const {env,sql}=fixture(t),s=await session(env);await submit(post(payload(),s),env);const id=sql.prepare('SELECT id FROM enquiries').get().id;
 const request=(status,originValue=origin)=>new Request(origin+'/api/inbox/enquiries/'+id,{method:'PATCH',headers:{Origin:originValue,'Content-Type':'application/json'},body:JSON.stringify({status})});
 assert.equal((await respond(()=>updateEnquiry(request('contacted'),env,null,id))).status,401);
 assert.equal((await respond(()=>updateEnquiry(request('contacted','https://elsewhere.test'),env,owner,id))).status,403);
 assert.equal((await respond(()=>updateEnquiry(request('invalid'),env,owner,id))).status,422);
 assert.equal((await updateEnquiry(request('contacted'),env,owner,id)).status,200);
 const row=sql.prepare('SELECT status, updated_by FROM enquiries').get();assert.equal(row.status,'contacted');assert.equal(row.updated_by,owner.userId);
});
test('email failures never discard an enquiry, and provider requests use the selected team address',async t=>{
 const {env,sql}=fixture(t),s=await session(env);await submit(post(payload(),s),env);const row=sql.prepare('SELECT * FROM enquiries').get();
 const configured={...env,RESEND_API_KEY:'test-only-provider-key',ENQUIRY_EMAIL_FROM:'Tivoro <projects@example.com>'};
 let sent;
 assert.equal(await notifyEnquiry(configured,row,async(url,options)=>{sent={url,...JSON.parse(options.body)};return new Response('{}',{status:500});}),false);
 assert.equal(sql.prepare('SELECT notification_state FROM enquiries').get().notification_state,'failed');assert.equal(sql.prepare('SELECT count(*) AS n FROM enquiries').get().n,1);
 assert.deepEqual(sent.to,['tivorosupport@gmail.com']);assert.equal(sent.reply_to,row.email);assert.ok(sent.text.includes(row.message));
 assert.equal(await notifyEnquiry(configured,row,async()=>new Response('{"id":"mock"}',{status:200})),true);
 assert.equal(sql.prepare('SELECT notification_state FROM enquiries').get().notification_state,'sent');
});
