// Motion enhances the existing layout; native links and forms keep their behaviour.
const captureMode = new URLSearchParams(location.search).has('capture');
if (captureMode) document.body.dataset.capture = '';
const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
const useMotion = () => !captureMode && !motionPreference.matches;
const ease = 'cubic-bezier(.22,1,.36,1)';
const disclosures = new Map();

document.querySelectorAll('details').forEach(details => {
  const summary = details.querySelector(':scope > summary');
  if (!summary) return;
  const isMenu = details.classList.contains('mobile-menu');
  const panel = isMenu ? details.querySelector('.menu-panel') : details;
  let animation;
  let desired = details.open;
  const clean = () => {
    details.style.removeProperty('height');
    details.style.removeProperty('overflow');
    summary.setAttribute('aria-expanded', String(details.open));
  };
  const setOpen = (open, returnFocus = false) => {
    desired = open;
    if (!animation && details.open === open) { clean(); return; }
    const startHeight = details.getBoundingClientRect().height;
    const startOpacity = isMenu && details.open ? getComputedStyle(panel).opacity : '0';
    animation?.cancel();
    animation = undefined;
    if (!useMotion()) {
      details.open = open;
      clean();
      if (returnFocus) summary.focus({preventScroll:true});
      return;
    }
    details.open = true;
    summary.setAttribute('aria-expanded', String(open));
    if (isMenu) {
      animation = panel.animate(
        open ? [{opacity:startOpacity,transform:'translateY(-6px)'},{opacity:1,transform:'translateY(0)'}]
             : [{opacity:startOpacity,transform:'translateY(0)'},{opacity:0,transform:'translateY(-4px)'}],
        {duration:open?280:160,easing:ease}
      );
    } else {
      details.style.height = '';
      const expandedHeight = details.getBoundingClientRect().height;
      const collapsedHeight = summary.getBoundingClientRect().height + parseFloat(getComputedStyle(details).paddingTop) + parseFloat(getComputedStyle(details).paddingBottom) + parseFloat(getComputedStyle(details).borderTopWidth) + parseFloat(getComputedStyle(details).borderBottomWidth);
      details.style.height = startHeight + 'px';
      details.style.overflow = 'clip';
      animation = details.animate([{height:startHeight+'px'},{height:(open?expandedHeight:collapsedHeight)+'px'}],{duration:open?320:240,easing:ease});
    }
    const current = animation;
    current.onfinish = () => {
      if (animation !== current) return;
      details.open = desired;
      animation = undefined;
      clean();
      if (returnFocus) summary.focus({preventScroll:true});
    };
  };
  disclosures.set(details, {setOpen, summary});
  summary.setAttribute('aria-expanded', String(details.open));
  summary.addEventListener('click', event => {
    event.preventDefault();
    const opening = !desired;
    if (opening && !isMenu) {
      const group = details.closest('.faq-stack:not(.intern-roles)');
      group?.querySelectorAll('details').forEach(other => {
        if (other !== details) disclosures.get(other)?.setOpen(false);
      });
    }
    setOpen(opening);
  });
  if (isMenu) {
    panel.querySelectorAll('a').forEach(link => link.addEventListener('click', () => setOpen(false)));
    document.addEventListener('click', event => {
      if (desired && !details.contains(event.target)) setOpen(false);
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && desired) setOpen(false, true);
    });
  }
  motionPreference.addEventListener('change', () => setOpen(desired));
});

if (useMotion() && 'IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      if (useMotion()) entry.target.animate(
        [{transform:'translateY(12px)',opacity:.8},{transform:'translateY(0)',opacity:1}],
        {duration:700,easing:ease}
      );
      observer.unobserve(entry.target);
    }
  }, {threshold:.06,rootMargin:'0px 0px -28px 0px'});
  document.querySelectorAll('.section-top,.project-stage,.studio-band h2,.split-heading,.hello h2').forEach(el => observer.observe(el));
}

const f=document.querySelector('#project-form');if(f)f.addEventListener('submit',e=>{e.preventDefault();const d=new FormData(f);const body=['Name: '+d.get('name'),'Business: '+d.get('business'),'Email: '+d.get('email'),'Service: '+d.get('service'),'',d.get('message')].join(String.fromCharCode(10));location.href='mailto:tivorosupport@gmail.com?subject='+encodeURIComponent('Project enquiry: '+(d.get('business')||d.get('name')))+'&body='+encodeURIComponent(body);document.querySelector('#form-status').textContent='Review the message in your email app before sending. If it did not open, email us directly.'});

// Student programme application: visitor reviews and sends in WhatsApp.
const studentApplication=document.querySelector('#student-application');if(studentApplication)studentApplication.addEventListener('submit',event=>{event.preventDefault();const data=new FormData(studentApplication);const lines=['Tivoro student / internship application'];for(const [key,value] of data.entries()){const field=studentApplication.elements.namedItem(key);const label=field?.closest('label')?.childNodes[0]?.textContent?.trim()||key;lines.push(label+': '+value);}const url='https://wa.me/918826758881?text='+encodeURIComponent(lines.join(String.fromCharCode(10)));window.open(url,'_blank','noopener,noreferrer');document.querySelector('#student-form-status').textContent='Review the message in WhatsApp before sending. If it did not open, use the direct discussion link.';});
