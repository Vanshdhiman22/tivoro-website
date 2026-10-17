// A native sticky section: vertical page travel becomes horizontal project travel.
// No wheel/touch interception. Normal scrolling resumes at either end.
(() => {
  const section = document.querySelector('.project-showcase');
  if (!section) return;
  const pin = section.querySelector('.showcase-pin');
  const viewport = section.querySelector('.showcase-window');
  const track = section.querySelector('.showcase-track');
  const cards = [...section.querySelectorAll('.showcase-card')];
  const stages = cards.map(card => card.querySelector('.project-stage'));
  const buttons = [...section.querySelectorAll('[data-project-go]')];
  const bar = section.querySelector('.showcase-progress span');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const capture = new URLSearchParams(location.search).has('capture');
  let enabled = false, start = 0, distance = 0, frame = 0, current = 0, target = 0;
  let previous = 0, positions = [], active = -1, resizeFrame = 0;
  let centers = [], viewportWidth = 1;
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

  function select(index) {
    if (index === active) return;
    active = index;
    section.dataset.activeProject = cards[index].dataset.project;
    buttons.forEach((button, i) => {
      if (i === index) button.setAttribute('aria-current', 'true');
      else button.removeAttribute('aria-current');
    });
  }
  function paint() {
    const x = enabled ? current : viewport.scrollLeft;
    if (enabled) track.style.transform = `translate3d(${-x}px,0,0)`;
    const nearest = positions.reduce((best, pos, i) => Math.abs(pos - x) < Math.abs(positions[best] - x) ? i : best, 0);
    select(nearest);
    bar.style.transform = `scaleX(${distance ? clamp(x / distance, 0, 1) : 0})`;
    stages.forEach((stage, i) => {
      const depth = enabled ? clamp((centers[i] - x - viewportWidth/2)/viewportWidth, -1, 1) : 0;
      stage.style.setProperty('--travel-y', (Math.abs(depth)*8)+'px');
      stage.style.setProperty('--travel-rotate', (-depth*4)+'deg');
      stage.style.setProperty('--travel-scale', String(1-Math.abs(depth)*.035));
    });
  }
  function tick(now) {
    frame = 0;
    const dt = Math.min((now - previous) / 1000 || .016, .06);
    previous = now;
    current += (target - current) * (1 - Math.exp(-dt * 14));
    if (Math.abs(target - current) < .15) current = target;
    paint();
    if (current !== target) frame = requestAnimationFrame(tick);
    else track.style.willChange = '';
  }
  function update() {
    if (!enabled) return;
    target = clamp(scrollY - start, 0, distance);
    if (Math.abs(target - current) < .15) return;
    track.style.willChange = 'transform';
    if (!frame) { previous = performance.now(); frame = requestAnimationFrame(tick); }
  }
  function measure() {
    resizeFrame = 0;
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    enabled = !reduced.matches && !capture && innerHeight >= 560;
    section.toggleAttribute('data-pinned', enabled);
    track.style.transform = '';
    viewport.scrollLeft = 0;
    // Read layout once; the scroll handler and animation loop only write transforms.
    distance = Math.max(0, track.scrollWidth - viewport.clientWidth);
    const first = cards[0].offsetLeft;
    viewportWidth = viewport.clientWidth;
    centers = cards.map(card => card.offsetLeft + card.offsetWidth/2);
    positions = cards.map(card => clamp(card.offsetLeft - first, 0, distance));
    section.style.height = enabled ? `${pin.offsetHeight + distance}px` : '';
    start = section.getBoundingClientRect().top + scrollY;
    current = target = enabled ? clamp(scrollY - start, 0, distance) : 0;
    section.dataset.scrollMode = enabled ? 'pinned' : capture ? 'overview' : 'native';
    paint();
  }
  function scheduleMeasure() {
    if (!resizeFrame) resizeFrame = requestAnimationFrame(measure);
  }
  function go(index, behavior = 'smooth') {
    index = clamp(index, 0, cards.length - 1);
    if (enabled) window.scrollTo({top: start + positions[index], behavior});
    else viewport.scrollTo({left: positions[index], behavior: reduced.matches ? 'instant' : behavior});
  }
  buttons.forEach((button, i) => button.addEventListener('click', () => go(i)));
  viewport.addEventListener('keydown', event => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    let next;
    if (event.key === 'ArrowRight') next = active + 1;
    if (event.key === 'ArrowLeft') next = active - 1;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = cards.length - 1;
    if (next === undefined) return;
    event.preventDefault(); go(next);
  });
  // Bring an offscreen project into view when reached with the keyboard.
  cards.forEach((card, i) => card.addEventListener('focusin', event => {
    if (enabled && event.target.matches(':focus-visible')) { go(i, 'instant'); current = target = positions[i]; paint(); }
  }));
  viewport.addEventListener('scroll', () => { if (!enabled) paint(); }, {passive:true});
  window.addEventListener('scroll', update, {passive:true});
  window.addEventListener('resize', scheduleMeasure, {passive:true});
  window.addEventListener('pageshow', scheduleMeasure);
  reduced.addEventListener('change', scheduleMeasure);
  document.fonts?.ready.then(scheduleMeasure);
  measure();
})();
