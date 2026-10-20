// Front-end contact preparation. No server submission or third-party tracking.
const serviceNames = {
  'website-design-development':'Website design & development',
  'product-design-development':'Product design & development',
  'tools-analytics':'Tools & analytics'
};
const form=document.querySelector('#project-form');
function track(action,context='') {
  document.dispatchEvent(new CustomEvent('tivoro:interaction',{detail:{action,context}}));
}
if(form){
  const service=new URLSearchParams(location.search).get('service');
  if(serviceNames[service])form.elements.service.value=serviceNames[service];
  const preview=document.querySelector('#brief-preview');
  const status=document.querySelector('#form-status');
  const brief=()=>{
    const data=new FormData(form);
    return ['Project enquiry for Tivoro','','Name: '+(data.get('name')||''),'Business: '+(data.get('business')||''),'Email: '+(data.get('email')||''),'Service: '+(data.get('service')||''),'',data.get('message')||''].join('\n');
  };
  const update=()=>preview.value=brief();
  form.addEventListener('input',update);form.addEventListener('change',update);update();
  form.addEventListener('submit',event=>{
    event.preventDefault();
    if(!form.reportValidity())return;
    update();
    const data=new FormData(form);
    location.href='mailto:tivorosupport@gmail.com?subject='+encodeURIComponent('Project enquiry: '+(data.get('business')||data.get('name')))+'&body='+encodeURIComponent(brief());
    status.textContent='Your email draft is ready to review in your email app. Nothing has been sent by this website. If the app did not open, use “Copy project brief” below.';
    track('email_draft_prepared',data.get('service'));
  });
  document.querySelector('#copy-brief').addEventListener('click',async()=>{
    if(!form.reportValidity())return;
    update();
    try{
      await navigator.clipboard.writeText(brief());
      status.textContent='Project brief copied. Paste it into your email or WhatsApp, then review and send it.';
      track('project_brief_copied',form.elements.service.value);
    }catch{
      document.querySelector('.brief-fallback').open=true;
      preview.focus();preview.select();
      status.textContent='Your brief is selected below. Copy it using your device’s copy command.';
    }
  });
}
// Anonymous integration hooks only. No personal form values enter events.
document.addEventListener('click',event=>{
  const link=event.target.closest('a[href]');if(!link)return;
  if(link.href.startsWith('tel:'))track('phone_link');
  else if(link.href.includes('wa.me/'))track('whatsapp_link');
  else if(link.classList.contains('project-preview-link'))track('portfolio_link',link.getAttribute('aria-label')||'');
});
function markServices(){
  const summary=document.querySelector('.services-menu summary');
  if(!summary)return;
  if(location.hash==='#services')summary.setAttribute('aria-current','location');
  else if(!document.querySelector('.services-menu a[aria-current]'))summary.removeAttribute('aria-current');
}
window.addEventListener('hashchange',markServices);markServices();

const goalSelect=document.querySelector('#measurement-goal');
if(goalSelect){
 let goalAnimation;
 const goalPreview=document.querySelector('.goal-preview');
 const motionPreference=matchMedia('(prefers-reduced-motion: reduce)');
 const animateGoal=()=>{
  goalAnimation?.cancel();
  if(motionPreference.matches || new URLSearchParams(location.search).has('capture'))return;
  goalAnimation=goalPreview.animate([{opacity:.35,translate:'0 10px'},{opacity:1,translate:'0 0'}],{duration:380,easing:'cubic-bezier(.25,.8,.25,1)'});
 };
 motionPreference.addEventListener('change',()=>goalAnimation?.cancel());
 const goals={
  enquiry:['A request received.','Count enquiries that successfully reach your team, with the relevant service and source when available.','Which channels and services lead to useful conversations.'],
  booking:['A booking confirmed.','Count confirmed bookings after a successful reservation, using the booking system as the source of confirmation.','Which services people book and where the booking journey can become clearer.'],
  purchase:['An order completed.','Count confirmed purchases, with the order reference and agreed value where the checkout can provide them.','Which products and channels contribute to completed orders.']
 };
 goalSelect.addEventListener('change',()=>{
  const goal=goals[goalSelect.value];if(!goal)return;
  document.querySelector('#goal-result-title').textContent=goal[0];
  document.querySelector('#goal-result-copy').textContent=goal[1];
  document.querySelector('#goal-result-review').textContent=goal[2];
  animateGoal();
  track('measurement_demo',goalSelect.value);
 });
}
