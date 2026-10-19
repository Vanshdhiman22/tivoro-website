# Inner-page motion

Shared page-motion assets complement the existing title and text entrances on all seven pages. Work has five project media reveals, captions, numbered labels, a finite scroll cue and small scroll-driven screenshot depth. Product prototypes, analytics nodes, portraits, founder profiles and form rows have purpose-specific staggered entrances. Service detail rules draw once. Navigation, card arrows, prototypes and inputs provide hover/focus feedback.

One scroll scheduler updates only visible images from cached screenshot geometry; screenshot depth is disabled on narrow/coarse-pointer layouts. No new dependencies, canvases, wheel handlers or delayed navigation. Entrances run once, content is readable by default, and reduced motion cancels Web Animations and disables CSS movement. The approved layout, story copy, logo and page routes remain intact.


## Page changes — 19 October 2026

Internal page links retain immediate native navigation and intent prefetch. An early, session-scoped arrival marker triggers a 620ms fade/glide on the first section and a 700ms, 65ms-staggered entrance on the next section. Mobile uses 540/600ms and smaller distances. The header stays still, with a 720ms terracotta top line. There is no exit delay or blocking overlay. Reduced motion and capture mode disable this effect; bfcache restoration clears the marker.

Verified locally: Work → About → Work, browser Back, and mobile menu → Contact (390px, 540ms arrival, no horizontal overflow). Shared bundle/static checks passed for nine pages plus 404.
