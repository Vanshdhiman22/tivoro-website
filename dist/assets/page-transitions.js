// Sylva is a motion reference only. This transition is authored for Tivoro;
// the ThreeUI forest, presentation, runtime and component are not embedded.
(() => {
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  const capture = new URLSearchParams(location.search).has('capture');
  const key = 'tivoro-page-transition';
  const normalize = path => path.replace(/\/index\.html$/, '/').replace(/\.html$/, '').replace(/\/$/, '') || '/';
  const pages = new Set(['/', '/about', '/work', '/contact', '/website-design-development', '/product-design-development', '/tools-analytics']);
  const enabled = () => !capture && !preference.matches;
  let layer, canvas, context, logo, frame = 0, busy = false, cancelRun;

  function clear() {
    if (frame) cancelAnimationFrame(frame); frame = 0;
    layer?.remove(); layer = canvas = context = logo = null;
    delete document.documentElement.dataset.pageTransition;
    busy = false;
  }
  function mount() {
    layer = document.createElement('div'); layer.className = 'page-transition-layer';
    layer.setAttribute('aria-hidden', 'true');
    canvas = document.createElement('canvas');
    logo = document.createElement('span');logo.className = 'transition-wordmark brand-wordmark-art';
    layer.append(canvas, logo);document.body.append(layer);
    context = canvas.getContext('2d');
    if (!context) {clear();return false;}
    return true;
  }
  function run(mode, origin, complete) {
    if (!mount()) {complete(true);return;}
    document.documentElement.dataset.pageTransition = mode;
    document.body.dataset.lastPageTransition = mode;
    const width = innerWidth, height = innerHeight;
    const dpr = Math.min(devicePixelRatio || 1, 1.5);
    canvas.width = Math.ceil(width*dpr);canvas.height = Math.ceil(height*dpr);
    context.setTransform(dpr,0,0,dpr,0,0);
    const cx = Math.max(.08,Math.min(.92,origin.x))*width;
    const cy = Math.max(.08,Math.min(.92,origin.y))*height;
    const reach = Math.hypot(Math.max(cx,width-cx),Math.max(cy,height-cy))*1.16;
    const duration = mode === 'leaving' ? 520 : 760;
    const started = performance.now();
    let done = false;
    const finish = success => {
      if (done) return;done = true;
      clearTimeout(failSafe);
      if (frame) cancelAnimationFrame(frame);frame = 0;
      if (mode === 'entering' || !success) clear();
      complete(success);
    };
    // Even a paused browser tab must finish navigation and never trap a cover.
    const failSafe = setTimeout(() => finish(true), mode === 'leaving' ? 950 : 1400);
    cancelRun = () => finish(false);

    function boundary(radius, progress) {
      const points = [];
      for (let i=0;i<72;i++) {
        const angle = i/72*Math.PI*2;
        const wobble = 1 + .032*Math.sin(angle*3 + progress*.9) + .018*Math.sin(angle*5-progress*.65);
        points.push([cx+Math.cos(angle)*radius*wobble,cy+Math.sin(angle)*radius*wobble]);
      }
      return points;
    }
    function trace(points) {
      let last = points[points.length-1],first = points[0];
      context.moveTo((last[0]+first[0])/2,(last[1]+first[1])/2);
      for(let i=0;i<points.length;i++) {
        const p=points[i],next=points[(i+1)%points.length];
        context.quadraticCurveTo(p[0],p[1],(p[0]+next[0])/2,(p[1]+next[1])/2);
      }
      context.closePath();
    }
    function draw(progress) {
      const eased = mode === 'leaving' ? progress*progress*(3-2*progress) : 1-Math.pow(1-progress,2.9);
      const radius = reach*eased;
      const points = boundary(radius,progress);
      context.clearRect(0,0,width,height);
      context.beginPath();
      if (mode === 'entering') context.rect(0,0,width,height);
      trace(points);context.fillStyle='#304b3c';context.fill('evenodd');
      // A pale scan front, followed by a small amount of drifting grain.
      context.beginPath();trace(points);
      context.strokeStyle=`rgba(220,227,211,${.22*(1-progress)})`;context.lineWidth=12;context.stroke();
      context.strokeStyle=`rgba(247,245,239,${.72*(1-progress)})`;context.lineWidth=1.4;context.stroke();
      for(let i=0;i<24;i++) {
        const angle=i*2.399963 + progress*.12;
        const drift=Math.sin(i*1.31+progress*2)*15;
        const r=radius+drift+8;
        const x=cx+Math.cos(angle)*r,y=cy+Math.sin(angle)*r;
        context.beginPath();context.arc(x,y,.7+(i%4)*.4,0,Math.PI*2);
        context.fillStyle=`rgba(220,227,211,${(1-progress)*.55})`;context.fill();
      }
      logo.style.opacity = mode === 'entering' ? Math.max(0,1-progress*3) : Math.max(0,(progress-.7)/.3);
    }
    draw(0);
    function tick(now) {
      frame=0;
      if (!enabled()) {finish(true);return;}
      const progress=Math.min(1,(now-started)/duration);draw(progress);
      if(progress>=1)finish(true);else frame=requestAnimationFrame(tick);
    }
    frame=requestAnimationFrame(tick);
  }

  const arrival = window.__tivoroArrival;
  delete window.__tivoroArrival;
  if (arrival && enabled()) run('entering',arrival,()=>{
    document.body.dataset.lastPageTransition='complete';
    document.dispatchEvent(new Event('tivoro:page-revealed'));
  });
  else delete document.documentElement.dataset.pageTransition;

  document.addEventListener('click', event => {
    if (!enabled() || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const anchor = event.target.closest('a[href]');
    if (!anchor || anchor.hasAttribute('download') || (anchor.target && anchor.target !== '_self')) return;
    const destination = new URL(anchor.href,location.href);
    if (destination.origin !== location.origin || !pages.has(normalize(destination.pathname)) || normalize(destination.pathname) === normalize(location.pathname)) return;
    event.preventDefault();
    if (document.documentElement.dataset.pageTransition === 'entering') cancelRun?.();
    if (busy) return;
    busy=true;
    const rect=anchor.getBoundingClientRect();
    const origin={x:(event.detail ? event.clientX : rect.left+rect.width/2)/innerWidth,y:(event.detail ? event.clientY : rect.top+rect.height/2)/innerHeight};
    const record={...origin,path:normalize(destination.pathname),at:Date.now()};
    try {sessionStorage.setItem(key,JSON.stringify(record));}catch{}
    run('leaving',origin,success=>{
      if (!success) {try{sessionStorage.removeItem(key);}catch{}return;}
      location.assign(destination.href);
    });
  });
  document.addEventListener('keydown',event=>{if(event.key==='Escape' && busy)cancelRun?.();});
  window.addEventListener('pageshow',event=>{if(event.persisted)clear();});
  window.addEventListener('pagehide',()=>{if(frame)cancelAnimationFrame(frame);frame=0;});
})();
