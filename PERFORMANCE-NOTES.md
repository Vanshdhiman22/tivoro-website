# Scroll and navigation responsiveness

The project reel previously interpolated toward the scroll position over repeated frames while running a Three.js image deformation and per-card perspective effects. It now maps native page scrolling directly to one translated track in a single scheduled frame. The homepage no longer requests the Three.js runtime or project-flow bundle (614,392 bytes of JavaScript removed from the active page).

The previous page transition waited 520 ms before starting navigation, then covered the destination for a 760 ms reveal. Links now retain their default navigation action. Supported browsers use a 260 ms native snapshot reveal after the destination is ready; other browsers navigate normally. No canvas cover or pending-page curtain remains. Primary destinations are prefetched at idle or on intent, respecting Save-Data. Public links use canonical routes to avoid the .html redirect.

The approved logo, seven business pages, five-project pinned reel, mobile controls and reduced-motion behavior remain. The older ThreeUI reference files and build output are retained for provenance but are not requested by the homepage.

Browser checks: desktop and mobile track positions matched the native scroll offset within 0.001 CSS px in the sampled scroll observations; zero canvases on the homepage; native page changes completed with no covering overlay; native reveal computed duration 0.26 s; no console errors. These are interaction checks, not an FPS benchmark on the user's hardware.
